"""Regression tests for corrected physical and economic boundaries."""
import unittest
import numpy as np
from sim import sim,annual_cost,reserve_revenue
from lp2 import dispatch,audit,annual
from talous import replacement_pv,npv,impact_factor


class Regressiot(unittest.TestCase):
    def args(self,n=24):return [np.ones(n)*10,np.zeros(n),np.zeros(n),np.zeros(n)]

    def balance(self,o,el,q):
        # Activation is a battery output exported to grid: both sides of the AC bus.
        e=o['buy']+o['pv']+o['dis']-el-o['ch']-o['gridch']-o['hpel']-o['eb']-o['sell']-o['curt']-o['activation_down']
        h=o['hp']+o['main']+np.r_[0,o['tsoc'][:-1]]-o['tankloss']+o['eb']-o['tsoc']+o['unmet']-q
        self.assertLess(abs(e).max(),1e-7);self.assertLess(abs(h).max(),1e-7)
        stock=o['soc']-np.r_[0,o['soc'][:-1]]-.9*(o['ch']+o['gridch'])+o['dis']+o['activation']-.9*o['activation_down']
        self.assertLess(abs(stock).max(),1e-7)

    def test_fixed_price_never_spot_charges(self):
        a=self.args();prices=np.r_[np.zeros(12),np.ones(12)]
        o=sim(*a,PV=0,spot=prices,pricing='fixed',battery_mode='spot')
        self.assertEqual(o['gridch'].sum(),0)

    def test_tied_prices_charge_and_discharge(self):
        a=self.args();prices=np.r_[np.zeros(12),np.ones(12)*.2]
        o=sim(*a,PV=0,spot=prices,pricing='spot',battery_mode='spot')
        self.assertGreater(o['dis'][16:].sum(),0);self.assertEqual(o['gridch'][3:12].sum(),0)
        self.balance(o,*a[:2])

    def test_reserve_first_empty_and_recharging(self):
        a=self.args(72);o=sim(*a,PV=0,reserve=True,reserve_first=True)
        self.assertEqual(o['r'][0],0);self.assertGreater(o['gridch'].sum(),0)
        self.assertGreater(o['activation'].sum(),0)
        self.assertTrue(np.all(o['soc']>=-1e-8));self.balance(o,*a[:2])
        start=np.r_[0,o['soc'][:-1]]
        self.assertTrue(np.all(start-o['dis']>=o['r']*(1/3+.01)-1e-8))

    def test_parallel_reserve_has_energy_after_own_use(self):
        a=self.args(72);a[2][8:15]=1
        o=sim(*a,reserve=True);start=np.r_[0,o['soc'][:-1]]
        self.assertTrue(np.all(start-o['dis']>=o['r']*(1/3+.01)-1e-8));self.balance(o,*a[:2])

    def test_unserved_heat_blocks_saving(self):
        a=self.args();a[1][:]=400;o=sim(*a,PV=0,BESS=0,main_max=300)
        self.assertEqual(o['unmet'].sum(),2400)
        self.assertEqual(o['base_unmet'].sum(),2400)
        with self.assertRaises(ValueError):annual_cost(o)

    def test_economic_hp_avoids_expensive_grid(self):
        a=self.args();a[1][:]=10;o=sim(*a,PV=0,BESS=0,HP=10)
        self.assertEqual(o['hp'].sum(),0)

    def test_thermal_grid_losses_and_power(self):
        a=self.args(72);a[1][:]=20
        o=sim(*a,PV=0,BESS=0,EB=30,TANK=5,eb_grid=True,
              spot=np.r_[np.ones(24)*-.2,np.ones(48)*.2],pricing='spot',tank_discharge_kw=5)
        self.assertGreater(o['ebgrid'].sum(),0);self.assertGreater(o['tankloss'].sum(),0)
        self.assertTrue(np.all(o['tsoc']<=5*46.5+1e-7));self.balance(o,*a[:2])

    def test_multiple_replacements(self):
        cost=27000;life=6;r=.08;n=20
        expected=sum(.6*cost/(1+r)**t for t in [6,12,18])-.6*cost*(1-2/6)/(1+r)**20
        self.assertAlmostEqual(replacement_pv(cost,life,n,r),expected)
        self.assertEqual(replacement_pv(cost,20,n,r),0)

    def test_no_inverter_outside_horizon(self):
        self.assertEqual(npv(0,0,0,years=10),0)

    def test_motiva_interpolation(self):
        self.assertEqual(impact_factor(2045),35)
        self.assertAlmostEqual(np.mean([impact_factor(y) for y in range(2026,2046)]),116.64285714285715)

    def test_negative_price_milp_is_bounded_and_physical(self):
        a=self.args();s=np.ones(24)*-.2
        o=dispatch(*a,s,PV=0,E=60)
        chk=audit(o,*a[:2]);self.assertLess(chk['elec_err'],1e-6)
        self.assertLess(chk['charge_and_discharge_same_hour'],1e-6)
        self.assertLess(chk['buy_and_sell_same_hour'],1e-6)
        self.assertEqual(o['curt'].sum(),0)

    def test_monthly_peak_charged_once(self):
        a=self.args();s=np.ones(24)*.05
        o=dispatch(*a,s,PV=0,E=0,pch=10)
        self.assertAlmostEqual(o['z'].sum(),10)
        result=annual(o,*a[:2],s,pch=10)
        self.assertAlmostEqual(result['cost'],24*10*(.05+.0756)+100)

    def test_milp_curtailment_is_pv_only(self):
        a=self.args();a[2][:]=.5;s=np.ones(24)*-.2
        o=dispatch(*a,s,PV=200,E=60)
        self.assertTrue(np.all(o['curt']<=o['pv']+1e-6));self.assertLess(audit(o,*a[:2])['elec_err'],1e-6)


    def test_chp_serves_own_load_then_sells(self):
        a=[np.r_[np.ones(12)*2,np.ones(12)*20],np.ones(24)*50,np.zeros(24),np.zeros(24)]
        base=sim(*a,PV=0,BESS=0);o=sim(*a,PV=0,BESS=0,chp_share=.2)
        self.assertLess(abs(o['chp']-.2*o['main']).max(),1e-12)
        self.assertLess(abs(o['chp']-o['chpload']-o['chpsell']).max(),1e-12)
        self.assertLess(abs(base['buy']-o['buy']-o['chpload']).max(),1e-12)
        self.assertTrue(np.all(o['chpload']<=base['buy']+1e-12))
        self.assertGreater(o['chpsell'][:12].sum(),0);self.assertEqual(o['chpsell'][12:].sum(),0)

    def test_chp_extra_fuel_and_revenue_in_cost(self):
        a=[np.ones(24)*5,np.ones(24)*50,np.zeros(24),np.zeros(24)]
        base=sim(*a,PV=0,BESS=0);o=sim(*a,PV=0,BESS=0,chp_share=.2)
        want=annual_cost(base)-np.dot(o['chpload'],o['buyprice'])-o['chprevenue'].sum()+o['chp'].sum()*16/1000/.85
        self.assertAlmostEqual(annual_cost(o),want,places=9)

    def test_chp_off_with_delivered_heat_and_negative_price(self):
        a=[np.ones(24)*5,np.ones(24)*50,np.zeros(24),np.zeros(24)]
        self.assertEqual(sim(*a,PV=0,BESS=0,chp_share=.2,delivered_heat=True)['chp'].sum(),0)
        o=sim(*a,PV=0,BESS=0,chp_share=.2,spot=np.zeros(24),pricing='spot',curtail_negative=True)
        self.assertGreater(o['chpsell'].sum(),0);self.assertEqual(o['chprevenue'].sum(),0)
        with self.assertRaises(ValueError):sim(*a,chp_share=1.5)

    def test_fcr_down_needs_free_storage_and_charging_power(self):
        a=self.args(72);a[2][8:15]=1
        o=sim(*a,PV=200,BESS=60,reserve=True)
        start=np.r_[0,o['soc'][:-1]];P=30
        self.assertTrue(np.all(o['rdown']<=P-o['ch']-o['gridch']+1e-9))
        free=60-start-.9*(o['ch']+o['gridch'])
        self.assertTrue(np.all(.9*o['rdown']/.95*(1/3+.01)<=free+1e-9))
        self.assertTrue(np.all(o['soc']<=60+1e-9));self.assertGreater(o['rdown'].sum(),0)
        self.balance(o,*a[:2])
        off=sim(*a,PV=200,BESS=60,reserve=True,reserve_down=False)
        self.assertEqual(off['rdown'].sum(),0)

    def test_reserve_revenue_fee(self):
        o={'r':np.ones(8760)*10,'rdown':np.ones(8760)*10}
        gross=10*8760*(3.5+6)/1000
        self.assertAlmostEqual(reserve_revenue(o,3.5,6.0,share=.5,monthly_fee=12),gross/2)
        self.assertAlmostEqual(reserve_revenue(o,3.5,6.0,share=.5,monthly_fee=50),gross-600)
        self.assertEqual(reserve_revenue({'r':np.ones(8760)*.1,'rdown':np.zeros(8760)},3.5),0)

if __name__=='__main__':unittest.main()
