/* Maatilan hybridienergialaskuri 0.10.0 – laskentamalli selaimeen.
 * Sama tuntitase kuin Excel-työkirjassa ja malli/sim.py:ssä (8 760 h, kiinteä EET).
 * Tekijät: Suvi Karirinne, Miiro Jääskeläinen, Seinäjoen ammattikorkeakoulu (SEAMK),
 * Maatalous ja energia -tutkimusryhmä. Lisenssi: MIT (LICENSE-CODE).
 */
(function (root) {
  'use strict';
  const MONTH_HOURS = [744, 672, 744, 720, 744, 720, 744, 744, 720, 744, 720, 744];
  const CUT_12KK = 6407; // 2026 FCR-D ylös -tuntihinnat 1.1.–24.9.2026 klo 22

  const DEFAULTS = {
    tuotanto: 'Lihasikala', lammitys: 'Hakekattila', skaalaSahko: 0, skaalaLampo: 0,
    pvOn: 1, pv: 200, pvHinta: 750,
    lpOn: 0, lp: 10, lpHinta: 950,
    ekOn: 0, ek: 30, ekHinta: 120,
    varOn: 0, varaaja: 5, varHinta: 1400,
    akkuOn: 1, akku: 60, akkuHinta: 450,
    kattila: 300,
    chpOn: 0, chpOsuus: 0.15, chpHinta: 3000,
    tuki: 0.4,
    ostoKiintea: 12, myyntiKiintea: 4, hake: 16, biokaasu: 12, hyotysuhde: 0.85,
    korko: 0.08, pitoaika: 20,
    hinnoittelu: 'Kiinteä', lisa: 7.56, myyntipalkkio: 0.3, katkaise: 'Ei',
    akunOhjaus: 'Vain PV-ylijäämä', halvat: 3, kalliit: 8, minEro: 3, tehomaksu: 0,
    syklit: 6000, akkuUusiminen: 0.6, invertteri: 60, yllapito: 0.01,
    co2Hake: 13, co2Biokaasu: 15, co2Kotimainen: 45, puuBiogeeninen: 403, biokaasuBiogeeninen: 198,
    pvValmistus: 700, pvIka: 30, akkuValmistus: 90, lpValmistus: 100, lpIka: 20, varValmistus: 300, varIka: 25,
    hakeTiheys: 0.8, aloitusvuosi: 2026, hintavuosi: '2025',
    kalenteriIka: 15, varaajaHavio: 0.1, varaajaPurku: 300, ekVerkko: 'Ei',
    lpOhjaus: 'Taloudellinen', copA: 3.2, copB: 0.07, copMin: 1.8, copMax: 4.8, lpMinT: -25, lpTeho: 1,
    kuluminen: 1, lammonPeruste: 'Polttoaine',
    chpYllapito: 15, chpIka: 15, chpUusiminen: 0.8,
    reservi: 'Ei', reservitapa: 'Rinnakkain omakäytön kanssa', skenaario: 'Viimeiset 12 kk',
    omaYlos: 5, omaAlas: 5, osuus: 0.5, saatavuus: 0.95, energiavaatimus: 1 / 3, vuosimuutos: 0,
    tavoite: 0.5, aktivointi: 0.01, hallinta: 0.2, ylos: 'Kyllä', alas: 'Kyllä', palkkio: 12,
    kyllYlos: 3.5, kyllAlas: 6.0, kyllMuutos: -0.1,
  };

  const SCENARIOS = ['Viimeiset 12 kk', 'Kyllästynyt markkina', '2021', '2022', '2023', '2024', '2025',
    '2026 (1.1.–24.9.)', 'Oma hinta'];

  function monthIndex() {
    const m = new Int8Array(8760); let h = 0;
    MONTH_HOURS.forEach((n, i) => { for (let k = 0; k < n; k++) m[h++] = i; });
    return m;
  }
  const MONTH = monthIndex();

  /* Hourly profiles for the chosen production type, scaled to annual totals when given. */
  function loads(p, data, own) {
    let el, heat;
    if (p.tuotanto === 'Oma data') {
      if (!own || !own.el || !own.heat) return null;
      el = own.el; heat = own.heat;
    } else if (p.tuotanto === 'Broilerikasvattamo') { el = data.broileriSahko; heat = data.broileriLampo; }
    else { el = data.sikalaSahko; heat = data.sikalaLampo; }
    const se = el.reduce((a, b) => a + b, 0), sh = heat.reduce((a, b) => a + b, 0);
    const ke = p.skaalaSahko > 0 && se > 0 ? p.skaalaSahko / se : 1;
    const kh = p.skaalaLampo > 0 && sh > 0 ? p.skaalaLampo / sh : 1;
    // Own outdoor temperature (e.g. Rakennushaku export) replaces the reference year hour by hour.
    const temp = Float64Array.from(data.temp, (x, i) => (p.tuotanto === 'Oma data' && own && own.temp && Number.isFinite(own.temp[i]) ? own.temp[i] : x));
    return { el: Float64Array.from(el, x => Math.max(0, x) * ke), heat: Float64Array.from(heat, x => Math.max(0, x) * kh), temp };
  }

  function fuelPrice(p) { return p.lammitys === 'Hakekattila' ? p.hake : p.biokaasu; } // €/MWh
  function delivered(p) { return p.lammonPeruste === 'Toimitettu lämpö'; }

  /* Hourly dispatch: port of malli/sim.py (identical rules). */
  function simulate(p, data, l, spot) {
    const n = 8760, eta = 0.9;
    const PV = p.pvOn ? p.pv : 0, BESS = p.akkuOn ? p.akku : 0, HP = p.lpOn ? p.lp : 0;
    const TANK = p.varOn ? p.varaaja : 0, EB = p.ekOn && p.varOn ? p.ek : 0;
    const mainMax = p.kattila, P = 0.5 * BESS;
    const spotMode = p.hinnoittelu === 'Pörssihinta';
    const arbi = spotMode && p.akunOhjaus === 'Pörssiohjattu';
    const reserve = p.reservi === 'Kyllä' && BESS > 0, rFirst = reserve && p.reservitapa === 'Reservi ensin';
    const rh = p.energiavaatimus, ah = p.aktivointi, avail = p.saatavuus, rec = p.hallinta;
    const adder = p.lisa / 100, sellfee = p.myyntipalkkio / 100, deg = p.kuluminen / 100;
    const fuelc = fuelPrice(p) / 1000 / (delivered(p) ? 1 : p.hyotysuhde);
    const chpShare = p.chpOn && !delivered(p) ? p.chpOsuus : 0;
    const curtailNeg = spotMode && p.katkaise === 'Kyllä';
    const buyP = new Float64Array(n), sellP = new Float64Array(n);
    for (let t = 0; t < n; t++) {
      buyP[t] = spotMode ? spot[t] / 1000 + adder : p.ostoKiintea / 100;
      sellP[t] = spotMode ? spot[t] / 1000 - sellfee : p.myyntiKiintea / 100;
    }
    const rank = new Int16Array(n), dayMax = new Float64Array(n);
    if (spotMode) for (let s = 0; s < n; s += 24) {
      const idx = []; for (let k = s; k < s + 24; k++) idx.push(k);
      idx.sort((a, b) => spot[a] - spot[b] || a - b);
      idx.forEach((k, i) => { rank[k] = i + 1; });
      let mx = -Infinity; for (let k = s; k < s + 24; k++) mx = Math.max(mx, spot[k] / 1000);
      for (let k = s; k < s + 24; k++) dayMax[k] = mx;
    }
    const keys = ['buy', 'sell', 'main', 'dis', 'ch', 'hp', 'eb', 'hpel', 'gridch', 'soc', 'unmet', 'baseMain',
      'baseUnmet', 'r', 'act', 'actRev', 'pv', 'chp', 'chpload', 'chpsell', 'chprev', 'rdown', 'actDown', 'curt', 'direct'];
    const o = {}; keys.forEach(k => { o[k] = new Float64Array(n); });
    o.buyP = buyP; o.sellP = sellP;
    let soc = 0, tsoc = 0; const Et = TANK * 46.5;
    for (let t = 0; t < n; t++) {
      const pv = PV * data.pv[t], L = l.el[t], Q = l.heat[t], T = l.temp[t];
      const d = Math.min(pv, L), surplus = pv - d, sp = spot ? spot[t] / 1000 : NaN;
      let dis = rFirst ? 0 : Math.min(L - d, P, soc);
      if (arbi && rank[t] <= 24 - p.kalliit) dis = 0;
      const ch = BESS ? Math.min(surplus, P, Math.max(0, (BESS - soc) / eta)) : 0;
      let gc = 0;
      if (BESS && rFirst) {
        const target = Math.min(BESS, Math.max(BESS * p.tavoite, P * (rh + ah)));
        gc = Math.max(0, Math.min(P - ch, (target - soc) / eta - ch));
      } else if (BESS && arbi && rank[t] <= p.halvat && dayMax[t] - sp >= p.minEro / 100 &&
        eta * (dayMax[t] + adder - deg) > buyP[t]) {
        gc = Math.max(0, Math.min(P - ch, (BESS - soc) / eta - ch));
      }
      let up = 0;
      if (reserve && p.ylos === 'Kyllä') {
        let power = P - dis;
        if (rec > 0) power = Math.min(power, Math.max(0, (P - ch - gc) / rec));
        up = Math.max(0, Math.min(power, Math.max(0, soc - dis) / (rh + ah))) * avail;
      }
      const act = up * ah;
      let down = 0;
      if (reserve && p.alas === 'Kyllä') {
        const free = Math.max(0, BESS - soc - eta * (ch + gc));
        const r2 = rec > 0 ? Math.max(0, (P - dis) / rec) : P;
        down = Math.max(0, Math.min(P - ch - gc, free / (eta * (rh + ah)), r2)) * avail;
      }
      const actDown = down * ah;
      const newsoc = soc + eta * (ch + gc) - dis - act + eta * actDown;
      const cop = Math.min(p.copMax, Math.max(p.copMin, p.copA + p.copB * T));
      let qhp = T >= p.lpMinT ? Math.min(Q, HP * p.lpTeho) : 0;
      let php = qhp / cop, hppv = Math.min(Math.max(0, surplus - ch), php);
      if (p.lpOhjaus === 'Taloudellinen' && mainMax > 0 && qhp > 0) {
        const pvEcon = Math.max(0, sellP[t]) / cop < fuelc ? Math.max(0, surplus - ch) : 0;
        const allowed = buyP[t] / cop < fuelc ? php : pvEcon;
        qhp = Math.min(qhp, allowed * cop); php = qhp / cop; hppv = Math.min(Math.max(0, surplus - ch), php);
      }
      const loss = TANK ? Math.min(tsoc, p.varaajaHavio) : 0;
      const available = Math.max(0, tsoc - loss);
      const td = TANK ? Math.min(Math.max(0, Q - qhp), available, p.varaajaPurku) : 0;
      const epv = EB && TANK ? Math.min(Math.max(0, surplus - ch - php), EB, Math.max(0, Et - available)) : 0;
      let eg = 0;
      if (p.ekVerkko === 'Kyllä' && EB && TANK && buyP[t] < fuelc) eg = Math.max(0, Math.min(EB - epv, Et - available - epv));
      const newtsoc = available + epv + eg - td;
      const main = Math.min(mainMax, Math.max(0, Q - qhp - td));
      const unmet = Math.max(0, Q - qhp - td - main);
      const grossSell = Math.max(0, surplus - ch - php - epv);
      const negative = curtailNeg && sellP[t] < 0;
      const curt = negative ? grossSell : 0;
      const chp = chpShare * main;
      const chpload = Math.min(chp, Math.max(0, L - d - dis) + Math.max(0, php - hppv));
      const chpsell = chp - chpload;
      const buy = Math.max(0, L - d - dis) + Math.max(0, php - hppv) + gc + eg - chpload + actDown;
      o.buy[t] = buy; o.sell[t] = grossSell - curt; o.curt[t] = curt; o.main[t] = main; o.dis[t] = dis; o.ch[t] = ch;
      o.hp[t] = qhp; o.eb[t] = epv + eg; o.hpel[t] = php; o.gridch[t] = gc; o.soc[t] = newsoc; o.unmet[t] = unmet;
      o.baseMain[t] = Math.min(mainMax, Q); o.baseUnmet[t] = Q - Math.min(mainMax, Q); o.r[t] = up; o.act[t] = act;
      o.actRev[t] = act * sellP[t]; o.pv[t] = pv; o.direct[t] = d; o.chp[t] = chp; o.chpload[t] = chpload;
      o.chpsell[t] = chpsell; o.chprev[t] = negative ? 0 : chpsell * sellP[t]; o.rdown[t] = down; o.actDown[t] = actDown;
      soc = newsoc; tsoc = newtsoc;
    }
    return o;
  }

  /* Spot prices €/MWh for the year chosen like the workbook's Hintahistoria (K49):
   * a year or 'Keskiarvo'; a missing hour of the chosen year is filled with the hourly average
   * of the years that have it. Accepts a plain 8 760 array as well. */
  function resolveSpot(prices, year) {
    if (!prices) return null;
    if (ArrayBuffer.isView(prices) || Array.isArray(prices)) return Float64Array.from(prices, v => (v == null ? NaN : v));
    const years = Object.keys(prices).filter(y => prices[y]);
    const out = new Float64Array(8760); let filled = 0;
    for (let t = 0; t < 8760; t++) {
      let s = 0, k = 0; years.forEach(y => { const v = prices[y][t]; if (Number.isFinite(v)) { s += v; k++; } });
      const avg = k ? s / k : NaN, own = year !== 'Keskiarvo' && prices[year] ? prices[year][t] : NaN;
      if (year !== 'Keskiarvo' && !Number.isFinite(own) && Number.isFinite(avg)) filled++;
      out[t] = year === 'Keskiarvo' ? avg : (Number.isFinite(own) ? own : avg);
    }
    out.filled = filled; return out;
  }

  /* Motiva/Sitowise 06/2025 table 5 points; the workbook's own linear interpolation (Vuosikassavirta I). */
  function impactFactor(y) {
    const X = [2023, 2030, 2035, 2040, 2045, 2050], Y = [290, 155, 110, 80, 35, 0];
    if (y >= 2050) return 0;
    const v = Math.min(2049.999, Math.max(2023, y)); let k = 0;
    while (k < X.length - 2 && X[k + 1] <= v) k++;
    return Y[k] + (y - X[k]) * (Y[k + 1] - Y[k]) / (X[k + 1] - X[k]);
  }

  function sum(a) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; }
  function dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) if (Number.isFinite(b[i])) s += a[i] * b[i]; return s; }
  function count(a) { let c = 0; for (let i = 0; i < a.length; i++) if (Number.isFinite(a[i])) c++; return c; }
  function peaks(x) { const m = new Array(12).fill(0); for (let t = 0; t < 8760; t++) m[MONTH[t]] = Math.max(m[MONTH[t]], x[t]); return m; }

  /* Reserve price series for a scenario: hourly arrays (NaN = missing) or flat numbers. */
  function reservePrices(p, data, name) {
    const yr = { '2021': 0, '2022': 1, '2023': 2, '2024': 3, '2025': 4, '2026 (1.1.–24.9.)': 5 };
    if (name === 'Kyllästynyt markkina') return { up: p.kyllYlos, down: p.kyllAlas, growth: p.kyllMuutos };
    if (name === 'Oma hinta') return { up: p.omaYlos, down: p.omaAlas, growth: p.vuosimuutos };
    if (name === 'Viimeiset 12 kk') {
      const up = new Float64Array(8760), down = new Float64Array(8760);
      for (let t = 0; t < 8760; t++) {
        const h = t + 1 <= CUT_12KK;
        up[t] = h ? data.fcrUp[5][t] : data.fcrUp[4][t];
        down[t] = h ? data.fcrDown[5][t] : data.fcrDown[4][t];
      }
      return { up, down, growth: p.vuosimuutos };
    }
    const i = yr[name];
    return { up: data.fcrUp[i], down: data.fcrDown[i], growth: p.vuosimuutos };
  }

  function reserveRevenue(p, o, pr) {
    const part = (kw, price) => {
      if (typeof price === 'number') return sum(kw) * price / 1000;
      const c = count(price); if (c === 0) return NaN;
      return dot(kw, price) / 1000 * 8760 / c;
    };
    const upG = p.ylos === 'Kyllä' ? part(o.r, pr.up) : 0;
    const downG = p.alas === 'Kyllä' ? part(o.rdown, pr.down) : 0;
    const gross = upG + downG;
    if (!Number.isFinite(gross)) return { upG, downG, gross: NaN, farm: NaN };
    return { upG, downG, gross, farm: Math.max(0, gross - Math.max(gross * (1 - p.osuus), 12 * p.palkkio)) };
  }

  function batteryReplacementPV(cost, life, years, rate, share) {
    const times = []; for (let j = 1; j <= 100; j++) if (j * life < years - 1e-7) times.push(j * life);
    const renew = cost * share;
    const residual = times.length ? renew * Math.max(0, 1 - (years - times[times.length - 1]) / life) : 0;
    return times.reduce((s, t) => s + renew / Math.pow(1 + rate, t), 0) - residual / Math.pow(1 + rate, years);
  }

  /* Full calculation: dispatch, baseline, economics, emissions. */
  function calculate(pIn, data, own, prices) {
    const p = Object.assign({}, DEFAULTS, pIn);
    const l = loads(p, data, own);
    if (!l) return { status: 'Kulutusdata puuttuu', p };
    const spotMode = p.hinnoittelu === 'Pörssihinta';
    const spot = resolveSpot(prices, p.hintavuosi);
    if (spotMode && (!spot || count(spot) < 8760)) return { status: 'Hintadata puuttuu', p };
    if (p.pitoaika < 1 || p.pitoaika > 100 || p.chpOsuus < 0 || p.chpOsuus > 1 || p.hyotysuhde <= 0 || p.halvat + p.kalliit > 24 ||
        p.kalenteriIka < 1 || p.copMax < p.copMin || p.copMin <= 0)
      return { status: 'Virhe parametreissa', p };
    const o = simulate(p, data, l, spotMode ? spot : null);
    const eta = delivered(p) ? 1 : p.hyotysuhde;
    const fuel = fuelPrice(p);
    const pkHyb = peaks(o.buy), pkBase = peaks(l.el);
    const elBase = dot(l.el, o.buyP) + p.tehomaksu * pkBase.reduce((a, b) => a + b, 0);
    const elHyb = dot(o.buy, o.buyP) + p.tehomaksu * pkHyb.reduce((a, b) => a + b, 0);
    const sales = dot(o.sell, o.sellP) + sum(o.actRev) + sum(o.chprev);
    const baseMain = sum(o.baseMain), hybMain = sum(o.main), chpKwh = sum(o.chp);
    const fuelBase = baseMain / (eta * 1000) * fuel, fuelHyb = (hybMain + chpKwh) / (eta * 1000) * fuel;
    const costBase = elBase + fuelBase, costHyb = elHyb + fuelHyb - sales;
    const energySaving = costBase - costHyb;

    const inv = {
      pv: p.pvOn * p.pv * p.pvHinta, lp: p.lpOn * p.lp * p.lpHinta, ek: p.ekOn * p.ek * p.ekHinta,
      varaaja: p.varOn * p.varaaja * p.varHinta, akku: p.akkuOn * p.akku * p.akkuHinta,
      chp: p.chpOn * p.chpOsuus * p.kattila * p.chpHinta * (delivered(p) ? 0 : 1),
    };
    const gross = Object.values(inv).reduce((a, b) => a + b, 0);
    const subsidy = gross * p.tuki, net = gross - subsidy;
    const om = (gross - inv.chp) * p.yllapito + chpKwh / 1000 * p.chpYllapito;

    let reserveR = { upG: 0, downG: 0, gross: 0, farm: 0 }, growth = p.vuosimuutos;
    if (p.reservi === 'Kyllä' && p.akkuOn) {
      const pr = reservePrices(p, data, p.skenaario); growth = pr.growth;
      reserveR = reserveRevenue(p, o, pr);
    }
    const unmet = sum(o.unmet), baseUnmet = sum(o.baseUnmet);
    let status = 'OK';
    if (unmet > 1e-6 || baseUnmet > 1e-6) status = 'Lämpövaje';
    else if (p.reservi === 'Kyllä' && p.akkuOn && !Number.isFinite(reserveR.farm)) status = 'Reservihinta puuttuu';
    const ok = status === 'OK';

    // Replacements and yearly cash flow (Vuosikassavirta).
    const r = p.korko, N = p.pitoaika, disc = t => 1 / Math.pow(1 + r, t);
    const cycles = p.akkuOn && p.akku > 0 ? (sum(o.dis) + sum(o.act)) / p.akku : 0;
    const life = cycles > 0 ? Math.min(p.kalenteriIka, p.syklit / cycles) : p.kalenteriIka;
    const events = [];
    let batRep = 0;
    if (p.akkuOn && p.akku > 0 && life >= 1) {
      const times = []; for (let j = 1; j <= 100; j++) if (j * life < N - 1e-7) times.push(j * life);
      const renew = inv.akku * p.akkuUusiminen;
      times.forEach(t => { batRep += renew * disc(t); events.push({ t, what: 'Akun uusiminen', cost: renew }); });
      const residual = times.length ? renew * Math.max(0, 1 - (N - times[times.length - 1]) / life) : 0;
      if (residual > 0) { batRep -= residual * disc(N); events.push({ t: N, what: 'Uusitun akun jäännösarvo', cost: -residual }); }
    }
    const invRep = N >= 12 ? p.pvOn * p.pv * p.invertteri * disc(12) : 0;
    if (invRep > 0) events.push({ t: 12, what: 'Invertterin vaihto', cost: p.pvOn * p.pv * p.invertteri });
    let chpRep = 0;
    if (inv.chp > 0 && p.chpIka < N) {
      const renew = inv.chp * p.chpUusiminen, residual = renew * Math.max(0, 1 - (N - p.chpIka) / p.chpIka);
      chpRep = renew * disc(p.chpIka) - residual * disc(N);
      events.push({ t: p.chpIka, what: 'CHP:n uusiminen', cost: renew });
      if (residual > 0) events.push({ t: N, what: 'Uusitun CHP:n jäännösarvo', cost: -residual });
    }
    const resFarm = Number.isFinite(reserveR.farm) ? reserveR.farm : 0;
    const years = []; let pvFlows = 0, cum = -net;
    for (let t = 1; t <= N; t++) {
      const res = resFarm * Math.pow(1 + growth, t - 1), cash = energySaving - om + res;
      const repl = events.filter(e => Math.ceil(e.t - 1e-9) === t).reduce((a, e) => a + e.cost, 0);
      pvFlows += cash * disc(t); cum += cash - repl;
      years.push({ t, year: p.aloitusvuosi + t - 1, df: disc(t), saving: energySaving, om, reserve: res, cash,
        pv: cash * disc(t), replacements: repl, cumulative: cum, impact: impactFactor(p.aloitusvuosi + t - 1) });
    }
    const cash = energySaving + resFarm - om;
    const npv = -net - (invRep + batRep + chpRep) + pvFlows;
    const annuity = g => (Math.abs(r - g) < 1e-6 ? N / (1 + r) : (1 - Math.pow((1 + g) / (1 + r), N)) / (r - g));
    const pvAnn = r ? energySaving * (1 - Math.pow(1 + r, -N)) / r : energySaving * N;
    const npvSimple = -net + pvAnn + resFarm * annuity(growth);

    // Emissions (Ohjauspaneeli rows 68–76).
    const ef = data.ef, buyBase = sum(l.el), buyHyb = sum(o.buy), sold = sum(o.sell);
    const impactAvg = years.reduce((a, y) => a + y.impact, 0) / N;
    const chainF = p.lammitys === 'Hakekattila' ? p.co2Hake : p.co2Biokaasu;
    const bioF = p.lammitys === 'Hakekattila' ? p.puuBiogeeninen : p.biokaasuBiogeeninen;
    const fuelMWhBase = baseMain / (p.hyotysuhde * 1000), fuelMWhHyb = (hybMain + chpKwh) / (p.hyotysuhde * 1000);
    const manuf = (p.pvOn * p.pv * p.pvValmistus / p.pvIka +
      (p.akkuOn && p.akku > 0 ? p.akku * p.akkuValmistus * Math.ceil(N / life - 1e-12) / N : 0) +
      p.lpOn * p.lp * p.lpValmistus / p.lpIka + p.varOn * p.varaaja * p.varValmistus / p.varIka) / 1000;
    const co2 = {
      domestic: [buyBase * p.co2Kotimainen / 1e6, buyHyb * p.co2Kotimainen / 1e6],
      hourly: [dot(l.el, ef) / 1e6, dot(o.buy, ef) / 1e6],
      impact: [buyBase * impactAvg / 1e6, (buyHyb - sold - sum(o.chpsell) - sum(o.act)) * impactAvg / 1e6],
      heat: [fuelMWhBase * chainF / 1000, fuelMWhHyb * chainF / 1000],
      manufacturing: [0, manuf],
      biogenic: [fuelMWhBase * bioF / 1000, fuelMWhHyb * bioF / 1000],
      impactFactor: impactAvg,
    };
    co2.opDomestic = [co2.domestic[0] + co2.heat[0], co2.domestic[1] + co2.heat[1]];
    co2.opHourly = [co2.hourly[0] + co2.heat[0], co2.hourly[1] + co2.heat[1]];

    // Monthly summary (Kuukausikoonti C–X).
    const monthly = Array.from({ length: 12 }, () => ({ base: 0, buy: 0, mainBase: 0, pv: 0, selfUse: 0, sell: 0, dis: 0,
      hp: 0, eb: 0, main: 0, costHyb: 0, costBase: 0, sales: 0, peakHyb: 0, peakBase: 0, co2Hyb: 0, co2Base: 0, curt: 0,
      gridch: 0, chp: 0, chpsell: 0 }));
    for (let t = 0; t < 8760; t++) {
      const m = monthly[MONTH[t]];
      m.base += l.el[t]; m.buy += o.buy[t]; m.mainBase += o.baseMain[t]; m.pv += o.pv[t]; m.sell += o.sell[t];
      m.dis += o.dis[t]; m.hp += o.hp[t]; m.eb += o.eb[t]; m.main += o.main[t]; m.costHyb += o.buy[t] * o.buyP[t];
      m.costBase += l.el[t] * o.buyP[t]; m.sales += o.sell[t] * o.sellP[t] + o.actRev[t] + o.chprev[t];
      m.peakHyb = Math.max(m.peakHyb, o.buy[t]); m.peakBase = Math.max(m.peakBase, l.el[t]);
      m.co2Hyb += o.buy[t] * ef[t] / 1000; m.co2Base += l.el[t] * ef[t] / 1000; m.curt += o.curt[t];
      m.gridch += o.gridch[t]; m.chp += o.chp[t]; m.chpsell += o.chpsell[t];
    }
    monthly.forEach(m => { m.saving = m.base - m.buy; m.selfUse = m.pv - m.sell - m.curt; });

    const pvSum = sum(o.pv);
    const ownTemp = p.tuotanto === 'Oma data' && own && own.temp ? count(own.temp) : 0;
    return {
      status, p, o, monthly, years, events, spot,
      info: { ownTempHours: ownTemp, priceFilled: spot && spot.filled ? spot.filled : 0 },
      energy: {
        elDemand: sum(l.el), heatDemand: sum(l.heat), buyBase, buyHyb, pv: pvSum,
        selfUse: pvSum > 0 ? (pvSum - sold - sum(o.curt)) / pvSum : 0, sell: sold, dis: sum(o.dis),
        hp: sum(o.hp), eb: sum(o.eb), mainBase: baseMain, mainHyb: hybMain, chp: chpKwh, unmet, baseUnmet,
        peakHeat: Math.max(...l.heat), peakEl: Math.max(...l.el), cycles, life,
        fuelMWhBase: baseMain / (p.hyotysuhde * 1000), fuelMWhHyb: (hybMain + chpKwh) / (p.hyotysuhde * 1000),
        chipBase: p.lammitys === 'Hakekattila' ? baseMain / (p.hyotysuhde * 1000 * p.hakeTiheys) : null,
        chipHyb: p.lammitys === 'Hakekattila' ? (hybMain + chpKwh) / (p.hyotysuhde * 1000 * p.hakeTiheys) : null,
      },
      econ: {
        elBase, elHyb, sales, fuelBase, fuelHyb, costBase, costHyb, energySaving, reserve: reserveR, om,
        inv, gross, subsidy, net, cash: ok ? cash : null,
        payback: ok ? (cash > 0 ? net / cash : null) : null, paybackGross: ok ? (cash > 0 ? gross / cash : null) : null,
        npv: ok ? npv : null, npvSimple: ok ? npvSimple : null, replacements: { invRep, batRep, chpRep }, growth,
        reservePV: resFarm * annuity(growth),
      },
      co2,
    };
  }

  /* Coordinate search over candidate sizes, as the workbook's optimisation macro. */
  function optimise(pIn, data, own, spot, lists, metric, onStep) {
    const keys = ['pv', 'lp', 'ek', 'varaaja', 'akku', 'chpOsuus'];
    const on = { pv: 'pvOn', lp: 'lpOn', ek: 'ekOn', varaaja: 'varOn', akku: 'akkuOn', chpOsuus: 'chpOn' };
    const p = Object.assign({}, DEFAULTS, pIn);
    const cfg = keys.map(k => (p[on[k]] ? p[k] : 0));
    const cache = new Map(), log = [];
    const score = res => {
      if (res.status !== 'OK') return null;
      if (metric === 'Vuotuinen säästö (suurin)') return res.econ.cash;
      if (metric === 'Takaisinmaksuaika (lyhin)') return res.econ.payback == null ? null : -res.econ.payback;
      return res.econ.npv;
    };
    const evalCfg = c => {
      const key = c.join('|'); if (cache.has(key)) return cache.get(key);
      const q = Object.assign({}, p);
      keys.forEach((k, i) => { if (c[i] > 0) { q[on[k]] = 1; q[k] = c[i]; } else { q[on[k]] = 0; } });
      const res = calculate(q, data, own, spot), s = score(res);
      log.push({ cfg: c.slice(), status: res.status, gross: res.econ ? res.econ.gross : null, net: res.econ ? res.econ.net : null,
        cash: res.econ ? res.econ.cash : null, payback: res.econ ? res.econ.payback : null, npv: res.econ ? res.econ.npv : null, score: s });
      cache.set(key, s); if (onStep) onStep(log.length); return s;
    };
    let passes = 0;
    for (let pass = 1; pass <= 4; pass++) {
      passes = pass; let improved = false;
      for (let i = 0; i < keys.length; i++) {
        let bestVal = cfg[i], best = evalCfg(cfg);
        for (const v of lists[i]) {
          const c = cfg.slice(); c[i] = v; const s = evalCfg(c);
          if (s != null && (best == null || s > best + 1e-9)) { best = s; bestVal = v; }
        }
        if (bestVal !== cfg[i]) { cfg[i] = bestVal; improved = true; }
      }
      if (!improved) break;
    }
    const best = {}; keys.forEach((k, i) => { best[k] = cfg[i]; });
    return { best, log, passes };
  }

  const api = { DEFAULTS, SCENARIOS, calculate, simulate, optimise, reservePrices, reserveRevenue, resolveSpot, impactFactor, MONTH_HOURS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Laskuri = api;
})(typeof self !== 'undefined' ? self : this);
