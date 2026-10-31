"""Rolling-horizon MILP dispatch 0.9.1 using SciPy/HiGHS.

Separate binary directions prevent fictitious simultaneous import/export and
charge/discharge at negative prices. PV curtailment is bounded by PV output.
Each monthly peak increase is charged exactly once per planning horizon.
Forecast load, weather and FCR prices are assumed known within the horizon;
this is a benchmark with foresight, not an implementable market bidding policy.
"""
import numpy as np
import pandas as pd
import scipy.sparse as sp
from scipy.optimize import milp, Bounds, LinearConstraint

MONTH_H = np.repeat(np.arange(12),[744,672,744,720,744,720,744,744,720,744,720,744])
NAMES=['buy','sell','curt','ch','dis','soc','eb','tsoc','tdis','main','hp','z','r','unmet','bc','gc']


def load_spot(path):
    a=pd.read_csv(path,sep=';')['hinta_eur_mwh'].astype(float).values/1000
    if len(a)!=8760 or not np.isfinite(a).all():
        raise ValueError('Expected 8760 finite hourly spot prices in fixed EET.')
    return a


def load_fcr(path,year=2025):
    a=pd.read_csv(path)[f'fcr_d_ylos_{year}_eur_mw_h'].astype(float).values/1000
    if not np.isfinite(a).all():
        raise ValueError('Incomplete reserve year; choose a complete year or an explicit scenario.')
    return a


def cop_of(T):return np.clip(3.2+.07*np.asarray(T),1.8,4.8)


def dispatch(el,heat,pvk,T,spot,*,PV=200,E=0,P=None,EB=0,TANK=0,HP=0,
             adder=.0756,sellfee=.003,fuel=16,eta_b=.85,pch=0,deg=.01,
             grid_charge=True,main_max=300,fcr=None,share=.5,ler_h=1/3,
             replan_hour=15,co2cost=None,tank_loss_kw=.1,tank_discharge_kw=300,
             activation_hours=.01,recovery_power=.2,availability=.95,
             grid_max=None,delivered_heat=False,hp_min_temp=-25,hp_power_factor=1):
    el,heat,pvk,T,spot=[np.asarray(x,dtype=float) for x in (el,heat,pvk,T,spot)]
    n=len(el)
    if not 0<n<=8760 or any(len(x)!=n or not np.isfinite(x).all() for x in (el,heat,pvk,T,spot)):
        raise ValueError('Matching finite arrays of 1..8760 hours required.')
    if any((x<0).any() for x in (el,heat,pvk)) or min(PV,E,EB,TANK,HP,main_max,tank_loss_kw,pch,deg,activation_hours)<0:
        raise ValueError('Capacities, demand and cost parameters must be nonnegative.')
    if not 0<eta_b<=1 or not 0<=availability<=1 or not 0<=replan_hour<=23:
        raise ValueError('Invalid efficiency, availability or planning hour.')
    if fcr is not None:
        fcr=np.asarray(fcr,dtype=float)
        if len(fcr)!=n or not np.isfinite(fcr).all() or ler_h<=0:raise ValueError('Invalid reserve prices or duration.')
    P=.5*E if P is None else P;ec=.9;Et=TANK*46.5;cop=cop_of(T);pvp=PV*pvk
    G=max(float(el.max()+P+EB+HP/1.8),float(pvp.max()+P),1.) if grid_max is None else float(grid_max)
    fuelc=fuel/1000/(1 if delivered_heat else eta_b)
    out={k:np.zeros(n) for k in NAMES};soc0=tsoc0=0.;mpeak=np.zeros(12)
    starts=sorted(set([0]+list(range(replan_hour,n,24))))
    for j,t0 in enumerate(starts):
        end=min(n,(t0//24+(2 if t0%24>=replan_hour else 1))*24)
        h=end-t0;commit=starts[j+1]-t0 if j+1<len(starts) else h
        idx=np.arange(t0,end);ii=np.arange(h);V=lambda k,i:NAMES.index(k)*h+i;N=len(NAMES)*h
        c=np.zeros(N);c[V('buy',ii)]=spot[idx]+adder+(0 if co2cost is None else np.asarray(co2cost)[idx])
        c[V('sell',ii)]=-(spot[idx]-sellfee);c[V('dis',ii)]=deg;c[V('main',ii)]=fuelc
        c[V('unmet',ii)]=1000
        if fcr is not None:c[V('r',ii)]=-share*fcr[idx]+deg*activation_hours
        lo=np.zeros(N);hi=np.full(N,np.inf);integrality=np.zeros(N,dtype=int)
        for k,limit in dict(buy=G,sell=G,ch=P,dis=P,soc=E,eb=(EB if TANK else 0),tsoc=Et,
                            tdis=tank_discharge_kw,main=main_max,hp=HP*hp_power_factor,
                            r=(P*availability if fcr is not None else 0),bc=1,gc=1,z=0).items():hi[V(k,ii)]=limit
        hi[V('curt',ii)]=pvp[idx];hi[V('unmet',ii)]=heat[idx]
        hi[V('hp',ii[T[idx]<hp_min_temp])]=0
        integrality[V('bc',ii)]=1;integrality[V('gc',ii)]=1
        month_anchor={m:int(np.flatnonzero(MONTH_H[idx]==m)[0]) for m in np.unique(MONTH_H[idx])}
        for a in month_anchor.values():hi[V('z',a)]=np.inf;c[V('z',a)]=pch
        rr=[];cc=[];dd=[];lower=[];upper=[]
        def constraint(terms,lb=-np.inf,ub=np.inf):
            row=len(lower)
            for k,i,a in terms:rr.append(row);cc.append(V(k,i));dd.append(a)
            lower.append(lb);upper.append(ub)
        for i,g in enumerate(idx):
            constraint([('buy',i,1),('dis',i,1),('sell',i,-1),('curt',i,-1),('ch',i,-1),
                        ('eb',i,-1),('hp',i,-1/cop[g]),('r',i,activation_hours)],el[g]-pvp[g],el[g]-pvp[g])
            constraint([('tdis',i,1),('main',i,1),('hp',i,1),('unmet',i,1)],heat[g],heat[g])
            terms=[('soc',i,1),('ch',i,-ec),('dis',i,1),('r',i,activation_hours)]
            constraint(terms+([('soc',i-1,-1)] if i else []),0 if i else soc0,0 if i else soc0)
            # Standing loss approximated as fractional loss at full tank; documented.
            retention=max(0,1-tank_loss_kw/Et) if Et else 1
            constraint([('tsoc',i,1),('eb',i,-1),('tdis',i,1)]+([('tsoc',i-1,-retention)] if i else []),
                       0 if i else retention*tsoc0,0 if i else retention*tsoc0)
            constraint([('buy',i,1),('z',month_anchor[MONTH_H[g]],-1)],ub=mpeak[MONTH_H[g]])
            constraint([('ch',i,1),('bc',i,-P)],ub=0)
            constraint([('dis',i,1),('bc',i,P)],ub=P)
            constraint([('buy',i,1),('gc',i,-G)],ub=0)
            constraint([('sell',i,1),('gc',i,G)],ub=G)
            if fcr is not None and E>0:
                constraint([('dis',i,1),('r',i,1/availability if availability else 1)],ub=P)
                constraint([('ch',i,1),('r',i,recovery_power)],ub=P)
                constraint([('r',i,ler_h),('soc',i,-1)],ub=0)
                # Do not count current-hour charging in beginning-of-hour energy cover.
                constraint([('r',i,ler_h+activation_hours),('dis',i,1)]+([('soc',i-1,-1)] if i else []),ub=0 if i else soc0)
                constraint([('r',i,activation_hours),('sell',i,-1)],ub=0)
            if not grid_charge:constraint([('ch',i,1)],ub=max(pvp[g]-el[g],0))
        mat=sp.coo_matrix((dd,(rr,cc)),shape=(len(lower),N)).tocsc()
        res=milp(c,integrality=integrality,bounds=Bounds(lo,hi),
                 constraints=LinearConstraint(mat,np.asarray(lower),np.asarray(upper)),options={'mip_rel_gap':1e-7})
        if not res.success:raise RuntimeError(res.message)
        for k in NAMES:out[k][t0:t0+commit]=res.x[V(k,ii[:commit])]
        soc0=out['soc'][t0+commit-1];tsoc0=out['tsoc'][t0+commit-1]
        for g in range(t0,t0+commit):mpeak[MONTH_H[g]]=max(mpeak[MONTH_H[g]],out['buy'][g])
    out['hpel']=out['hp']/cop;out['pv']=pvp;out['activation']=out['r']*activation_hours
    return out


def audit(o,el,heat):
    e=o['buy']+o['pv']+o['dis']+o['activation']-(el+o['ch']+o['eb']+o['hpel']+o['sell']+o['curt'])
    q=o['tdis']+o['main']+o['hp']+o['unmet']-heat
    return dict(elec_err=float(np.abs(e).max()),heat_err=float(np.abs(q).max()),
                unmet_kwh=float(o['unmet'].sum()),
                roundtrip=float(o['dis'].sum()/max(o['ch'].sum(),1e-9)),
                buy_and_sell_same_hour=float(np.minimum(o['buy'],o['sell']).max()),
                charge_and_discharge_same_hour=float(np.minimum(o['ch'],o['dis']).max()))


def annual(o,el,heat,spot,*,adder=.0756,sellfee=.003,fuel=16,eta_b=.85,pch=0,
           fcr=None,share=.5,standby_kw=0,delivered_heat=False,deg=.01):
    if o['unmet'].sum()>1e-6:raise ValueError('Unserved heat: economic result unavailable.')
    energy=np.dot(o['buy'],spot+adder)-np.dot(o['sell'],spot-sellfee)
    boiler_on=o['main']>.01
    fuel_mwh=(o['main'].sum()+standby_kw*boiler_on.sum())/(1 if delivered_heat else eta_b)/1000
    peaks=sum(o['buy'][MONTH_H[:len(el)]==m].max(initial=0) for m in np.unique(MONTH_H[:len(el)]))
    revenue=share*np.dot(o['r'],fcr) if fcr is not None else 0
    wear=deg*(o['dis'].sum()+o['activation'].sum())
    return dict(cost=float(energy+fuel_mwh*fuel+pch*peaks-revenue),fcr_rev=float(revenue),
                wear_proxy=float(wear),cost_with_wear_proxy=float(energy+fuel_mwh*fuel+pch*peaks-revenue+wear),
                fuel_mwh=float(fuel_mwh),boiler_hours=int(boiler_on.sum()),peaks=float(peaks))
