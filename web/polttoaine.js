/* Polttoainemoduuli (kevyt versio) – oma polttopuu ja ostopolttoaine hakekattilalle.
 *
 * Esikäsittely laskurille: oman puun ja ostopolttoaineen ominaisuudet ja hinnat annetaan erikseen, ja moduuli
 * tuottaa seokselle vuoden painotetun hinnan (€/MWh polttoainetta), kattilan hyötysuhteen ja energiatiheyden
 * (MWh/i-m³) laskurin kenttiin Hakkeen hinta (C24), Kattilan hyötysuhde (C26) ja Hakkeen energiatiheys (K35).
 * Sama laskenta: malli/polttoaine.py. Testit: web/testi_polttoaine.js ja malli/test_polttoaine.py
 * (yhteiset tapaukset data/polttoaine_testitapaukset.json).
 *
 * Lämpöarvo saapumistilassa (VTT Technology 258, kaava 2.5):
 *   q_ar = q_d × (1 − M/100) − 0,02443 × M   [MJ/kg], M = kosteus p-%.
 * Oma puu käytetään saatavuuden rajoissa, jos sen lämpö on ostopolttoainetta halvempaa (€/MWh tuotettua lämpöä).
 */
(function (root) {
  'use strict';

  const H2O = 0.02443; // MJ/kg per kosteusprosentti (veden höyrystymislämpö, VTT T258 kaava 2.5)
  const YKSIKOT = { mwh: '€/MWh', km3: '€/k-m³', im3: '€/i-m³' };

  /* Oletukset. Lämpöarvo, tiheys ja oman tuorehakkeen kosteus: VTT Technology 258 (Alakangas ym. 2016).
   * Hinnat, hävikit, hyötysuhteet, hakkeen tiiviys ja ostohakkeen kosteus ovat omia oletuksia: ks. docs/POLTTOAINE.md.
   * Ostopolttoaineen hinta ja hyötysuhde tulevat laskurin kentistä, jos niitä ei anneta. */
  const DEFAULTS = {
    oma: { nimi: 'Oma polttopuu', maara: 0, kosteus: 50, lampoarvo: 19.2, tiheys: 400, tiiviys: 0.4,
      hinta: 28, hintaYksikko: 'km3', havikki: 0, hyotysuhde: 0.85 },
    osto: { nimi: 'Ostopolttoaine', kosteus: 40, lampoarvo: 19.2, tiheys: 400, tiiviys: 0.4,
      hinta: 16, hintaYksikko: 'mwh', havikki: 0, hyotysuhde: 0.85 },
  };
  const KEYS = ['oma', 'osto'];

  /** Tehollinen lämpöarvo saapumistilassa, MWh/t. lampoarvo = MJ/kg kuiva-aineessa, kosteus = p-%. */
  function lampoarvoSaapumistilassa(lampoarvo, kosteus) {
    return (lampoarvo * (1 - kosteus / 100) - H2O * kosteus) / 3.6;
  }

  /** Polttoaineen ominaisuudet ja hinta kaikissa yksiköissä (hinta sisältää varastohävikin). */
  function ominaisuudet(f) {
    const mwhPerT = lampoarvoSaapumistilassa(f.lampoarvo, f.kosteus);
    const tPerKm3 = f.tiheys / (1 - f.kosteus / 100) / 1000;   // 1 k-m³: kuiva-ainetta tiheys kg
    const mwhPerKm3 = mwhPerT * tPerKm3, mwhPerIm3 = mwhPerKm3 * f.tiiviys;
    const perMwh = f.hintaYksikko === 'km3' ? f.hinta / mwhPerKm3 : f.hintaYksikko === 'im3' ? f.hinta / mwhPerIm3 : f.hinta;
    const hintaMwh = perMwh / (1 - f.havikki / 100);          // €/MWh poltettua polttoainetta
    return { mwhPerT, tPerKm3, mwhPerKm3, mwhPerIm3, hintaMwh, hintaKm3: hintaMwh * mwhPerKm3, hintaIm3: hintaMwh * mwhPerIm3,
      lampoHinta: hintaMwh / f.hyotysuhde };
  }

  function validoi(inp) {
    const bad = [];
    const chk = (ok, msg) => { if (!ok) bad.push(msg); };
    chk(inp.lampo >= 0, 'lämmöntarve');
    KEYS.forEach(k => {
      const f = inp[k], n = DEFAULTS[k].nimi;
      chk(f.kosteus >= 0 && f.kosteus < 80, n + ': kosteus');
      chk(f.lampoarvo > 0, n + ': lämpöarvo');
      chk(f.tiheys > 0, n + ': tiheys');
      chk(f.tiiviys > 0 && f.tiiviys <= 1, n + ': tiiviys');
      chk(f.hinta >= 0, n + ': hinta');
      chk(f.hintaYksikko in YKSIKOT, n + ': hinnan yksikkö');
      chk(f.havikki >= 0 && f.havikki < 100, n + ': hävikki');
      chk(f.hyotysuhde > 0 && f.hyotysuhde <= 1, n + ': hyötysuhde');
      chk(lampoarvoSaapumistilassa(f.lampoarvo, f.kosteus) > 0, n + ': lämpöarvo saapumistilassa');
    });
    chk(inp.oma.maara >= 0, DEFAULTS.oma.nimi + ': määrä');
    return bad;
  }

  /**
   * input = { lampo: kattilan tuottama lämpö MWh/v, oma: {...}, osto: {...} }; puuttuvat kentät oletuksista.
   * Palauttaa { virheet, rivit: [oma, osto], yhteensa }.
   */
  function laske(input) {
    const inp = { lampo: input.lampo };
    KEYS.forEach(k => { inp[k] = Object.assign({}, DEFAULTS[k], input[k] || {}); });
    const virheet = validoi(inp);
    if (virheet.length) return { virheet, rivit: [], yhteensa: null };

    const Q = inp.lampo;
    const rivit = KEYS.map(k => {
      const f = inp[k], o = ominaisuudet(f);
      return Object.assign({ key: k, nimi: DEFAULTS[k].nimi, hyotysuhde: f.hyotysuhde, havikki: f.havikki,
        saatavilla: k === 'oma' ? f.maara : null, lampo: 0, polttoaine: 0, km3: 0, im3: 0, tonnit: 0, kustannus: 0, raja: '' }, o);
    });
    const [oma, osto] = rivit;
    // Oma puu: poltettavissa oleva energia hävikin jälkeen
    const omaLampoMax = oma.saatavilla * (1 - oma.havikki / 100) * oma.mwhPerKm3 * oma.hyotysuhde;
    if (omaLampoMax <= 0) oma.raja = 'ei määrää';
    else if (oma.lampoHinta >= osto.lampoHinta) oma.raja = 'ostopolttoainetta kalliimpi';
    else { oma.lampo = Math.min(omaLampoMax, Q); oma.raja = oma.lampo >= Q - 1e-9 ? 'kattaa tarpeen' : 'saatavuus'; }
    osto.lampo = Math.max(0, Q - oma.lampo); osto.raja = osto.lampo > 0 ? 'loppu tarpeesta' : 'ei tarvita';
    rivit.forEach(r => {
      r.polttoaine = r.lampo / r.hyotysuhde;                          // MWh poltettua polttoainetta
      r.km3 = r.polttoaine / r.mwhPerKm3 / (1 - r.havikki / 100);     // hankittava määrä, sis. hävikin
      r.im3 = r.km3 / inp[r.key].tiiviys; r.tonnit = r.km3 * r.tPerKm3;
      r.kustannus = r.polttoaine * r.hintaMwh; r.osuus = Q > 0 ? r.lampo / Q : 0;
    });
    const polttoaine = oma.polttoaine + osto.polttoaine, kustannus = oma.kustannus + osto.kustannus;
    const poltettuIm3 = oma.polttoaine / oma.mwhPerIm3 + osto.polttoaine / osto.mwhPerIm3;
    const vainOsto = Q / osto.hyotysuhde * osto.hintaMwh;
    return { virheet: [], rivit, yhteensa: {
      lampo: Q, polttoaine, kustannus,
      hinta: polttoaine > 0 ? kustannus / polttoaine : osto.hintaMwh,                 // €/MWh → laskurin C24
      hyotysuhde: polttoaine > 0 ? Q / polttoaine : osto.hyotysuhde,                  // → laskurin C26
      energiatiheys: polttoaine > 0 ? polttoaine / poltettuIm3 : osto.mwhPerIm3,      // MWh/i-m³ → laskurin K35
      lampoHinta: Q > 0 ? kustannus / Q : osto.lampoHinta,
      omaOsuus: Q > 0 ? oma.lampo / Q : 0, vainOsto, saasto: vainOsto - kustannus,
    } };
  }

  const api = { DEFAULTS, KEYS, YKSIKOT, laske, ominaisuudet, lampoarvoSaapumistilassa };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Polttoaine = api;
})(typeof self !== 'undefined' ? self : this);
