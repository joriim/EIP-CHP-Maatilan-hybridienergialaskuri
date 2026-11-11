"""Polttoainemoduuli (kevyt versio): oma polttopuu ja ostopolttoaine hakekattilalle.

Sama laskenta kuin web/polttoaine.js. Oman puun ja ostopolttoaineen ominaisuudet ja hinnat annetaan erikseen;
tulos on seoksen hinta (€/MWh polttoainetta), kattilan hyötysuhde ja energiatiheys (MWh/i-m³) laskurin
kenttiin C24, C26 ja K35.

Lämpöarvo saapumistilassa (VTT Technology 258, kaava 2.5): q_ar = q_d (1 − M/100) − 0,02443 M [MJ/kg].
Oma puu käytetään saatavuuden rajoissa, jos sen lämpö on ostopolttoainetta halvempaa (€/MWh lämpöä).

Käyttö: python malli/polttoaine.py [--kirjoita-testit]   (tulostaa esimerkin tai päivittää yhteiset testitapaukset)
"""
import json
import sys
from pathlib import Path

H2O = 0.02443
KEYS = ['oma', 'osto']
YKSIKOT = ('mwh', 'km3', 'im3')
DEFAULTS = {
    'oma': dict(nimi='Oma polttopuu', maara=0, kosteus=50, lampoarvo=19.2, tiheys=400, tiiviys=0.4,
                hinta=28, hintaYksikko='km3', havikki=0, hyotysuhde=0.85),
    'osto': dict(nimi='Ostopolttoaine', kosteus=40, lampoarvo=19.2, tiheys=400, tiiviys=0.4,
                 hinta=16, hintaYksikko='mwh', havikki=0, hyotysuhde=0.85),
}


def lampoarvo_saapumistilassa(lampoarvo, kosteus):
    """MWh/t; lampoarvo MJ/kg kuiva-aineessa, kosteus p-%."""
    return (lampoarvo * (1 - kosteus / 100) - H2O * kosteus) / 3.6


def ominaisuudet(f):
    """Polttoaineen ominaisuudet ja hinta kaikissa yksiköissä (hinta sisältää varastohävikin)."""
    mwh_t = lampoarvo_saapumistilassa(f['lampoarvo'], f['kosteus'])
    t_km3 = f['tiheys'] / (1 - f['kosteus'] / 100) / 1000
    mwh_km3 = mwh_t * t_km3
    mwh_im3 = mwh_km3 * f['tiiviys']
    per_mwh = {'km3': f['hinta'] / mwh_km3, 'im3': f['hinta'] / mwh_im3, 'mwh': f['hinta']}[f['hintaYksikko']]
    hinta = per_mwh / (1 - f['havikki'] / 100)
    return dict(mwhPerT=mwh_t, tPerKm3=t_km3, mwhPerKm3=mwh_km3, mwhPerIm3=mwh_im3, hintaMwh=hinta,
                hintaKm3=hinta * mwh_km3, hintaIm3=hinta * mwh_im3, lampoHinta=hinta / f['hyotysuhde'])


def laske(lampo, oma=None, osto=None):
    """lampo = kattilan tuottama lämpö MWh/v; oma ja osto = sanakirjat, jotka korvaavat oletuksia."""
    inp = {'oma': {**DEFAULTS['oma'], **(oma or {})}, 'osto': {**DEFAULTS['osto'], **(osto or {})}}
    if lampo < 0 or inp['oma']['maara'] < 0:
        raise ValueError('lämmöntarve tai määrä')
    rivit = []
    for k in KEYS:
        f = inp[k]
        if not (0 <= f['kosteus'] < 80 and f['lampoarvo'] > 0 and f['tiheys'] > 0 and 0 < f['tiiviys'] <= 1 and f['hinta'] >= 0
                and f['hintaYksikko'] in YKSIKOT and 0 <= f['havikki'] < 100 and 0 < f['hyotysuhde'] <= 1
                and lampoarvo_saapumistilassa(f['lampoarvo'], f['kosteus']) > 0):
            raise ValueError(f['nimi'])
        rivit.append(dict(key=k, hyotysuhde=f['hyotysuhde'], havikki=f['havikki'], tiiviys=f['tiiviys'], lampo=0., **ominaisuudet(f)))
    o, b = rivit
    oma_max = inp['oma']['maara'] * (1 - o['havikki'] / 100) * o['mwhPerKm3'] * o['hyotysuhde']
    if oma_max > 0 and o['lampoHinta'] < b['lampoHinta']:
        o['lampo'] = min(oma_max, lampo)
    b['lampo'] = max(0., lampo - o['lampo'])
    for r in rivit:
        r['polttoaine'] = r['lampo'] / r['hyotysuhde']
        r['km3'] = r['polttoaine'] / r['mwhPerKm3'] / (1 - r['havikki'] / 100)
        r['im3'] = r['km3'] / r['tiiviys']
        r['tonnit'] = r['km3'] * r['tPerKm3']
        r['kustannus'] = r['polttoaine'] * r['hintaMwh']
        r['osuus'] = r['lampo'] / lampo if lampo > 0 else 0.
    pa = o['polttoaine'] + b['polttoaine']
    kust = o['kustannus'] + b['kustannus']
    poltettu_im3 = o['polttoaine'] / o['mwhPerIm3'] + b['polttoaine'] / b['mwhPerIm3']
    vain_osto = lampo / b['hyotysuhde'] * b['hintaMwh']
    return dict(rivit=rivit, yhteensa=dict(
        lampo=lampo, polttoaine=pa, kustannus=kust, hinta=kust / pa if pa > 0 else b['hintaMwh'],
        hyotysuhde=lampo / pa if pa > 0 else b['hyotysuhde'], energiatiheys=pa / poltettu_im3 if pa > 0 else b['mwhPerIm3'],
        lampoHinta=kust / lampo if lampo > 0 else b['lampoHinta'], omaOsuus=o['lampo'] / lampo if lampo > 0 else 0.,
        vainOsto=vain_osto, saasto=vain_osto - kust))


TAPAUKSET = {
    'vain_osto': dict(lampo=260),
    'oma_riittaa': dict(lampo=260, oma=dict(maara=400, hinta=20)),
    'oma_ei_riita': dict(lampo=1300, oma=dict(maara=300, hinta=20)),
    'osto_30_eur_mwh': dict(lampo=1300, oma=dict(maara=300), osto=dict(hinta=30)),
    'oma_kalliimpi': dict(lampo=500, oma=dict(maara=200, hinta=40), osto=dict(hinta=12)),
    'osto_irtokuutiohinta': dict(lampo=800, oma=dict(maara=250), osto=dict(hinta=22, hintaYksikko='im3', kosteus=45)),
    'oma_mwh_hinta_havikki': dict(lampo=800, oma=dict(maara=500, kosteus=55, tiheys=385, lampoarvo=19.6, havikki=8, hyotysuhde=0.8,
                                                       hinta=14, hintaYksikko='mwh'), osto=dict(hinta=25, havikki=3)),
    'ei_tarvetta': dict(lampo=0, oma=dict(maara=100)),
}
TESTIT = Path(__file__).resolve().parent.parent / 'data' / 'polttoaine_testitapaukset.json'
RIVIKENTAT = ('lampo', 'polttoaine', 'km3', 'im3', 'tonnit', 'kustannus', 'osuus', 'mwhPerT', 'mwhPerKm3', 'mwhPerIm3',
              'hintaMwh', 'hintaKm3', 'hintaIm3', 'lampoHinta')


def aja(t):
    r = laske(t['lampo'], t.get('oma'), t.get('osto'))
    return dict(yhteensa=r['yhteensa'], rivit={x['key']: {k: x[k] for k in RIVIKENTAT} for x in r['rivit']})


if __name__ == '__main__':
    if '--kirjoita-testit' in sys.argv:
        TESTIT.write_text(json.dumps({n: dict(syote=t, tulos=aja(t)) for n, t in TAPAUKSET.items()}, ensure_ascii=False, indent=1) + '\n',
                          encoding='utf-8')
        print('kirjoitettu', TESTIT)
    else:
        print(json.dumps(aja(TAPAUKSET['osto_30_eur_mwh']), ensure_ascii=False, indent=1))
