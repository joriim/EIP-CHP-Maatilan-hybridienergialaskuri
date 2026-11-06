#!/usr/bin/env python3
"""Kokoaa selainversion web/index.html: sivu (web/sovellus.html), malli (web/malli.js),
käyttöliittymä (web/sovellus.js) ja data (data/*.csv).

Käyttö: python scripts/rakenna_web.py [--vain-sisalto POLKU]
Tulos on yksi itsenäinen HTML-tiedosto, joka toimii ilman palvelinta (myös GitHub Pagesissa).
--vain-sisalto kirjoittaa lisäksi version ilman <html>/<head>/<body>-runkoa upotuksia varten.
"""
import csv, json, math, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'


def cols(name):
    with open(DATA / name, encoding='utf-8') as f:
        rows = list(csv.reader(f))
    head, body = rows[0], rows[1:]
    assert len(body) == 8760, (name, len(body))
    return {h: [r[i] for r in body] for i, h in enumerate(head)}


def nums(values, digits):
    out = []
    for v in values:
        if v == '':
            out.append(None)
            continue
        x = round(float(v), digits)
        out.append(int(x) if x == int(x) else x)
    return out


BEGIN, END = '<!-- RAKENNUSHAKU-SILTA -->', '<!-- /RAKENNUSHAKU-SILTA -->'


def rakennushaku(src=None):
    """Rakennushaun sivu + silta laskuriin. Palauttaa sivun koon kilotavuina."""
    target = ROOT / 'web' / 'rakennushaku.html'
    page = Path(src).read_text(encoding='utf-8') if src else target.read_text(encoding='utf-8')
    page = re.sub(re.escape(BEGIN) + '.*?' + re.escape(END) + '\n?', '', page, flags=re.S)
    assert 'root.RH = RH' in page and '</body>' in page, 'ei Rakennushaun selainversio'
    silta = (ROOT / 'web' / 'rakennushaku_silta.js').read_text(encoding='utf-8')
    i = page.rindex('</body>')
    page = page[:i] + BEGIN + '\n<script>\n' + silta + '</script>\n' + END + '\n' + page[i:]
    target.write_text(page, encoding='utf-8')
    return len(page.encode()) // 1024


def main():
    pr = cols('esimerkkiprofiilit.csv')
    up = cols('fingrid_fcr_d_ylos_tuntihinnat.csv')
    dn = cols('fingrid_fcr_d_alas_tuntihinnat.csv')
    ef = cols('fingrid_paastokerroin_2025.csv')
    years = range(2021, 2027)
    data = {
        'temp': nums(pr['ulkolampotila_C'], 2), 'pv': nums(pr['pv_kwh_per_kwp'], 4),
        'sikalaSahko': nums(pr['sikala_sahko_kwh'], 3), 'sikalaLampo': nums(pr['sikala_lampo_kwh'], 3),
        'broileriSahko': nums(pr['broileri_sahko_kwh'], 3), 'broileriLampo': nums(pr['broileri_lampo_kwh'], 3),
        'fcrUp': [nums(up['fcr_d_ylos_%d_eur_mw_h' % y], 3) for y in years],
        'fcrDown': [nums(dn['fcr_d_alas_%d_eur_mw_h' % y], 3) for y in years],
        'ef': nums(ef['paastokerroin_g_co2_kwh'], 3),
    }
    js = 'window.LASKURI_DATA=' + json.dumps(data, separators=(',', ':')) + ';'
    page = (ROOT / 'web' / 'sovellus.html').read_text(encoding='utf-8')
    malli = (ROOT / 'web' / 'malli.js').read_text(encoding='utf-8')
    ui = (ROOT / 'web' / 'sovellus.js').read_text(encoding='utf-8')
    assert '/*DATA*/' in page and '/*MALLI*/' in page and '/*SOVELLUS*/' in page
    body = page.replace('/*DATA*/', js).replace('/*MALLI*/', malli).replace('/*SOVELLUS*/', ui)
    full = ('<!doctype html>\n<html lang="fi">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<!-- Rakennettu: python scripts/rakenna_web.py. Muokkaa web/sovellus.html, web/sovellus.js ja web/malli.js. -->\n'
            + body + '\n</html>\n')
    (ROOT / 'web' / 'index.html').write_text(full, encoding='utf-8')
    print('web/index.html', len(full.encode()) // 1024, 'kt')
    src = sys.argv[sys.argv.index('--rakennushaku') + 1] if '--rakennushaku' in sys.argv else None
    print('web/rakennushaku.html', rakennushaku(src), 'kt')
    if '--vain-sisalto' in sys.argv:
        out = Path(sys.argv[sys.argv.index('--vain-sisalto') + 1])
        out.write_text(body, encoding='utf-8')
        print(out)


if __name__ == '__main__':
    main()
