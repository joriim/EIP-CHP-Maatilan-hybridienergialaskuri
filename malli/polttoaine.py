"""Polttoainemoduuli (kevyt versio): oman polttoaineen saatavuus ja seoksen hinta hakekattilalle.

Sama laskenta kuin web/polttoaine.js. Tuottaa vuoden painotetun polttoaineen hinnan (€/MWh polttoainetta)
ja kattilan hyötysuhteen laskurin kenttiin C24 ja C26.

Lämpöarvo saapumistilassa (VTT Technology 258, kaava 2.5): q_ar = q_d (1 − M/100) − 0,02443 M [MJ/kg].
Jakeet käytetään halvimmasta alkaen (€/MWh lämpöä); käyttöä rajoittaa saatavuus ja enimmäisosuus lämmöstä.

Käyttö: python malli/polttoaine.py [--kirjoita-testit]   (tulostaa esimerkin tai päivittää yhteiset testitapaukset)
"""
import copy
import json
import sys
from pathlib import Path

H2O = 0.02443
KEYS = ['puu', 'olki', 'vilja']
DEFAULTS = {
    'puu': dict(nimi='Harvennuspuu (oma tuorehake)', yksikko='k-m³', maara=0, tiheys=400, kosteus=50, lampoarvo=19.2,
                kustannus=28, havikki=0, maxOsuus=100, hyotysuhde=0.85),
    'olki': dict(nimi='Olki', yksikko='t', ala=0, sato=2, kosteus=20, lampoarvo=17.4,
                 kustannus=45, havikki=5, maxOsuus=20, hyotysuhde=0.8),
    'vilja': dict(nimi='Pilaantunut vilja', yksikko='t', maara=0, kosteus=20, lampoarvo=17.5,
                  kustannus=10, havikki=5, maxOsuus=10, hyotysuhde=0.8),
}


def lampoarvo_saapumistilassa(lampoarvo, kosteus):
    """MWh/t; lampoarvo MJ/kg kuiva-aineessa, kosteus p-%."""
    return (lampoarvo * (1 - kosteus / 100) - H2O * kosteus) / 3.6


def _jae(key, f):
    mwh_t = lampoarvo_saapumistilassa(f['lampoarvo'], f['kosteus'])
    if key == 'puu':
        t_m3 = f['tiheys'] / (1 - f['kosteus'] / 100) / 1000
        return f['maara'], mwh_t * t_m3
    return (f['ala'] * f['sato'] if key == 'olki' else f['maara']), mwh_t


def laske(lampo, osto_hinta, osto_hyotysuhde, **jakeet):
    """lampo = kattilan tuottama lämpö MWh/v; jakeet = puu/olki/vilja-sanakirjat, jotka korvaavat oletuksia."""
    inp = {k: {**copy.deepcopy(DEFAULTS[k]), **(jakeet.get(k) or {})} for k in KEYS}
    if lampo < 0 or osto_hinta < 0 or not 0 < osto_hyotysuhde <= 1:
        raise ValueError('lämmöntarve, ostohakkeen hinta tai hyötysuhde')
    osto_lampohinta = osto_hinta / osto_hyotysuhde
    rivit = []
    for k in KEYS:
        f = inp[k]
        maara, mwh = _jae(k, f)
        if not (0 <= f['kosteus'] < 80 and f['lampoarvo'] > 0 and f['kustannus'] >= 0 and 0 <= f['havikki'] < 100
                and 0 <= f['maxOsuus'] <= 100 and 0 < f['hyotysuhde'] <= 1 and maara >= 0 and mwh > 0):
            raise ValueError(f['nimi'])
        energia = maara * (1 - f['havikki'] / 100) * mwh
        hinta = f['kustannus'] / (mwh * (1 - f['havikki'] / 100))
        rivit.append(dict(key=k, maara=maara, mwhPerYksikko=mwh, energia=energia, lampoPotentiaali=energia * f['hyotysuhde'],
                          polttoaineHinta=hinta, lampoHinta=hinta / f['hyotysuhde'], hyotysuhde=f['hyotysuhde'],
                          maxLampo=f['maxOsuus'] / 100 * lampo, kustannusYksikko=f['kustannus'], havikki=f['havikki'],
                          lampo=0., polttoaine=0., kaytetty=0., kustannus=0.))
    jaljella = lampo
    for r in sorted(rivit, key=lambda r: (r['lampoHinta'], KEYS.index(r['key']))):
        if r['lampoPotentiaali'] <= 0 or r['lampoHinta'] >= osto_lampohinta:
            continue
        q = max(0., min(r['lampoPotentiaali'], r['maxLampo'], jaljella))
        r['lampo'] = q
        r['polttoaine'] = q / r['hyotysuhde']
        r['kaytetty'] = r['polttoaine'] / (r['mwhPerYksikko'] * (1 - r['havikki'] / 100))
        r['kustannus'] = r['kaytetty'] * r['kustannusYksikko']
        jaljella -= q
    osto_lampo = max(0., jaljella)
    osto_pa = osto_lampo / osto_hyotysuhde
    rivit.append(dict(key='osto', lampo=osto_lampo, polttoaine=osto_pa, kaytetty=osto_pa, kustannus=osto_pa * osto_hinta,
                      polttoaineHinta=osto_hinta, lampoHinta=osto_lampohinta, hyotysuhde=osto_hyotysuhde))
    pa = sum(r['polttoaine'] for r in rivit)
    kust = sum(r['kustannus'] for r in rivit)
    vain_osto = lampo / osto_hyotysuhde * osto_hinta
    return dict(rivit=rivit, yhteensa=dict(
        lampo=lampo, polttoaine=pa, kustannus=kust, hinta=kust / pa if pa > 0 else osto_hinta,
        hyotysuhde=lampo / pa if pa > 0 else osto_hyotysuhde, lampoHinta=kust / lampo if lampo > 0 else osto_lampohinta,
        omaOsuus=1 - osto_lampo / lampo if lampo > 0 else 0., vainOsto=vain_osto, saasto=vain_osto - kust))


TAPAUKSET = {
    'vain_ostohake': dict(lampo=260, ostoHinta=16, ostoHyotysuhde=0.85),
    'puu_riittaa': dict(lampo=260, ostoHinta=16, ostoHyotysuhde=0.85, puu=dict(maara=400, kustannus=20)),
    'puu_ei_riita': dict(lampo=1300, ostoHinta=16, ostoHyotysuhde=0.85, puu=dict(maara=300, kustannus=20)),
    'kaikki_jakeet': dict(lampo=1300, ostoHinta=30, ostoHyotysuhde=0.85, puu=dict(maara=300),
                          olki=dict(ala=120, sato=2.5), vilja=dict(maara=40)),
    'olki_enimmaisosuus': dict(lampo=500, ostoHinta=30, ostoHyotysuhde=0.85, olki=dict(ala=200, sato=3, maxOsuus=15)),
    'oma_kalliimpi': dict(lampo=500, ostoHinta=12, ostoHyotysuhde=0.85, puu=dict(maara=200, kustannus=40),
                          olki=dict(ala=50, kustannus=90)),
    'markaa_puuta_havikki': dict(lampo=800, ostoHinta=25, ostoHyotysuhde=0.85,
                                 puu=dict(maara=500, kosteus=55, tiheys=385, lampoarvo=19.6, havikki=8, hyotysuhde=0.8)),
    'ei_tarvetta': dict(lampo=0, ostoHinta=16, ostoHyotysuhde=0.85, puu=dict(maara=100)),
}
TESTIT = Path(__file__).resolve().parent.parent / 'data' / 'polttoaine_testitapaukset.json'


def aja(t):
    r = laske(t['lampo'], t['ostoHinta'], t['ostoHyotysuhde'], **{k: t.get(k) for k in KEYS})
    return dict(yhteensa=r['yhteensa'], rivit={x['key']: {k: x[k] for k in ('lampo', 'polttoaine', 'kaytetty', 'kustannus',
                                                                           'polttoaineHinta', 'lampoHinta')} for x in r['rivit']})


if __name__ == '__main__':
    if '--kirjoita-testit' in sys.argv:
        TESTIT.write_text(json.dumps({n: dict(syote=t, tulos=aja(t)) for n, t in TAPAUKSET.items()}, ensure_ascii=False, indent=1) + '\n',
                          encoding='utf-8')
        print('kirjoitettu', TESTIT)
    else:
        print(json.dumps(aja(TAPAUKSET['kaikki_jakeet']), ensure_ascii=False, indent=1))
