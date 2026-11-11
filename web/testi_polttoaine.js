/* Polttoainemoduuli: selainversion laskenta vastaan Python-mallin tulokset (data/polttoaine_testitapaukset.json).
 * Käyttö: node web/testi_polttoaine.js */
const fs = require('fs'), path = require('path');
const P = require('./polttoaine.js');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'polttoaine_testitapaukset.json'), 'utf8'));
let n = 0, bad = 0;
const close = (a, b, what) => { n++; if (Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(b))) { bad++; console.log('EROAA', what, a, b); } };
for (const [name, c] of Object.entries(cases)) {
  const r = P.laske(c.syote);
  if (r.virheet.length) { bad++; console.log('VIRHE', name, r.virheet); continue; }
  for (const [k, v] of Object.entries(c.tulos.yhteensa)) close(r.yhteensa[k], v, `${name}.${k}`);
  for (const [key, row] of Object.entries(c.tulos.rivit)) {
    const mine = r.rivit.find(x => x.key === key);
    for (const [k, v] of Object.entries(row)) close(mine[k], v, `${name}.${key}.${k}`);
  }
}
// Virheelliset syötteet hylätään
if (!P.laske({ lampo: 100, ostoHinta: 16, ostoHyotysuhde: 0.85, puu: { kosteus: 90 } }).virheet.length) { bad++; console.log('kosteus 90 % hyväksyttiin'); }
if (!P.laske({ lampo: 100, ostoHinta: 16, ostoHyotysuhde: 0 }).virheet.length) { bad++; console.log('hyötysuhde 0 hyväksyttiin'); }
console.log(bad ? `${bad} virhettä` : `Polttoainemoduuli: ${Object.keys(cases).length} tapausta, ${n} arvoa täsmää Python-malliin.`);
process.exit(bad ? 1 : 0);
