/* Polttoainemoduuli (kevyt versio) – oman polttoaineen saatavuus ja seoksen hinta hakekattilalle.
 *
 * Esikäsittely laskurille: tuottaa vuoden painotetun polttoaineen hinnan (€/MWh polttoainetta) ja kattilan
 * hyötysuhteen, jotka syötetään laskurin kenttiin Hakkeen hinta (C24) ja Kattilan hyötysuhde (C26).
 * Sama laskenta: malli/polttoaine.py. Testit: web/testi_polttoaine.js ja malli/test_polttoaine.py
 * (yhteiset tapaukset data/polttoaine_testitapaukset.json).
 *
 * Lämpöarvo saapumistilassa (VTT Technology 258, kaava 2.5):
 *   q_ar = q_d × (1 − M/100) − 0,02443 × M   [MJ/kg], M = kosteus p-%.
 * Jakeet käytetään halvimmasta alkaen (€/MWh tuotettua lämpöä); kunkin jakeen käyttöä rajoittaa saatavuus ja
 * enimmäisosuus tuotetusta lämmöstä. Loppu katetaan ostohakkeella.
 */
(function (root) {
  'use strict';

  const H2O = 0.02443; // MJ/kg per kosteusprosentti (veden höyrystymislämpö, VTT T258 kaava 2.5)

  /* Oletukset. Lämpöarvot, tiheys ja kosteudet: VTT Technology 258 (Alakangas ym. 2016), ks. docs/POLTTOAINE.md.
   * Kustannukset, hävikit, olkisato, enimmäisosuudet ja jaekohtaiset hyötysuhteet ovat omia oletuksia ilman lähdettä:
   * käyttäjä korvaa ne omilla tiedoillaan. Määrät ovat oletuksena nolla. */
  const DEFAULTS = {
    puu: { nimi: 'Harvennuspuu (oma tuorehake)', yksikko: 'k-m³', maara: 0, tiheys: 400, kosteus: 50, lampoarvo: 19.2,
      kustannus: 28, havikki: 0, maxOsuus: 100, hyotysuhde: 0.85 },
    olki: { nimi: 'Olki', yksikko: 't', ala: 0, sato: 2, kosteus: 20, lampoarvo: 17.4,
      kustannus: 45, havikki: 5, maxOsuus: 20, hyotysuhde: 0.8 },
    vilja: { nimi: 'Pilaantunut vilja', yksikko: 't', maara: 0, kosteus: 20, lampoarvo: 17.5,
      kustannus: 10, havikki: 5, maxOsuus: 10, hyotysuhde: 0.8 },
  };
  const KEYS = ['puu', 'olki', 'vilja'];

  /** Tehollinen lämpöarvo saapumistilassa, MWh/t. lampoarvo = MJ/kg kuiva-aineessa, kosteus = p-%. */
  function lampoarvoSaapumistilassa(lampoarvo, kosteus) {
    return (lampoarvo * (1 - kosteus / 100) - H2O * kosteus) / 3.6;
  }

  /** Jakeen määrä omassa yksikössään (k-m³ tai t) ja energiasisältö MWh/yksikkö saapumistilassa. */
  function jae(key, f) {
    const mwhPerT = lampoarvoSaapumistilassa(f.lampoarvo, f.kosteus);
    if (key === 'puu') {
      // 1 k-m³: kuiva-ainetta tiheys kg, saapumistilassa tiheys / (1 − M/100) kg
      const tPerM3 = f.tiheys / (1 - f.kosteus / 100) / 1000;
      return { maara: f.maara, mwhPerYksikko: mwhPerT * tPerM3, tPerYksikko: tPerM3 };
    }
    return { maara: key === 'olki' ? f.ala * f.sato : f.maara, mwhPerYksikko: mwhPerT, tPerYksikko: 1 };
  }

  function validoi(inp) {
    const bad = [];
    const chk = (ok, msg) => { if (!ok) bad.push(msg); };
    chk(inp.lampo >= 0, 'lämmöntarve');
    chk(inp.ostoHinta >= 0, 'ostohakkeen hinta');
    chk(inp.ostoHyotysuhde > 0 && inp.ostoHyotysuhde <= 1, 'ostohakkeen hyötysuhde');
    KEYS.forEach(k => {
      const f = inp[k], n = DEFAULTS[k].nimi;
      chk(f.kosteus >= 0 && f.kosteus < 80, n + ': kosteus');
      chk(f.lampoarvo > 0, n + ': lämpöarvo');
      chk(f.kustannus >= 0, n + ': kustannus');
      chk(f.havikki >= 0 && f.havikki < 100, n + ': hävikki');
      chk(f.maxOsuus >= 0 && f.maxOsuus <= 100, n + ': enimmäisosuus');
      chk(f.hyotysuhde > 0 && f.hyotysuhde <= 1, n + ': hyötysuhde');
      chk(jae(k, f).maara >= 0, n + ': määrä');
      if (k === 'puu') chk(f.tiheys > 0, n + ': tiheys');
      chk(lampoarvoSaapumistilassa(f.lampoarvo, f.kosteus) > 0, n + ': lämpöarvo saapumistilassa');
    });
    return bad;
  }

  /**
   * inp = { lampo: kattilan tuottama lämpö MWh/v, ostoHinta: €/MWh polttoainetta, ostoHyotysuhde, puu, olki, vilja }.
   * Palauttaa { virheet, rivit[], yhteensa{...} }.
   */
  function laske(input) {
    const inp = { lampo: input.lampo, ostoHinta: input.ostoHinta, ostoHyotysuhde: input.ostoHyotysuhde };
    KEYS.forEach(k => { inp[k] = Object.assign({}, DEFAULTS[k], input[k] || {}); });
    const virheet = validoi(inp);
    if (virheet.length) return { virheet, rivit: [], yhteensa: null };

    const Q = inp.lampo, ostoLampoHinta = inp.ostoHinta / inp.ostoHyotysuhde; // €/MWh lämpöä
    const rivit = KEYS.map(k => {
      const f = inp[k], j = jae(k, f);
      const kaytettavissa = j.maara * (1 - f.havikki / 100);              // yksikköä hävikin jälkeen
      const energia = kaytettavissa * j.mwhPerYksikko;                     // MWh polttoainetta
      // Kustannus kohdistuu koko hankittuun määrään, hävikki nostaa yksikköhintaa.
      const polttoaineHinta = f.kustannus / (j.mwhPerYksikko * (1 - f.havikki / 100)); // €/MWh polttoainetta
      return { key: k, nimi: DEFAULTS[k].nimi, yksikko: DEFAULTS[k].yksikko, maara: j.maara, mwhPerYksikko: j.mwhPerYksikko,
        tPerYksikko: j.tPerYksikko, energia, lampoPotentiaali: energia * f.hyotysuhde, polttoaineHinta,
        lampoHinta: polttoaineHinta / f.hyotysuhde, hyotysuhde: f.hyotysuhde, maxLampo: f.maxOsuus / 100 * Q,
        kustannusYksikko: f.kustannus, havikki: f.havikki, lampo: 0, polttoaine: 0, kaytetty: 0, kustannus: 0, raja: '' };
    });

    // Halvin lämpö ensin; ostohaketta kalliimpaa omaa jaetta ei käytetä.
    let jaljella = Q;
    rivit.slice().sort((a, b) => a.lampoHinta - b.lampoHinta || KEYS.indexOf(a.key) - KEYS.indexOf(b.key)).forEach(r => {
      if (r.lampoPotentiaali <= 0) { r.raja = 'ei määrää'; return; }
      if (r.lampoHinta >= ostoLampoHinta) { r.raja = 'ostohaketta kalliimpi'; return; }
      const lampo = Math.max(0, Math.min(r.lampoPotentiaali, r.maxLampo, jaljella));
      r.lampo = lampo; r.polttoaine = lampo / r.hyotysuhde;
      r.kaytetty = r.polttoaine / (r.mwhPerYksikko * (1 - r.havikki / 100)); // hankittava määrä, sis. hävikin
      r.kustannus = r.kaytetty * r.kustannusYksikko;
      r.raja = lampo >= jaljella - 1e-9 ? 'kattaa tarpeen' : lampo >= r.lampoPotentiaali - 1e-9 ? 'saatavuus' : 'enimmäisosuus';
      jaljella -= lampo;
    });
    const ostoLampo = Math.max(0, jaljella), ostoPolttoaine = ostoLampo / inp.ostoHyotysuhde;
    rivit.push({ key: 'osto', nimi: 'Ostohake', yksikko: 'MWh', maara: null, mwhPerYksikko: 1, tPerYksikko: null, energia: null,
      lampoPotentiaali: null, polttoaineHinta: inp.ostoHinta, lampoHinta: ostoLampoHinta, hyotysuhde: inp.ostoHyotysuhde, maxLampo: null,
      kustannusYksikko: inp.ostoHinta, havikki: 0, lampo: ostoLampo, polttoaine: ostoPolttoaine, kaytetty: ostoPolttoaine,
      kustannus: ostoPolttoaine * inp.ostoHinta, raja: ostoLampo > 0 ? 'loppu tarpeesta' : 'ei tarvita' });

    const polttoaine = rivit.reduce((a, r) => a + r.polttoaine, 0), kustannus = rivit.reduce((a, r) => a + r.kustannus, 0);
    rivit.forEach(r => { r.osuus = Q > 0 ? r.lampo / Q : 0; });
    const vainOsto = Q / inp.ostoHyotysuhde * inp.ostoHinta;
    return { virheet: [], rivit, yhteensa: {
      lampo: Q, polttoaine, kustannus,
      hinta: polttoaine > 0 ? kustannus / polttoaine : inp.ostoHinta,       // €/MWh polttoainetta → laskurin C24
      hyotysuhde: polttoaine > 0 ? Q / polttoaine : inp.ostoHyotysuhde,      // → laskurin C26
      lampoHinta: Q > 0 ? kustannus / Q : ostoLampoHinta,                    // €/MWh lämpöä
      omaOsuus: Q > 0 ? 1 - ostoLampo / Q : 0, vainOsto, saasto: vainOsto - kustannus,
    } };
  }

  const api = { DEFAULTS, KEYS, laske, lampoarvoSaapumistilassa };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Polttoaine = api;
})(typeof self !== 'undefined' ? self : this);
