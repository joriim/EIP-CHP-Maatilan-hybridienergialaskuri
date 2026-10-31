"""Check saved XLSX formulas against independent dispatch for complete years.

Run manually: python malli/test_excel.py laskuri/Maatilan_hybridienergialaskuri.xlsm
(the .xlsx without macros gives the same results).
Native Excel/LibreOffice recalculation is a separate acceptance check.
"""
import sys,json
from pathlib import Path
import numpy as np
import pandas as pd
from excel_tarkistus import Model
from sim import sim,annual_cost,reserve_revenue
from talous import npv


def main():
    path=Path(sys.argv[1]);p=pd.read_csv(Path(__file__).resolve().parent.parent/'data/esimerkkiprofiilit.csv')
    args=[p.sikala_sahko_kwh.values,p.sikala_lampo_kwh.values,p.pv_kwh_per_kwp.values,p.ulkolampotila_C.values]
    model=Model(path);raw=model.cache.copy();panel='Ohjauspaneeli ja Tulokset';hr='Tuntitase_8760h'
    columns={'Z':'buy','AA':'sell','P':'ch','Q':'soc','R':'dis','S':'hp','U':'hpel','Y':'main',
             'V':'eb','W':'tsoc','AH':'gridch','AU':'r','AV':'unmet','AW':'base_main',
             'AX':'base_unmet','AY':'tankloss','AZ':'ebgrid','BA':'activation','BB':'activation_revenue',
             'BD':'chp','BE':'chpload','BF':'chpsell','BG':'chprevenue','BH':'rdown','BI':'activation_down'}
    fcr=pd.read_csv(Path(__file__).resolve().parent.parent/'data/fingrid_fcr_d_ylos_tuntihinnat.csv')['fcr_d_ylos_2025_eur_mw_h'].values
    fcr_dn=pd.read_csv(Path(__file__).resolve().parent.parent/'data/fingrid_fcr_d_alas_tuntihinnat.csv')['fcr_d_alas_2025_eur_mw_h'].values
    prices=np.tile(np.r_[np.zeros(12),np.ones(12)*.2],365)
    cases=[
        ('oletus',{},{}),
        ('ei_akkua',{(panel,'C13'):0},{'BESS':0}),
        ('reservi_ensin',{('Reservimarkkina','C6'):'Kyllä',('Reservimarkkina','C8'):'Kyllästynyt markkina',('Reservimarkkina','C7'):'Reservi ensin'},dict(reserve=True,reserve_first=True)),
        ('rinnakkainen_reservi',{('Reservimarkkina','C6'):'Kyllä',('Reservimarkkina','C8'):'Kyllästynyt markkina'},dict(reserve=True)),
        ('reservi_vain_ylos_2025',{('Reservimarkkina','C6'):'Kyllä',('Reservimarkkina','C37'):'Ei',('Reservimarkkina','C8'):'2025'},dict(reserve=True,reserve_down=False)),
        ('reservi_12kk_oletus',{('Reservimarkkina','C6'):'Kyllä'},dict(reserve=True)),
        ('reservi_2025_ylos_alas',{('Reservimarkkina','C6'):'Kyllä',('Reservimarkkina','C8'):'2025'},dict(reserve=True)),
        ('reservi_vain_alas',{('Reservimarkkina','C6'):'Kyllä',('Reservimarkkina','C8'):'Kyllästynyt markkina',('Reservimarkkina','C36'):'Ei'},dict(reserve=True,reserve_up=False)),
        ('tasahintainen_porssi',{(panel,'K22'):'Pörssihinta',(panel,'K26'):'Pörssiohjattu'},dict(pricing='spot',spot=prices,battery_mode='spot')),
        ('kiintea_porssivalinnalla',{(panel,'K26'):'Pörssiohjattu'},dict(spot=prices,battery_mode='spot')),
        ('lampo_ja_varaaja',{(panel,'C10'):1,(panel,'C11'):1,(panel,'C12'):1,(panel,'K53'):'Kyllä',(panel,'K22'):'Pörssihinta'},dict(HP=10,EB=30,TANK=5,eb_grid=True,pricing='spot',spot=prices)),
        ('chp_15',{(panel,'C15'):1},dict(chp_share=.15)),
        ('chp_porssi_katkaisu',{(panel,'C15'):1,(panel,'K22'):'Pörssihinta',(panel,'K25'):'Kyllä'},dict(chp_share=.15,pricing='spot',spot=prices,curtail_negative=True)),
        ('chp_toimitettu_lampo',{(panel,'C15'):1,(panel,'K62'):'Toimitettu lämpö'},dict(chp_share=.15,delivered_heat=True)),
    ]
    results=[]
    for name,overrides,kw in cases:
        model.cache=raw.copy();model.cache.update(overrides)
        if 'porssi'in name or name=='lampo_ja_varaaja':model.cache.update({('Pörssihinnat','C'+str(i+2)):float(v*1000) for i,v in enumerate(prices)})
        model.calculate();expected=sim(*args,**kw);error=0.
        for c,key in columns.items():
            want=expected[key]
            if c=='V':want=expected['eb']-expected['ebgrid']
            got=np.array([model.get(hr,c+str(r))for r in range(2,8762)])
            e=float(np.abs(got-want).max());error=max(error,e)
            if e>1e-7:raise AssertionError(f'{name}: {c}/{key} mismatch {e}')
        state=model.get(panel,'K14')
        assert state=='OK',(name,state)
        result=dict(case=name,max_hourly_error=error,annual_cash_saving=model.get(panel,'E51'),npv=model.get(panel,'E54'))
        if 'reservi' in name:
            if name=='reservi_vain_ylos_2025':
                ok=np.isfinite(fcr);want=reserve_revenue(expected,np.where(ok,fcr,0)*8760/ok.sum())
            elif name=='reservi_12kk_oletus':
                base=Path(__file__).resolve().parent.parent/'data'
                up=pd.read_csv(base/'fingrid_fcr_d_ylos_tuntihinnat.csv');dn=pd.read_csv(base/'fingrid_fcr_d_alas_tuntihinnat.csv')
                h=np.arange(1,8761)<=6407
                pu=np.where(h,up.fcr_d_ylos_2026_eur_mw_h,up.fcr_d_ylos_2025_eur_mw_h).astype(float)
                pdn=np.where(h,dn.fcr_d_alas_2026_eur_mw_h,dn.fcr_d_alas_2025_eur_mw_h).astype(float)
                pu=np.nan_to_num(pu)*8760/np.isfinite(pu).sum();pdn=np.nan_to_num(pdn)*8760/np.isfinite(pdn).sum()
                want=reserve_revenue(expected,pu,pdn)
            elif name=='reservi_2025_ylos_alas':
                want=reserve_revenue(expected,fcr,fcr_dn)
            else:want=reserve_revenue(expected,3.5,6.0)
            got=model.get('Reservimarkkina','C30');result['reserve_revenue']=got
            assert abs(got-want)<1e-6,(name,got,want)
        results.append(result);print(json.dumps(result,ensure_ascii=False),flush=True)
        if name=='oletus':
            base=annual_cost(sim(*args,PV=0,BESS=0));saving=base-annual_cost(expected)
            expected_npv=npv(177000,70800,saving,battery_cost=27000,battery_cycles=expected['dis'].sum()/60)
            assert abs(result['npv']-expected_npv)<1e-6
            if '--write-caches'in sys.argv:model.save_caches()
        if name=='chp_15':
            base=annual_cost(sim(*args,PV=0,BESS=0));saving=base-annual_cost(expected)
            chp_cost=.15*300*3000;gross=177000+chp_cost
            expected_npv=npv(gross,.4*gross,saving,battery_cost=27000,battery_cycles=expected['dis'].sum()/60,
                             chp_cost=chp_cost,chp_kwh=expected['chp'].sum())
            assert abs(model.get(panel,'K68')-expected['chp'].sum())<1e-6
            assert abs(result['npv']-expected_npv)<1e-6,(result['npv'],expected_npv)
        if name=='chp_toimitettu_lampo':assert model.get(panel,'G15')==0 and model.get(panel,'K68')==0
    # Boundary changes must expose incomplete service and missing input.
    for name,overrides,want in [
        ('lampovaje',{(panel,'D14'):10},'Lämpövaje'),
        ('hintadata_puuttuu',{(panel,'K22'):'Pörssihinta'},'Hintadata puuttuu'),
        ('chp_osuus_virheellinen',{(panel,'C15'):1,(panel,'D15'):1.5},'Virhe parametreissa'),
        ('reservihinta_puuttuu',{('Reservimarkkina','C6'):'Kyllä',('Reservimarkkina','C8'):'2025'},'Reservihinta puuttuu'),
        ('kulutusdata_puuttuu',{(panel,'D4'):'Oma data'},'Kulutusdata puuttuu'),
    ]:
        model.cache=raw.copy();model.cache.update(overrides)
        if name=='reservihinta_puuttuu':model.cache.update({(hr,'BN'+str(i)):None for i in range(2,8762)})
        model.calculate()
        assert model.get(panel,'K14')==want,(name,model.get(panel,'K14'))
        assert model.get(panel,'E54')=='Ei laskettavissa'
        print(json.dumps(dict(case=name,status=want),ensure_ascii=False),flush=True)
    # Short horizon: no year-12 inverter. Fast, all physical year caches reused.
    model.cache=raw.copy();model.cache[(panel,'C28')]=10;model.calculate()
    assert model.get(panel,'C62')==0
    print(json.dumps(dict(case='10_vuotta',inverter_pv=0,npv=model.get(panel,'E54')),ensure_ascii=False),flush=True)
    print('Saved-formula regression passed.',flush=True)


if __name__=='__main__':main()
