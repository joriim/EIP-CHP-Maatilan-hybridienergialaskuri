#!/usr/bin/env python3
"""Muuntaa Fingridin avoimen datan reservihintatiedoston laskurin tuntimuotoon.

Käyttö:
    python scripts/muunna_fingrid_reservi.py fingrid_283.csv
    python scripts/muunna_fingrid_reservi.py 283_2021-01-01T0000_2026-10-31T0000.xlsx

Lähtötieto: Fingrid avoin data, esim. aineisto 283 (FCR-D alas, tuntimarkkinahinnat) ladattuna
CSV- tai Excel-muodossa (sarakkeet startTime, endTime ja arvo; CSV:n erotin pilkku tai puolipiste).
Tulos: reservihinnat_eet.csv, jossa 8 760 riviä ja sarakkeet vuosille 2021–2026.
Kopioi vuoden sarake ilman otsikkoa laskurin välilehdelle Tuntitase_8760h riviltä 2 alkaen:
BJ = 2021, BK = 2022, BL = 2023, BM = 2024, BN = 2025, BO = 2026 (Liitä määräten -> Arvot).

Aikaleimat muunnetaan kiinteään EET-aikaan (UTC+2), alle tunnin hinnat keskiarvoistetaan
tunneiksi ja karkauspäivä 29.2. poistetaan. Puuttuvat tunnit jäävät tyhjiksi.
Fingridin avoin data: CC BY 4.0, lähde Fingrid Oyj.
"""
import csv, io, math, sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone

EET = timezone(timedelta(hours=2))
YEARS = range(2021, 2027)


def lue(teksti):
    teksti = teksti.lstrip('﻿')
    eka = teksti.splitlines()[0]
    erotin = ';' if eka.count(';') > eka.count(',') else ','
    rivit = list(csv.reader(io.StringIO(teksti), delimiter=erotin))
    otsikko = [x.strip().lower() for x in rivit[0]]
    if 'starttime' not in otsikko:
        raise ValueError('Sarake startTime puuttuu: lataa Fingridin avoimen datan CSV.')
    ia = otsikko.index('starttime')
    iv = len(otsikko) - 1
    data = []
    for r in rivit[1:]:
        if len(r) <= iv or not r[iv].strip():
            continue
        t = datetime.fromisoformat(r[ia].strip().replace('Z', '+00:00'))
        if t.tzinfo is None:
            raise ValueError('Aikaleimasta puuttuu aikavyöhyke: ' + r[ia])
        v = float(r[iv].replace(',', '.')) if erotin == ';' else float(r[iv])
        if math.isfinite(v):
            data.append((t, v))
    return data


def tunneiksi(data):
    tunnit = defaultdict(list)
    for t, v in data:
        tunnit[t.astimezone(EET).replace(minute=0, second=0, microsecond=0, tzinfo=None)].append(v)
    sarakkeet = {}
    for vuosi in YEARS:
        rivit, t = [], datetime(vuosi, 1, 1)
        while t.year == vuosi:
            if not (t.month == 2 and t.day == 29):
                arvot = tunnit.get(t)
                rivit.append(round(sum(arvot) / len(arvot), 3) if arvot else '')
            t += timedelta(hours=1)
        assert len(rivit) == 8760
        sarakkeet[vuosi] = rivit
    return sarakkeet


def lue_xlsx(polku):
    """Fingridin Excel-lataus: ensimmäinen taulukko, sarakkeet startTime, endTime, arvo."""
    from openpyxl import load_workbook
    ws = load_workbook(polku, read_only=True, data_only=True).worksheets[0]
    rivit = [['' if v is None else str(v) for v in r] for r in ws.iter_rows(values_only=True)]
    out = io.StringIO()
    csv.writer(out).writerows(rivit)
    return lue(out.getvalue())


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    if sys.argv[1].lower().endswith('.xlsx'):
        sarakkeet = tunneiksi(lue_xlsx(sys.argv[1]))
    else:
        raaka = open(sys.argv[1], 'rb').read()
        try:
            teksti = raaka.decode('utf-8-sig')
        except UnicodeDecodeError:
            teksti = raaka.decode('iso-8859-1')
        sarakkeet = tunneiksi(lue(teksti))
    nimi = sys.argv[2] if len(sys.argv) > 2 else 'reservihinnat_eet.csv'
    with open(nimi, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f, delimiter=';')
        w.writerow(['tunti'] + [str(v) for v in YEARS])
        for i in range(8760):
            w.writerow([i + 1] + [sarakkeet[v][i] for v in YEARS])
    for v in YEARS:
        print(f'{v}: {sum(1 for x in sarakkeet[v] if x != "")} / 8760 tuntia')
    print('Tallennettu', nimi)


if __name__ == '__main__':
    main()
