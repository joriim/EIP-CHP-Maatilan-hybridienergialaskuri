#!/usr/bin/env python3
"""Hakee Suomen pörssisähkön tuntihinnat vuodelle ja muuntaa ne laskurin Hintahistoria-välilehdelle sopiviksi.

Käyttö:
    python hae_porssihinnat.py 2025                 # hakee hinnat sahkotin.fi-palvelusta
    python hae_porssihinnat.py 2025 omat_hinnat.csv # Sähköttimen tai Eleringin FI-CSV
    python hae_porssihinnat.py 2025 omat_hinnat.json # Energy-Chartsin FI-JSON

Tulos: porssihinnat_<vuosi>.csv, jossa 8 760 riviä (1.1. klo 00 EET ... 31.12. klo 23 EET).
Avaa tiedosto, kopioi sarake 'hinta_eur_mwh' ja liitä laskurin välilehdelle Hintahistoria vuoden
sarakkeeseen riviltä 2 (C = 2023, D = 2024, E = 2025, F = 2026; Liitä määräten -> Arvot).
Kesken olevan vuoden puuttuvat tunnit jäävät tyhjiksi; laskuri täyttää ne vuosien keskiarvolla.

Huom: tarkista hintadatan tarjoajan käyttöehdot. Älä jaa hintoja eteenpäin, jos ehdot sitä rajoittavat.
Vartin (15 min) hinnat keskiarvoistetaan tunneiksi. Karkausvuoden 29.2. poistetaan.
"""
import csv, io, json, math, sys, urllib.request
from datetime import datetime, timedelta, timezone
from collections import defaultdict

EET = timezone(timedelta(hours=2))   # laskuri käyttää kiinteää talviaikaa koko vuoden


def lue(teksti):
    teksti = teksti.lstrip('\ufeff')
    if not teksti.strip():
        raise ValueError('Hintatiedosto on tyhjä.')
    if teksti.lstrip().startswith('{'):
        aineisto = json.loads(teksti)
        if aineisto.get('unit', '').replace(' ', '') != 'EUR/MWh':
            raise ValueError('JSON-hintojen yksikön on oltava EUR/MWh.')
        ajat, hinnat = aineisto['unix_seconds'], aineisto['price']
        if len(ajat) != len(hinnat):
            raise ValueError('Aikaleimoja ja hintoja on eri määrä.')
        return [(datetime.fromtimestamp(t, timezone.utc), float(p))
                for t, p in zip(ajat, hinnat) if p is not None and math.isfinite(float(p))]
    elering = 'Ajatempel (UTC)' in teksti.splitlines()[0]
    rivit = list(csv.reader(io.StringIO(teksti), delimiter=';' if elering else ','))
    if elering and (len(rivit[0]) != 3 or rivit[0][-1] != 'NPS Soome'):
        raise ValueError('Valitse Eleringistä vain Suomen hinnat (fields=fi).')
    data = []
    for r in rivit[1:]:
        if len(r) < 2 or not r[-1].strip():
            continue
        t = (datetime.fromtimestamp(int(r[0]), timezone.utc) if elering else
             datetime.fromisoformat(r[0].strip().replace('Z', '+00:00')))
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
        hinta = float(r[-1].replace(',', '.'))
        if math.isfinite(hinta):
            data.append((t, hinta))
    return data


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    vuosi = int(sys.argv[1])
    if len(sys.argv) > 2:
        from pathlib import Path
        raakadata = Path(sys.argv[2]).read_bytes()
        try:
            teksti = raakadata.decode('utf-8-sig')
        except UnicodeDecodeError:
            teksti = raakadata.decode('iso-8859-1')
    else:
        alku = datetime(vuosi, 1, 1, tzinfo=EET).astimezone(timezone.utc)
        loppu = datetime(vuosi + 1, 1, 1, tzinfo=EET).astimezone(timezone.utc) - timedelta(milliseconds=1)
        url = ('https://sahkotin.fi/prices.csv?start=' + alku.strftime('%Y-%m-%dT%H:%M:%S.000Z')
               + '&end=' + loppu.strftime('%Y-%m-%dT%H:%M:%S.999Z'))
        print('Haetaan', url)
        teksti = urllib.request.urlopen(url, timeout=60).read().decode('utf-8')

    tunnit = defaultdict(list)
    for t, hinta in lue(teksti):
        paikallinen = t.astimezone(EET).replace(minute=0, second=0, microsecond=0, tzinfo=None)
        tunnit[paikallinen].append(hinta)

    ulos, puuttuu = [], 0
    t = datetime(vuosi, 1, 1)
    while t.year == vuosi:
        if not (t.month == 2 and t.day == 29):
            arvot = tunnit.get(t)
            if arvot:
                ulos.append((len(ulos) + 1, t.strftime('%d.%m.%Y %H:%M'), round(sum(arvot) / len(arvot), 3)))
            else:
                ulos.append((len(ulos) + 1, t.strftime('%d.%m.%Y %H:%M'), ''))
                puuttuu += 1
        t += timedelta(hours=1)

    nimi = f'porssihinnat_{vuosi}.csv'
    with open(nimi, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f, delimiter=';')
        w.writerow(['tunti', 'aika_eet', 'hinta_eur_mwh'])
        w.writerows(ulos)
    print(f'Tallennettu {nimi}: {len(ulos)} tuntia, puuttuvia {puuttuu}.')


if __name__ == '__main__':
    main()
