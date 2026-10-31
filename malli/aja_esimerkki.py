"""Compare actual corrected rule dispatch and MILP using a full user price year."""
import sys
from pathlib import Path
import pandas as pd
from sim import sim,annual_cost
from lp2 import load_spot,load_fcr,dispatch,annual,audit


def main():
    data=Path(__file__).resolve().parent.parent/'data'
    p=pd.read_csv(data/'esimerkkiprofiilit.csv')
    a=[p.sikala_sahko_kwh.values,p.sikala_lampo_kwh.values,p.pv_kwh_per_kwp.values,p.ulkolampotila_C.values]
    spot=load_spot(sys.argv[1])
    base=annual_cost(sim(*a,PV=0,BESS=0,pricing='spot',spot=spot))
    for name,settings in [('PV',{'BESS':0}),('PV+akku, PV-ohjaus',{}),('PV+akku, pörssiohjaus',{'battery_mode':'spot'})]:
        o=sim(*a,spot=spot,pricing='spot',**settings);cost=annual_cost(o)
        print(f'{name:30s} {cost:12.2f} €/v, säästö {base-cost:12.2f} €/v')
    fcr=load_fcr(data/'fingrid_fcr_d_ylos_tuntihinnat.csv',2025)
    for name,prices in [('MILP',None),('MILP+FCR (ennakkotieto)',fcr)]:
        o=dispatch(*a,spot,E=60,fcr=prices);v=annual(o,*a[:2],spot,fcr=prices)
        print(f'{name:30s} {v["cost"]:12.2f} €/v, kulumisproksi erikseen {v["wear_proxy"]:.2f} €/v')
        print(audit(o,*a[:2]))
    print('MILP on ennakkotietoa käyttävä vertailu. Katso docs/MENETELMA.md.')


if __name__=='__main__':main()
