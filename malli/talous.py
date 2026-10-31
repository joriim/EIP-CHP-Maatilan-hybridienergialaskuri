"""Auditable discounted cash flows; replacement times can be fractional years."""
import numpy as np


def replacement_pv(cost,life,years,rate,share=.6):
    if life<1 or not 1<=years<=100 or rate<0:raise ValueError('Unsupported life, horizon or rate.')
    times=[j*life for j in range(1,101) if j*life<years-1e-7]
    renew=cost*share
    residual=renew*max(0,1-(years-times[-1])/life) if times else 0
    return sum(renew/(1+rate)**t for t in times)-residual/(1+rate)**years


def npv(gross,subsidy,annual_saving,*,battery_cost=0,battery_cycles=0,
        cycle_life=6000,calendar_life=15,years=20,rate=.08,
        maintenance=.01,inverter_cost=12000,reserve_revenue=0,reserve_growth=0,
        chp_cost=0,chp_kwh=0,chp_om=15,chp_life=15,chp_renewal=.8):
    """chp_cost is part of gross. Its O&M is per MWh electricity, not a share of investment."""
    life=min(calendar_life,cycle_life/battery_cycles) if battery_cycles>0 else calendar_life
    if life<1:raise ValueError('Battery life <1 year requires a finer replacement schedule.')
    rep=replacement_pv(battery_cost,life,years,rate) if battery_cost else 0
    inv=inverter_cost/(1+rate)**12 if years>=12 else 0
    chp_rep=0
    if chp_cost and chp_life<years:
        renew=chp_cost*chp_renewal;residual=renew*max(0,1-(years-chp_life)/chp_life)
        chp_rep=renew/(1+rate)**chp_life-residual/(1+rate)**years
    flows=sum((annual_saving-maintenance*(gross-chp_cost)-chp_kwh/1000*chp_om+reserve_revenue*(1+reserve_growth)**(t-1))/(1+rate)**t for t in range(1,years+1))
    return -(gross-subsidy)-rep-inv-chp_rep+flows


def impact_factor(year):
    """Own interpolation of Motiva/Sitowise 06/2025 Table 5, PDF p.37."""
    return float(np.interp(year,[2023,2030,2035,2040,2045,2050],[290,155,110,80,35,0]))
