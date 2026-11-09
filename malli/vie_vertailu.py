"""Write the workbook's results for a set of cases to web/vertailu_excel.json.

The browser version's test (node web/testi.js) compares its energy balance, monthly
summary, yearly cash flow and emissions with these values. Run after a formula change:
    python malli/vie_vertailu.py laskuri/Maatilan_hybridienergialaskuri.xlsm
"""
import json, sys
from pathlib import Path
import numpy as np
import pandas as pd
from excel_tarkistus import Model

ROOT = Path(__file__).resolve().parent.parent
P = 'Ohjauspaneeli ja Tulokset'; H = 'Tuntitase_8760h'; K = 'Kuukausikoonti'; V = 'Vuosikassavirta'
HOURLY = ['AB', 'AD', 'AF', 'AG', 'K', 'L', 'M', 'N', 'O', 'BR', 'T', 'AC', 'P', 'R', 'AH', 'AU', 'BA', 'BH', 'BI', 'Q', 'S', 'U',
          'AY', 'X', 'V', 'AZ', 'W', 'Y', 'Z', 'AA', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AV', 'AW', 'AX', 'BB', 'BC', 'BD',
          'BE', 'BF', 'BG', 'BP', 'BQ', 'BS']
PANEL = ['K77', 'K78', 'K79', 'G15', 'C33', 'D33', 'D34', 'D35', 'D36', 'D37', 'D38', 'D39', 'C40', 'D40', 'C41', 'D41', 'C42', 'D42', 'D43',
         'C46', 'D46', 'D47', 'C48', 'D48', 'C49', 'D49', 'E49', 'E50', 'E51', 'E52', 'E53', 'E54', 'E55',
         'G16', 'G17', 'G18', 'C59', 'C60', 'C61', 'C62', 'C63', 'C64', 'K37', 'K68']
PANEL += ['%s%d' % (c, r) for r in range(68, 77) for c in 'CD']
MONTH_COLS = list('CDEFGHIJKLMNOPQRSTUVWXYZ') + ['AA']


def main():
    path = sys.argv[1]
    prof = pd.read_csv(ROOT / 'data' / 'esimerkkiprofiilit.csv')
    synth = np.tile(np.r_[np.zeros(12), np.ones(12) * 200], 365)
    own = {(P, 'D4'): 'Oma data', (P, 'C10'): 1, (P, 'D10'): 30}
    t5 = prof.ulkolampotila_C.values + 5
    for i in range(8760):
        own[('Oma kulutusdata', 'E%d' % (i + 2))] = float(prof.sikala_sahko_kwh.values[i])
        own[('Oma kulutusdata', 'F%d' % (i + 2))] = float(prof.sikala_lampo_kwh.values[i])
        own[('Oma kulutusdata', 'G%d' % (i + 2))] = float(t5[i])
    cases = [
        ('oletus', {}, None),
        ('orc_broileri_1300MWh', {(P, 'D4'): 'Broilerikasvattamo', (P, 'L7'): 1300000, (P, 'C15'): 1}, None),
        ('orc_paluu45_k70_300', {(P, 'D4'): 'Broilerikasvattamo', (P, 'L7'): 1300000, (P, 'C15'): 1, (P, 'K72'): 45,
                                 (P, 'K70'): 300, (P, 'K76'): 200}, None),
        ('reservi_12kk', {('Reservimarkkina', 'C6'): 'Kyllä'}, None),
        ('lampo_ja_varaaja', {(P, 'C10'): 1, (P, 'C11'): 1, (P, 'C12'): 1, (P, 'K53'): 'Kyllä', (P, 'K22'): 'Pörssihinta'}, synth),
        ('oma_data_oma_lampotila', own, None),
        ('broileri_biokaasu_25v', {(P, 'D4'): 'Broilerikasvattamo', (P, 'D5'): 'Biokaasu (lannanvaihto)', (P, 'C28'): 25,
                                   (P, 'D14'): 400}, None),
    ]
    model = Model(path)
    raw = model.cache.copy()
    out = {}
    for name, ov, spot in cases:
        model.cache = raw.copy()
        model.cache.update(ov)
        if spot is not None:
            model.cache.update({('Pörssihinnat', 'C%d' % (i + 2)): float(v) for i, v in enumerate(spot)})
        for r in range(2, 8762):
            for c in HOURLY:
                model.get(H, c + str(r))
        res = {'panel': {a: model.get(P, a) for a in PANEL}}
        res['monthly'] = [[model.get(K, '%s%d' % (c, r)) for c in MONTH_COLS] for r in range(6, 18)]
        n = int(model.get(P, 'C28'))
        res['years'] = [[model.get(V, '%s%d' % (c, r)) for c in 'BCDEFGHI'] for r in range(2, n + 2)]
        out[name] = res
        print(name, res['panel']['E54'], flush=True)
    target = ROOT / 'web' / 'vertailu_excel.json'
    target.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding='utf-8')
    print('written', target)


if __name__ == '__main__':
    main()
