"""Hourly rule dispatch 0.12.0; all flows kWh per one-hour step.

SOC is usable AC discharge energy; charge efficiency 0.9, discharge efficiency 1.
Reserve activation is an expected-energy scenario, not frequency replay.
"""
import numpy as np


def sim(el, heat, pv1, T, PV=200, BESS=60, HP=0, EB=0, TANK=0,
        eta=0.9, crate=0.5, gridcharge=None, *, spot=None, pricing='fixed',
        battery_mode='pv', cheap_hours=3, expensive_hours=8, min_spread=.03,
        buy_fixed=.12, sell_fixed=.04, adder=.0756, sellfee=.003, deg=.01,
        fuel=16, eta_b=.85, delivered_heat=False, main_max=500,
        hp_economic=True, cop_a=3.2, cop_b=.07, cop_min=1.8, cop_max=4.8,
        hp_min_temp=-25, hp_power_factor=1, tank_loss_kw=.1, tank_discharge_kw=300,
        eb_grid=False, curtail_negative=False, reserve=False, reserve_first=False,
        reserve_target=.5, reserve_hours=1/3, activation_hours=.01,
        availability=.95, recovery_power=.2, chp_share=0., reserve_up=True,
        reserve_down=True, chp_max=np.inf, chp_min_heat=0.):
    if gridcharge is not None:
        raise ValueError('Use spot=..., pricing="spot", battery_mode="spot" instead of gridcharge.')
    el, heat, pv1, T = [np.asarray(x, dtype=float) for x in (el, heat, pv1, T)]
    n = len(el)
    if any(len(x) != n for x in (heat, pv1, T)) or not all(np.isfinite(x).all() for x in (el, heat, pv1, T)):
        raise ValueError('Input arrays must have matching lengths and finite numbers.')
    if any((x < 0).any() for x in (el, heat, pv1)):
        raise ValueError('Load, heat and PV reference must be nonnegative.')
    if not 0 < eta <= 1 or not 0 < eta_b <= 1 or min(PV,BESS,HP,EB,TANK,main_max,tank_loss_kw,tank_discharge_kw,activation_hours)<0:
        raise ValueError('Invalid capacity, loss or efficiency.')
    if not 0 <= chp_share <= 1 or chp_max < 0 or chp_min_heat < 0:
        raise ValueError('CHP electricity share must be between 0 and 1; limits nonnegative.')
    if not 0 < reserve_hours or not 0 <= reserve_target <= 1 or not 0 <= availability <= 1:
        raise ValueError('Invalid reserve parameters.')
    sp = np.full(n, np.nan) if spot is None else np.asarray(spot,dtype=float)
    if len(sp)!=n: raise ValueError('Price length mismatch.')
    if pricing == 'spot' and not np.isfinite(sp).all():
        raise ValueError('Complete spot prices are required in spot mode.')
    buyprice = sp+adder if pricing=='spot' else np.full(n,buy_fixed)
    sellprice = sp-sellfee if pricing=='spot' else np.full(n,sell_fixed)
    ranks=np.zeros(n,dtype=int); daymax=np.zeros(n)
    for start in range(0,n,24):
        end=min(start+24,n); values=sp[start:end]
        if np.isfinite(values).all():
            order=np.argsort(values,kind='stable');ranks[start+order]=np.arange(1,len(order)+1)
            daymax[start:end]=values.max()
    names=('buy sell main dis ch hp eb hpel direct gridch soc tsoc curt '
           'unmet base_main base_unmet tankloss ebgrid r activation activation_revenue pv cop buyprice sellprice '
           'chp chpload chpsell chprevenue rdown activation_down').split()
    out={k:np.zeros(n) for k in names};soc=tsoc=0.;Et=TANK*46.5;P=crate*BESS
    fuelc=fuel/1000/(1 if delivered_heat else eta_b)
    for t in range(n):
        p=PV*pv1[t];L=el[t];Q=heat[t];d=min(p,L);surplus=p-d
        arbi=pricing=='spot' and battery_mode=='spot'
        dis=0 if reserve and reserve_first else min(L-d,P,soc)
        if arbi and ranks[t]<=24-expensive_hours: dis=0
        ch=min(surplus,P,max(0,(BESS-soc)/eta)) if BESS else 0
        gc=0.
        if BESS and reserve and reserve_first:
            target=min(BESS,max(BESS*reserve_target,P*(reserve_hours+activation_hours)))
            gc=max(0,min(P-ch,(target-soc)/eta-ch))
        elif BESS and arbi and ranks[t]<=cheap_hours and daymax[t]-sp[t]>=min_spread and eta*(daymax[t]+adder-deg)>buyprice[t]:
            gc=max(0,min(P-ch,(BESS-soc)/eta-ch))
        offered=0.
        if reserve and BESS:
            power=P-dis
            if recovery_power>0: power=min(power,max(0,(P-ch-gc)/recovery_power))
            offered=max(0,min(power,max(0,soc-dis)/(reserve_hours+activation_hours)))*availability
        if not reserve_up:offered=0.
        activation=offered*activation_hours
        # FCR-D down: charging headroom and free storage after this hour's planned charge.
        offd=0.
        if reserve and BESS and reserve_down:
            free=max(0,BESS-soc-eta*(ch+gc))
            rec=max(0,(P-dis)/recovery_power) if recovery_power>0 else P
            offd=max(0,min(P-ch-gc,free/(eta*(reserve_hours+activation_hours)),rec))*availability
        act_down=offd*activation_hours
        newsoc=soc+eta*(ch+gc)-dis-activation+eta*act_down
        cop=float(np.clip(cop_a+cop_b*T[t],cop_min,cop_max))
        qhp=min(Q,HP*hp_power_factor) if T[t]>=hp_min_temp else 0.
        php=qhp/cop;hppv=min(max(0,surplus-ch),php)
        if hp_economic and main_max>0 and qhp>0:
            pv_economic=max(0,surplus-ch) if max(0,sellprice[t])/cop<fuelc else 0.
            allowed_el=php if buyprice[t]/cop<fuelc else pv_economic
            qhp=min(qhp,allowed_el*cop);php=qhp/cop;hppv=min(max(0,surplus-ch),php)
        loss=min(tsoc,tank_loss_kw) if TANK else 0.
        available=max(0,tsoc-loss)
        td=min(max(0,Q-qhp),available,tank_discharge_kw) if TANK else 0.
        epv=min(max(0,surplus-ch-php),EB,max(0,Et-available)) if EB and TANK else 0.
        eg=0.
        if eb_grid and EB and TANK and buyprice[t]<fuelc:
            eg=max(0,min(EB-epv,Et-available-epv))
        newtsoc=available+epv+eg-td
        main=min(main_max,max(0,Q-qhp-td));unmet=max(0,Q-qhp-td-main)
        base_main=min(main_max,Q)
        gross_sell=max(0,surplus-ch-php-epv)
        curtail=gross_sell if pricing=='spot' and curtail_negative and sellprice[t]<0 else 0.
        # CHP/ORC, heat-led: electricity = ratio x main-boiler heat, capped at the ORC net maximum,
        # off below the ORC minimum heat input (not with delivered-heat pricing). See orc_params().
        chp=0. if delivered_heat or main*(1+chp_share)<chp_min_heat-1e-9 else min(chp_share*main,chp_max)
        chpload=min(chp,max(0,L-d-dis)+max(0,php-hppv));chpsell=chp-chpload
        chprev=0. if pricing=='spot' and curtail_negative and sellprice[t]<0 else chpsell*sellprice[t]
        buy=max(0,L-d-dis)+max(0,php-hppv)+gc+eg-chpload+act_down
        vals=dict(buy=buy,sell=gross_sell-curtail,main=main,dis=dis,ch=ch,hp=qhp,eb=epv+eg,
                  hpel=php,direct=d,gridch=gc,soc=newsoc,tsoc=newtsoc,curt=curtail,unmet=unmet,
                  base_main=base_main,base_unmet=Q-base_main,tankloss=loss,ebgrid=eg,r=offered,
                  activation=activation,activation_revenue=activation*sellprice[t],pv=p,cop=cop,
                  buyprice=buyprice[t],sellprice=sellprice[t],chp=chp,chpload=chpload,chpsell=chpsell,
                  chprevenue=chprev,rdown=offd,activation_down=act_down)
        for k,v in vals.items():out[k][t]=v
        soc,tsoc=newsoc,newtsoc
    return out


def reserve_revenue(o, fcr_up, fcr_down=None, *, share=.5, monthly_fee=12):
    """Farm's FCR-D capacity revenue, EUR/y. Prices EUR/MW,h (scalar or hourly).

    Gross = sum(up kW x up price + down kW x down price)/1000; the aggregator keeps
    max(gross x (1 - share), 12 x monthly_fee).
    """
    up=np.broadcast_to(np.asarray(fcr_up,dtype=float),o['r'].shape)
    gross=float(np.dot(o['r'],up))
    if fcr_down is not None:
        gross+=float(np.dot(o['rdown'],np.broadcast_to(np.asarray(fcr_down,dtype=float),o['rdown'].shape)))
    gross/=1000
    return max(0.,gross-max(gross*(1-share),12*monthly_fee))


def annual_cost(o, *, fuel=16, eta_b=.85, delivered_heat=False, pch=0,
                fcr=None, fcr_down=None, share=.5, monthly_fee=12, require_full_heat=True):
    if require_full_heat and (o['unmet'].sum()>1e-6 or o['base_unmet'].sum()>1e-6):
        raise ValueError('Heat demand is not fully served; economic comparison is unavailable.')
    months=np.repeat(np.arange(12),[744,672,744,720,744,720,744,744,720,744,720,744])[:len(o['buy'])]
    peak=sum(o['buy'][months==m].max(initial=0) for m in np.unique(months))
    # CHP electricity is produced from extra fuel at the boiler efficiency.
    fuelcost=(o['main'].sum()+o['chp'].sum())*fuel/1000/(1 if delivered_heat else eta_b)
    caprev=0 if fcr is None else reserve_revenue(o,fcr,fcr_down,share=share,monthly_fee=monthly_fee)
    return float(np.dot(o['buy'],o['buyprice'])-np.dot(o['sell'],o['sellprice'])
                 -o['activation_revenue'].sum()-o['chprevenue'].sum()+fuelcost+pch*peak-caprev)


def orc_params(gross_kwe=40., heat_in=640., supply=110., ret=30., ref_supply=110., ref_ret=25.,
               own_use=.10, min_heat=450., dt_evap=10., dt_cond=12.):
    """40 kWe ORC module on the main boiler (workbook K69-K79).

    Gross efficiency at the reference temperatures = gross_kwe / heat_in and scales with the
    Carnot factor 1 - (ret + dt_cond) / (supply - dt_evap) (kelvin). Returns the electricity
    per delivered heat (chp_share), net maximum (chp_max, kW) and minimum heat input (kW;
    the manufacturer's datasheet operating range is 450-640 kWth).
    """
    carnot = lambda m, r: 1 - (r + dt_cond + 273.15) / (m - dt_evap + 273.15)
    ratio = carnot(supply, ret) / carnot(ref_supply, ref_ret)
    eta = max(0., gross_kwe / heat_in * ratio * (1 - own_use))
    return dict(eta_net=eta, chp_share=eta / (1 - eta) if eta < 1 else 0.,
                chp_max=max(0., min(gross_kwe, gross_kwe * ratio) * (1 - own_use)), chp_min_heat=min_heat)
