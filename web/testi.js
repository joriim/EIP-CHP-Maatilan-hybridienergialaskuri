// Selainversion laskennan vertailu Excel-työkirjan tuloksiin (docs/TESTAUS.md).
// Ajo: node web/testi.js
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./malli.js');
const dataDir = path.join(__dirname, '..', 'data');

function csv(file) {
  const lines = fs.readFileSync(path.join(dataDir, file), 'utf8').trim().split(/\r?\n/);
  const head = lines[0].split(','); const cols = head.map(() => []);
  for (const ln of lines.slice(1)) ln.split(',').forEach((v, i) => cols[i].push(v === '' ? NaN : Number(v)));
  return Object.fromEntries(head.map((h, i) => [h, cols[i]]));
}
function loadData() {
  const pr = csv('esimerkkiprofiilit.csv'), up = csv('fingrid_fcr_d_ylos_tuntihinnat.csv');
  const dn = csv('fingrid_fcr_d_alas_tuntihinnat.csv'), ef = csv('fingrid_paastokerroin_2025.csv');
  const years = [2021, 2022, 2023, 2024, 2025, 2026];
  return {
    temp: pr.ulkolampotila_C, pv: pr.pv_kwh_per_kwp, sikalaSahko: pr.sikala_sahko_kwh, sikalaLampo: pr.sikala_lampo_kwh,
    broileriSahko: pr.broileri_sahko_kwh, broileriLampo: pr.broileri_lampo_kwh,
    fcrUp: years.map(y => up[`fcr_d_ylos_${y}_eur_mw_h`]), fcrDown: years.map(y => dn[`fcr_d_alas_${y}_eur_mw_h`]),
    ef: ef.paastokerroin_g_co2_kwh,
  };
}
module.exports = { loadData };

if (require.main === module) {
  const data = loadData();
  const synth = Array.from({ length: 8760 }, (_, t) => (t % 24 < 12 ? 0 : 200));
  const cases = [
    ['oletus', {}, null, { cash: 17493.03506666667, npv: 57994.036803977346 }],
    ['ei_akkua', { akkuOn: 0 }, null, { cash: 17180.436, npv: 73914.68806849651 }],
    ['tasahintainen_porssi', { hinnoittelu: 'Pörssihinta', akunOhjaus: 'Pörssiohjattu' }, synth, { cash: 32948.32929800001, npv: 209736.3937927087 }],
    ['lampo_ja_varaaja', { lpOn: 1, ekOn: 1, varOn: 1, ekVerkko: 'Kyllä', hinnoittelu: 'Pörssihinta' }, synth, { cash: 29364.566034905263, npv: 162490.47780224303 }],
    ['chp_15', { chpOn: 1 }, null, { cash: 19032.829187549007, npv: -26486.670743300114 }],
    ['chp_porssi_katkaisu', { chpOn: 1, hinnoittelu: 'Pörssihinta', katkaise: 'Kyllä' }, synth, { cash: 32810.023384637905, npv: 108779.85274477353 }],
    ['reservi_ensin', { reservi: 'Kyllä', reservitapa: 'Reservi ensin', skenaario: 'Kyllästynyt markkina' }, null, { cash: 17645.37519725647, npv: 55647.59189655424, res: 871.7277196914065 }],
    ['rinnakkainen_reservi', { reservi: 'Kyllä', skenaario: 'Kyllästynyt markkina' }, null, { cash: 18159.567526052684, npv: 61417.56341187745, res: 708.0170215936079 }],
    ['reservi_12kk_oletus', { reservi: 'Kyllä' }, null, { res: 405.65 }],
    ['10_vuotta', { pitoaika: 10 }, null, { npv: 11179.689211870398 }],
  ];
  let fail = 0;
  for (const [name, p, spot, want] of cases) {
    const r = L.calculate(p, data, null, spot);
    const got = { cash: r.econ.cash, npv: r.econ.npv, res: r.econ.reserve.farm };
    const errs = Object.entries(want).map(([k, v]) => [k, Math.abs(got[k] - v) / Math.max(1, Math.abs(v))]);
    const tol = name === 'reservi_12kk_oletus' ? 1e-4 : 1e-9;
    const bad = errs.filter(([, e]) => !(e < tol));
    if (bad.length) fail++;
    console.log((bad.length ? 'VIRHE ' : 'ok    ') + name, JSON.stringify(got));
  }
  const miss = L.calculate({ tuotanto: 'Oma data' }, data, null, null).status;
  const heat = L.calculate({ kattila: 10 }, data, null, null).status;
  const spotMiss = L.calculate({ hinnoittelu: 'Pörssihinta' }, data, null, null).status;
  console.log(miss, '|', heat, '|', spotMiss);
  if (miss !== 'Kulutusdata puuttuu' || heat !== 'Lämpövaje' || spotMiss !== 'Hintadata puuttuu') fail++;
  console.log(fail ? `${fail} virhettä` : 'Kaikki tapaukset täsmäävät Excel-työkirjaan.');
  process.exit(fail ? 1 : 0);
}
