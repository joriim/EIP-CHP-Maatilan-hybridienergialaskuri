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
    ['orc_sikala_ei_kay', { chpOn: 1 }, null, { cash: 17493.03506666666, npv: -30538.081598888617 }],
    ['orc_paluu45_k70_300_porssi', { tuotanto: 'Broilerikasvattamo', skaalaLampo: 1300000, chpOn: 1, orcPaluu: 45, orcLampo: 300, orcMinimi: 200,
      hinnoittelu: 'Pörssihinta', katkaise: 'Kyllä' }, synth, { cash: 27321.155148364844, npv: 65955.85010133666 }],
    ['orc_broileri_1300MWh', { tuotanto: 'Broilerikasvattamo', skaalaLampo: 1300000, chpOn: 1 }, null, { cash: 8932.324310923084, npv: -114588.4017113156 }],
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
  // Detailed parity with the workbook: energy, economics, emissions, monthly and yearly tables.
  const ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'vertailu_excel.json'), 'utf8'));
  const pr = csv('esimerkkiprofiilit.csv');
  const ownData = { el: pr.sikala_sahko_kwh, heat: pr.sikala_lampo_kwh, temp: pr.ulkolampotila_C.map(x => x + 5) };
  const defs = {
    oletus: [{}, null, null], reservi_12kk: [{ reservi: 'Kyllä' }, null, null],
    orc_broileri_1300MWh: [{ tuotanto: 'Broilerikasvattamo', skaalaLampo: 1300000, chpOn: 1 }, null, null],
    orc_paluu45_k70_300: [{ tuotanto: 'Broilerikasvattamo', skaalaLampo: 1300000, chpOn: 1, orcPaluu: 45, orcLampo: 300, orcMinimi: 200 }, null, null],
    lampo_ja_varaaja: [{ lpOn: 1, ekOn: 1, varOn: 1, ekVerkko: 'Kyllä', hinnoittelu: 'Pörssihinta' }, null, synth],
    oma_data_oma_lampotila: [{ tuotanto: 'Oma data', lpOn: 1, lp: 30 }, ownData, null],
    broileri_biokaasu_25v: [{ tuotanto: 'Broilerikasvattamo', lammitys: 'Biokaasu', pitoaika: 25, kattila: 400 }, null, null],
  };
  const pick = r => {
    const e = r.energy, c = r.econ, q = r.co2, rep = c.replacements;
    const m = {
      C33: e.buyBase, D33: e.buyHyb, D34: e.pv, D35: e.selfUse, D36: e.sell, D37: e.dis, D38: e.hp, D39: e.eb, C40: e.mainBase,
      D40: e.mainHyb, C41: e.fuelMWhBase, D41: e.fuelMWhHyb, C42: e.chipBase, D42: e.chipHyb, D43: e.chp, C46: c.elBase,
      D46: c.elHyb, D47: c.sales, C48: c.fuelBase, D48: c.fuelHyb, C49: c.costBase, D49: c.costHyb, E49: c.energySaving,
      E50: c.reserve.farm, E51: c.cash, E52: c.payback, E53: c.paybackGross, E54: c.npv, E55: c.npvSimple, G16: c.gross,
      G17: c.subsidy, G18: c.net, C59: e.cycles, C60: e.life, C61: c.om, C62: rep.invRep, C63: rep.batRep,
      C64: rep.invRep + rep.batRep + rep.chpRep, K37: q.impactFactor, K68: e.chp, K77: r.orc.eta, K78: r.orc.max, K79: r.orc.share, G15: c.inv.chp,
    };
    [['domestic', 68], ['hourly', 69], ['impact', 70], ['heat', 71], ['manufacturing', 72], ['opDomestic', 73], ['opHourly', 74],
      ['impact', 75], ['biogenic', 76]].forEach(([k, row]) => { m['C' + row] = q[k][0]; m['D' + row] = q[k][1]; });
    return m;
  };
  const MCOLS = ['base', 'buy', 'saving', 'mainBase', 'pv', 'selfUse', 'sell', 'dis', 'hp', 'eb', 'main', 'costHyb', 'costBase',
    'sales', 'peakHyb', 'peakBase', 'co2Hyb', 'co2Base', 'curt', 'gridch', 'chp', 'chpsell', 'heat', 'mainOrc', 'unmet'];
  const YCOLS = ['year', 'df', 'saving', 'om', 'reserve', 'cash', 'pv', 'impact'];
  // The workbook's hourly emission factor differs from data/fingrid_paastokerroin_2025.csv by ±0,001 g/kWh
  // in a few hours (rounding), so monthly CO2 kilograms are compared at 1e-5.
  const close = (a, b, tol = 1e-6) => (typeof b !== 'number' ? true : Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)));
  for (const [name, want] of Object.entries(ref)) {
    const [p, own, sp] = defs[name], r = L.calculate(p, data, own, sp);
    const got = pick(r), bad = [];
    Object.entries(want.panel).forEach(([k, v]) => { if (!close(got[k], v)) bad.push(`${k}: ${got[k]} ≠ ${v}`); });
    want.monthly.forEach((row, i) => row.forEach((v, j) => { if (!close(r.monthly[i][MCOLS[j]], v, MCOLS[j].startsWith('co2') ? 1e-5 : 1e-6)) bad.push(`kk${i + 1} ${MCOLS[j]}: ${r.monthly[i][MCOLS[j]]} ≠ ${v}`); }));
    want.years.forEach((row, i) => row.forEach((v, j) => { if (!close(r.years[i][YCOLS[j]], v)) bad.push(`v${i + 1} ${YCOLS[j]}: ${r.years[i][YCOLS[j]]} ≠ ${v}`); }));
    const n = Object.keys(want.panel).length + want.monthly.length * MCOLS.length + want.years.length * 8;
    if (bad.length) fail++;
    console.log((bad.length ? 'VIRHE ' : 'ok    ') + `${name}: ${n} arvoa` + (bad.length ? '\n  ' + bad.slice(0, 8).join('\n  ') : ''));
  }
  const miss = L.calculate({ tuotanto: 'Oma data' }, data, null, null).status;
  const heat = L.calculate({ kattila: 10 }, data, null, null).status;
  const spotMiss = L.calculate({ hinnoittelu: 'Pörssihinta' }, data, null, null).status;
  console.log(miss, '|', heat, '|', spotMiss);
  if (miss !== 'Kulutusdata puuttuu' || heat !== 'Lämpövaje' || spotMiss !== 'Hintadata puuttuu') fail++;
  console.log(fail ? `${fail} virhettä` : 'Kaikki tapaukset täsmäävät Excel-työkirjaan.');
  process.exit(fail ? 1 : 0);
}
