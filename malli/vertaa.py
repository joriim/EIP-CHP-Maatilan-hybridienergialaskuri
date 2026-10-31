"""Reproduce the fixed-price default comparison: python malli/vertaa.py."""
from pathlib import Path
import pandas as pd
from sim import sim,annual_cost
from talous import npv


def main():
    p=pd.read_csv(Path(__file__).resolve().parent.parent/'data/esimerkkiprofiilit.csv')
    args=[p.sikala_sahko_kwh.values,p.sikala_lampo_kwh.values,p.pv_kwh_per_kwp.values,p.ulkolampotila_C.values]
    base=annual_cost(sim(*args,PV=0,BESS=0))
    results=[]
    for label,kw in [('PV',dict(BESS=0)),('PV + akku',dict(BESS=60)),('PV + akku + LP',dict(BESS=60,HP=10))]:
        o=sim(*args,**kw);saving=base-annual_cost(o)
        gross=150000+kw['BESS']*450+kw.get('HP',0)*950
        value=npv(gross,.4*gross,saving,battery_cost=kw['BESS']*450,
                  battery_cycles=(o['dis'].sum()+o['activation'].sum())/kw['BESS'] if kw['BESS'] else 0)
        results.append((label,saving,gross*.01,value))
        print(f'{label:20s} energiasäästö {saving:10.2f} €/v, ylläpito {gross*.01:8.2f} €/v, NPV {value:10.2f} €')
    print(f'Akun lisä-NPV: {results[1][3]-results[0][3]:.2f} €')


if __name__=='__main__':main()
