/* Maatilan hybridienergialaskuri 0.10.0 – selainversion käyttöliittymä.
 * SEAMK, Maatalous ja energia -tutkimusryhmä. Lisenssi: MIT (LICENSE-CODE). */
(function () {
  'use strict';
  const L = window.Laskuri, D = window.LASKURI_DATA;
  const decode = a => Float64Array.from(a, v => (v === null ? NaN : v));
  const data = {
    temp: decode(D.temp), pv: decode(D.pv), sikalaSahko: decode(D.sikalaSahko), sikalaLampo: decode(D.sikalaLampo),
    broileriSahko: decode(D.broileriSahko), broileriLampo: decode(D.broileriLampo),
    fcrUp: D.fcrUp.map(decode), fcrDown: D.fcrDown.map(decode), ef: decode(D.ef),
  };
  const $ = id => document.getElementById(id);
  let own = null, ownName = '', prices = {}, priceNames = {}, last = null, timer = null;

  /* ------------------------------------------------------------------ form schema
   * [key, label, unit, Excel cell, options or {step,min,max}] */
  const N = (step, min, max) => ({ step, min, max });
  const YES = ['Ei', 'Kyllä'];
  const GROUPS = [
    ['tila', '1. Tila ja kulutus', true, [
      ['tuotanto', 'Tuotantosuunta', '', 'D4', ['Lihasikala', 'Broilerikasvattamo', 'Oma data']],
      ['lammitys', 'Päälämmitys', '', 'D5', ['Hakekattila', 'Biokaasu']],
      ['kattila', 'Päälämmityksen teho', 'kW', 'D14', N(10, 0)],
      ['skaalaSahko', 'Sähkö vuodessa (0 = profiilin taso)', 'kWh', 'K7', N(1000, 0)],
      ['skaalaLampo', 'Lämpö vuodessa (0 = profiilin taso)', 'kWh', 'L7', N(1000, 0)],
    ], 'ownFiles'],
    ['laitteet', '2. Laitteet ja investoinnit', true, [], 'devices'],
    ['sahko', '3. Sähkön hinnat', true, [
      ['hinnoittelu', 'Hinnoittelu', '', 'K22', ['Kiinteä', 'Pörssihinta']],
      ['ostoKiintea', 'Kiinteä ostohinta (energia, siirto, vero)', 'c/kWh', 'C22', N(0.1)],
      ['myyntiKiintea', 'Kiinteä myyntihinta', 'c/kWh', 'C23', N(0.1)],
      ['hintavuosi', 'Pörssihintojen vuosi', '', 'K49', ['2023', '2024', '2025', '2026', 'Keskiarvo']],
      ['lisa', 'Siirto, vero ja marginaali pörssihinnan päälle', 'c/kWh', 'K23', N(0.01)],
      ['myyntipalkkio', 'Myyntipalkkio', 'c/kWh', 'K24', N(0.01)],
      ['katkaise', 'Katkaise myynti negatiivisella hinnalla', '', 'K25', YES],
      ['tehomaksu', 'Tehomaksu kuukauden huipusta', '€/kW/kk', 'K30', N(0.5, 0)],
    ], 'priceFiles'],
    ['talous', '4. Lämmön hinta ja talous', true, [
      ['hake', 'Hakkeen hinta', '€/MWh', 'C24', N(1, 0)],
      ['biokaasu', 'Biokaasulämmön hinta', '€/MWh', 'C25', N(1, 0)],
      ['hyotysuhde', 'Kattilan hyötysuhde', 'osuus', 'C26', N(0.01, 0.1, 1)],
      ['lammonPeruste', 'Päälämmön hinnan peruste', '', 'K62', ['Polttoaine', 'Toimitettu lämpö']],
      ['korko', 'Laskentakorko', 'osuus', 'C27', N(0.005, 0)],
      ['pitoaika', 'Pitoaika', 'v', 'C28', N(1, 1, 100)],
      ['aloitusvuosi', 'Tarkastelun aloitusvuosi', '', 'K64', N(1, 2023, 2060)],
      ['yllapito', 'Ylläpito', 'osuus invest./v', 'K34', N(0.005, 0)],
      ['invertteri', 'Invertterin vaihto vuonna 12', '€/kWp', 'K33', N(5, 0)],
      ['syklit', 'Akun syklikesto', 'sykliä', 'K31', N(500, 1)],
      ['kalenteriIka', 'Akun kalenteri-ikä', 'v', 'K50', N(1, 1)],
      ['akkuUusiminen', 'Akun uusiminen, osuus nykyhinnasta', 'osuus', 'K32', N(0.05, 0)],
      ['hakeTiheys', 'Hakkeen energiatiheys', 'MWh/i-m³', 'K35', N(0.05, 0.1)],
    ]],
    ['ohjaus', '5. Akun ohjaus', false, [
      ['akunOhjaus', 'Akun ohjaus', '', 'K26', ['Vain PV-ylijäämä', 'Pörssiohjattu']],
      ['halvat', 'Verkkolataus halvimpina tunteina', 'h/vrk', 'K27', N(1, 0, 24)],
      ['kalliit', 'Purku vain kalleimpina tunteina', 'h/vrk', 'K28', N(1, 0, 24)],
      ['minEro', 'Vuorokauden vähimmäishintaero', 'c/kWh', 'K29', N(0.5, 0)],
      ['kuluminen', 'Akun kulumiskustannus ohjauksessa', 'c/kWh', 'K61', N(0.5, 0)],
    ]],
    ['lampo', '6. Lämpöpumppu, varaaja ja CHP', false, [
      ['lpOhjaus', 'Lämpöpumpun ohjaus', '', 'K54', ['Taloudellinen', 'Etusija']],
      ['copA', 'COP-käyrän vakiotermi a', '', 'K55', N(0.1)],
      ['copB', 'COP-käyrän lämpötilakerroin b', '1/K', 'K56', N(0.01)],
      ['copMin', 'COP-käyrän alaraja', '', 'K57', N(0.1, 0.1)],
      ['copMax', 'COP-käyrän yläraja', '', 'K58', N(0.1, 0.1)],
      ['lpMinT', 'Lämpöpumpun alin käyttölämpötila', '°C', 'K59', N(1)],
      ['lpTeho', 'Käytettävissä oleva teho-osuus', 'osuus', 'K60', N(0.05, 0, 1)],
      ['varaajaHavio', 'Varaajan seisontahäviö', 'kW', 'K51', N(0.05, 0)],
      ['varaajaPurku', 'Varaajan suurin purkuteho', 'kW', 'K52', N(10, 0)],
      ['ekVerkko', 'Sähkökattilan verkkolataus', '', 'K53', YES],
      ['chpYllapito', 'CHP: ylläpito', '€/MWh sähköä', 'K65', N(1, 0)],
      ['chpIka', 'CHP: käyttöikä', 'v', 'K66', N(1, 1)],
      ['chpUusiminen', 'CHP: uusiminen, osuus nykyhinnasta', 'osuus', 'K67', N(0.05, 0)],
    ]],
    ['reservi', '7. FCR-D-reservimarkkina', false, [
      ['reservi', 'Osallistuminen', '', 'Res. C6', YES],
      ['reservitapa', 'Akun käyttötapa', '', 'Res. C7', ['Rinnakkain omakäytön kanssa', 'Reservi ensin']],
      ['skenaario', 'Hintaskenaario', '', 'Res. C8', L.SCENARIOS],
      ['ylos', 'FCR-D ylös (purkuteho)', '', 'Res. C36', ['Kyllä', 'Ei']],
      ['alas', 'FCR-D alas (latausteho)', '', 'Res. C37', ['Kyllä', 'Ei']],
      ['osuus', 'Tilan osuus tuotosta', 'osuus', 'Res. C10', N(0.05, 0, 1)],
      ['palkkio', 'Aggregaattorin vähimmäispalkkio', '€/kk', 'Res. C39', N(1, 0)],
      ['saatavuus', 'Tekninen saatavuus', 'osuus', 'Res. C11', N(0.01, 0, 1)],
      ['energiavaatimus', 'Energiavaatimus täydellä teholla', 'h', 'Res. C12', N(0.01, 0.01)],
      ['tavoite', 'Tavoitevaraus (Reservi ensin)', 'osuus', 'Res. C16', N(0.05, 0, 1)],
      ['aktivointi', 'Odotettu aktivointi', 'h/h', 'Res. C33', N(0.005, 0)],
      ['hallinta', 'Energianhallinnan tehoreservi', 'kW/kW', 'Res. C34', N(0.05, 0)],
      ['vuosimuutos', 'Hintojen vuosimuutos (muut skenaariot)', 'osuus/v', 'Res. C13', N(0.01)],
      ['omaYlos', 'Oma hinta, ylös', '€/MW,h', 'Res. C9', N(0.5, 0)],
      ['omaAlas', 'Oma hinta, alas', '€/MW,h', 'Res. C38', N(0.5, 0)],
      ['kyllYlos', 'Kyllästynyt markkina: ylös', '€/MW,h', 'Res. C40', N(0.1, 0)],
      ['kyllAlas', 'Kyllästynyt markkina: alas', '€/MW,h', 'Res. C41', N(0.1, 0)],
      ['kyllMuutos', 'Kyllästynyt markkina: vuosimuutos', 'osuus/v', 'Res. C42', N(0.01)],
    ]],
    ['co2', '8. Päästökertoimet', false, [
      ['co2Kotimainen', 'Kotimaisen sähköntuotannon kerroin', 'g CO₂/kWh', 'K36', N(1, 0)],
      ['co2Hake', 'Hake: toimitusketju + CH4/N2O', 'kg CO₂e/MWh', 'K38', N(1, 0)],
      ['co2Biokaasu', 'Biokaasu: toimitusketju', 'kg CO₂e/MWh', 'K39', N(1, 0)],
      ['puuBiogeeninen', 'Puun biogeeninen CO₂ (muistio)', 'kg/MWh', 'K40', N(1, 0)],
      ['biokaasuBiogeeninen', 'Biokaasun biogeeninen CO₂ (muistio)', 'kg/MWh', 'K48', N(1, 0)],
      ['pvValmistus', 'PV:n valmistus', 'kg CO₂e/kWp', 'K41', N(10, 0)],
      ['pvIka', 'PV:n käyttöikä', 'v', 'K42', N(1, 1)],
      ['akkuValmistus', 'Akun valmistus', 'kg CO₂e/kWh', 'K43', N(5, 0)],
      ['lpValmistus', 'Lämpöpumpun valmistus', 'kg CO₂e/kW', 'K44', N(5, 0)],
      ['lpIka', 'Lämpöpumpun käyttöikä', 'v', 'K45', N(1, 1)],
      ['varValmistus', 'Varaajan valmistus', 'kg CO₂e/m³', 'K46', N(10, 0)],
      ['varIka', 'Varaajan käyttöikä', 'v', 'K47', N(1, 1)],
    ]],
  ];
  const DEVICES = [
    ['pvOn', 'pv', 'pvHinta', 'Aurinkosähkö', 'kWp', 'C9:F9'], ['akkuOn', 'akku', 'akkuHinta', 'Akku', 'kWh', 'C13:F13'],
    ['lpOn', 'lp', 'lpHinta', 'Lämpöpumppu', 'kW lämpöä', 'C10:F10'], ['ekOn', 'ek', 'ekHinta', 'Sähkökattila', 'kW', 'C11:F11'],
    ['varOn', 'varaaja', 'varHinta', 'Vesivaraaja', 'm³', 'C12:F12'], ['chpOn', 'chpOsuus', 'chpHinta', 'CHP, sähköosuus', '€/kWe', 'C15:F15'],
  ];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function buildForm() {
    const host = $('inputs'); let html = '';
    GROUPS.forEach(([id, title, open, fields, extra]) => {
      html += `<details class="grp" id="g-${id}"${open ? ' open' : ''}><summary>${title}</summary><div class="fields">`;
      if (extra === 'devices') {
        html += '<div class="dev head"><span></span><span>Laite</span><span>Koko</span><span>€/yksikkö</span></div>';
        DEVICES.forEach(([on, size, price, label, unit, ref]) => {
          html += `<div class="dev" title="Excel: ${ref}"><input type="checkbox" id="${on}" aria-label="${label} mukana"><label for="${size}">${label}${unit && size !== 'chpOsuus' ? ', ' + unit : ''}</label>` +
            `<input type="number" id="${size}" min="0" step="${size === 'chpOsuus' ? 0.05 : 1}"><input type="number" id="${price}" min="0" aria-label="${label}, yksikköhinta"></div>`;
        });
        html += '<p class="hint">Sähkökattila tarvitsee varaajan. CHP-sähkö = osuus × päälämmön tuotto; sähköteho = osuus × kattilan teho, hinta €/kWe.</p>';
        html += row(['tuki', 'Investointituki', 'osuus', 'D17', N(0.05, 0, 1)]);
      }
      fields.forEach(f => { html += row(f); });
      if (extra === 'ownFiles') html += `<div class="file"><label for="fOwn">Oma kulutusdata tai Rakennushaun vienti (CSV, 8 760 h)</label><input type="file" id="fOwn" accept=".csv,.txt"><p class="hint" id="ownInfo">Esimerkkiprofiilit ovat synteettisiä. Rakennushaun tiedosto oma_kulutusdata_&lt;vuosi&gt;.csv tuo sähkön, lämmön, ulkolämpötilan ja hinnat kerralla.</p></div>`;
      if (extra === 'priceFiles') html += `<div class="file"><label for="fPrice">Pörssihinnat (CSV €/MWh, alv 0)</label><input type="file" id="fPrice" accept=".csv,.txt" multiple>` +
        `<div class="row"><label for="fPriceYear">Vuosi, jos tiedostossa on yksi hintasarake</label><select id="fPriceYear"><option>2023</option><option>2024</option><option selected>2025</option><option>2026</option></select></div>` +
        `<p class="hint" id="priceInfo">Ei hintoja. Rakennushaun hintahistoria_2023-2026.csv tai scripts/hae_porssihinnat.py-tiedosto.</p><button type="button" class="ghost" id="fPriceClear">Tyhjennä hinnat</button></div>`;
      html += '</div></details>';
    });
    html += '<button type="button" class="ghost" id="palauta">Palauta oletusarvot</button>';
    host.innerHTML = html;
  }
  function row([key, label, unit, ref, opt]) {
    const input = Array.isArray(opt)
      ? `<select id="${key}">${opt.map(o => `<option>${esc(o)}</option>`).join('')}</select>`
      : `<input type="number" id="${key}"${opt.step != null ? ` step="${opt.step}"` : ''}${opt.min != null ? ` min="${opt.min}"` : ''}${opt.max != null ? ` max="${opt.max}"` : ''}>`;
    return `<div class="row" title="Excel: ${ref}"><label for="${key}">${label}${unit ? `<span class="u">${unit}</span>` : ''}</label>${input}</div>`;
  }
  const allKeys = () => Object.keys(L.DEFAULTS).filter(k => $(k));
  function setInputs(p) { allKeys().forEach(k => { const el = $(k); if (el.type === 'checkbox') el.checked = !!p[k]; else el.value = p[k]; }); }
  function readInputs() {
    const p = {};
    allKeys().forEach(k => { const el = $(k); if (el.type === 'checkbox') p[k] = el.checked ? 1 : 0;
      else if (el.type === 'number') { const v = parseFloat(el.value); p[k] = Number.isFinite(v) ? v : L.DEFAULTS[k]; }
      else p[k] = el.value; });
    return p;
  }
  function diffParams(p) { const d = {}; Object.keys(p).forEach(k => { if (p[k] !== L.DEFAULTS[k]) d[k] = p[k]; }); return d; }

  /* ------------------------------------------------------------------ formatting */
  const nf0 = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ok = v => v != null && Number.isFinite(v);
  const f0 = v => (ok(v) ? nf0.format(v) : '–'), f1 = v => (ok(v) ? nf1.format(v) : '–'), f2 = v => (ok(v) ? nf2.format(v) : '–');
  const pct = v => (ok(v) ? nf0.format(v * 100) + ' %' : '–');
  function table(id, head, rows, cls) {
    $(id).innerHTML = '<thead><tr>' + head.map(x => `<th>${x}</th>`).join('') + '</tr></thead><tbody>' +
      rows.map((r, i) => `<tr class="${(cls && cls[i]) || ''}">` + r.map(x => `<td>${x}</td>`).join('') + '</tr>').join('') + '</tbody>';
  }
  const STATUS = {
    'OK': 'Laskennan edellytykset täyttyvät.',
    'Lämpövaje': 'Päälämmitys ei riitä huippuun: nosta kattilan tehoa tai lisää lämmönlähde. Kannattavuutta ei lasketa.',
    'Kulutusdata puuttuu': 'Lataa oma tuntidata (8 760 riviä) tai valitse esimerkkiprofiili.',
    'Hintadata puuttuu': 'Lataa pörssihinnat (kohta 3) tai valitse kiinteä hinta.',
    'Reservihinta puuttuu': 'Valitulle skenaariolle ei ole kaikkia reservihintoja.',
    'Virhe parametreissa': 'Tarkista pitoaika, CHP-osuus, hyötysuhde, akun ikä, COP-rajat ja ohjaustuntien summa.',
  };
  const KK = ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'];

  /* ------------------------------------------------------------------ charts */
  function niceTop(max) {
    const step = Math.pow(10, Math.floor(Math.log10(Math.max(max, 1) / 4)));
    const nice = [1, 2, 2.5, 5, 10].map(x => x * step).find(x => max / x <= 5) || step * 10;
    return [Math.ceil(max / nice) * nice, nice];
  }
  function barChart(monthly) {
    const W = 760, H = 240, padL = 52, padB = 24, padT = 10, gw = (W - padL - 8) / 12;
    const [top, nice] = niceTop(Math.max(1, ...monthly.map(m => Math.max(m.base, m.buy, m.pv))));
    const y = v => padT + (H - padT - padB) * (1 - v / top);
    let s = '';
    for (let v = 0; v <= top + 1e-9; v += nice) s += `<line x1="${padL}" x2="${W - 4}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end">${nf0.format(v / 1000)}</text>`;
    s += `<text x="4" y="${padT + 4}">MWh</text>`;
    monthly.forEach((m, i) => {
      const x = padL + i * gw + 4, bw = (gw - 8) / 3;
      s += `<rect x="${x}" y="${y(m.base)}" width="${bw}" height="${y(0) - y(m.base)}" fill="var(--lila-soft)" stroke="var(--lila)"/>`;
      s += `<rect x="${x + bw}" y="${y(m.buy)}" width="${bw}" height="${y(0) - y(m.buy)}" fill="var(--lila)"/>`;
      s += `<rect x="${x + 2 * bw}" y="${y(m.pv)}" width="${bw}" height="${y(0) - y(m.pv)}" fill="var(--keltainen)" stroke="var(--line)"/>`;
      s += `<text x="${x + 1.5 * bw}" y="${H - 6}" text-anchor="middle">${KK[i]}</text>`;
    });
    $('kaavio').innerHTML = s;
  }
  function cumChart(r) {
    const W = 760, H = 220, padL = 64, padB = 24, padT = 10;
    const pts = [[0, -r.econ.net], ...r.years.map(y => [y.t, y.cumulative])];
    const lo = Math.min(0, ...pts.map(p => p[1])), hi = Math.max(0, ...pts.map(p => p[1]));
    const [topA, nice] = niceTop(Math.max(Math.abs(lo), Math.abs(hi)));
    const ymin = lo < 0 ? -Math.ceil(-lo / nice) * nice : 0, ymax = hi > 0 ? Math.ceil(hi / nice) * nice : nice;
    const n = r.years.length, x = t => padL + (W - padL - 10) * t / n, y = v => padT + (H - padT - padB) * (ymax - v) / (ymax - ymin);
    let s = '';
    for (let v = ymin; v <= ymax + 1e-9; v += nice) s += `<line x1="${padL}" x2="${W - 6}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"${v === 0 ? ' stroke-width="2"' : ''}/><text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end">${nf0.format(v / 1000)}</text>`;
    s += `<text x="4" y="${padT + 4}">t€</text>`;
    const step = n > 20 ? 5 : n > 10 ? 2 : 1;
    for (let t = 0; t <= n; t += step) s += `<text x="${x(t)}" y="${H - 6}" text-anchor="middle">${t}</text>`;
    s += `<polyline fill="none" stroke="var(--pelto)" stroke-width="2.5" points="${pts.map(p => `${x(p[0])},${y(p[1])}`).join(' ')}"/>`;
    const e = pts[pts.length - 1]; s += `<circle cx="${x(e[0])}" cy="${y(e[1])}" r="4" fill="var(--pelto)"/>`;
    $('kaavio2').innerHTML = s;
  }

  /* ------------------------------------------------------------------ render */
  function render() {
    const p = readInputs();
    const r = L.calculate(p, data, own, Object.keys(prices).length ? prices : null);
    last = r;
    const okS = r.status === 'OK';
    $('tila').textContent = r.status; $('tila').className = 'pill ' + (okS ? 'ok' : 'bad');
    let note = STATUS[r.status] || '';
    if (r.info && r.info.priceFilled && p.hinnoittelu === 'Pörssihinta') note += ` Vuoden ${p.hintavuosi} puuttuvat ${f0(r.info.priceFilled)} tuntia täytetty muiden vuosien keskiarvolla.`;
    if (r.info && r.info.ownTempHours) note += ` Oma ulkolämpötila (${f0(r.info.ownTempHours)} h) käytössä lämpöpumpun COP-laskennassa.`;
    $('tilaSelite').textContent = note;
    if (!r.econ) { ['kCash', 'kNpv', 'kPb', 'kNet'].forEach(k => { $(k).textContent = '–'; }); return; }
    const e = r.econ, en = r.energy, q = r.co2;
    $('kCash').textContent = f0(e.cash); $('kNpv').textContent = f0(e.npv);
    $('kNpvS').textContent = `€, ${p.pitoaika} v, korko ${nf1.format(p.korko * 100)} %, sis. ylläpito ja uusimiset`;
    $('kPb').textContent = e.payback == null ? (okS ? 'ei' : '–') : f1(e.payback);
    $('kPbS').textContent = e.paybackGross == null ? 'vuotta nettoinvestoinnilla' : `vuotta; ilman tukea ${f1(e.paybackGross)} v`;
    $('kNet').textContent = f0(e.net); $('kNetS').textContent = `€ tuen jälkeen; brutto ${f0(e.gross)} €`;
    barChart(r.monthly);
    table('tEnergia', ['kWh/v', 'Lähtötilanne', 'Hybridi'], [
      ['Sähkön osto verkosta', f0(en.buyBase), f0(en.buyHyb)], ['Aurinkosähkön tuotanto', '0', f0(en.pv)],
      ['Aurinkosähkön omakäyttöaste', '–', pct(en.selfUse)], ['Myynti verkkoon', '0', f0(en.sell)],
      ['Akun purku kuormaan', '0', f0(en.dis)], ['Lämpöpumpun lämpö', '0', f0(en.hp)], ['Sähkökattilan lämpö', '0', f0(en.eb)],
      ['Päälämmityksen tuotanto', f0(en.mainBase), f0(en.mainHyb)],
      ['Polttoaine, MWh', f1(en.fuelMWhBase), f1(en.fuelMWhHyb)],
      ['Hake, i-m³', en.chipBase == null ? '–' : f0(en.chipBase), en.chipHyb == null ? '–' : f0(en.chipHyb)],
      ['CHP-sähkö', '0', f0(en.chp)], ['Toimittamaton lämpö', f0(en.baseUnmet), f0(en.unmet)],
      ['Lämmön huipputeho, kW', f0(en.peakHeat), f0(en.peakHeat)],
      ['Akun syklit / käyttöikä', '–', p.akkuOn ? `${f0(en.cycles)} / ${f1(en.life)} v` : '–'],
    ]);
    table('tTalous', ['€/v', 'Lähtötilanne', 'Hybridi'], [
      ['Ostosähkö (energia + tehomaksu)', f0(e.elBase), f0(e.elHyb)], ['Sähkön myyntitulot', '0', f0(e.sales)],
      ['Lämmityksen polttoaine', f0(e.fuelBase), f0(e.fuelHyb)], ['Energiakustannukset yhteensä', f0(e.costBase), f0(e.costHyb)],
      ['Energiasäästö', '', f0(e.energySaving)], ['Reservituotto (tilan osuus)', '', f0(e.reserve.farm)],
      ['Ylläpito', '', '−' + f0(e.om)], ['Kassasäästö ylläpidon jälkeen', '', f0(e.cash)],
      ['NPV ilman ylläpitoa ja uusimisia (vertailu)', '', f0(e.npvSimple)],
    ], [, , , , , , , 'total']);
    const inv = e.inv, rep = e.replacements;
    table('tInv', ['€', 'Summa'], [
      ['Aurinkosähkö', f0(inv.pv)], ['Akku', f0(inv.akku)], ['Lämpöpumppu', f0(inv.lp)], ['Sähkökattila', f0(inv.ek)],
      ['Vesivaraaja', f0(inv.varaaja)], ['CHP', f0(inv.chp)], ['Investointi brutto', f0(e.gross)], ['Tuki', '−' + f0(e.subsidy)],
      ['Nettoinvestointi', f0(e.net)], ['Invertterin vaihto, nykyarvo', f0(rep.invRep)], ['Akun uusimiset, nykyarvo', f0(rep.batRep)],
      ['CHP:n uusiminen, nykyarvo', f0(rep.chpRep)],
    ], [, , , , , , , , 'total']);
    const m = r.monthly, sumM = k => m.reduce((a, x) => a + x[k], 0), maxM = k => Math.max(...m.map(x => x[k]));
    const MC = [['base', 'Osto, lähtö'], ['buy', 'Osto, hybridi'], ['saving', 'Säästö kWh'], ['pv', 'PV'], ['selfUse', 'PV omakäyttö'],
      ['sell', 'Myynti'], ['dis', 'Akun purku'], ['hp', 'LP lämpö'], ['eb', 'SK lämpö'], ['mainBase', 'Päälämpö, lähtö'], ['main', 'Päälämpö, hybridi'],
      ['costBase', 'Osto €, lähtö'], ['costHyb', 'Osto €, hybridi'], ['sales', 'Myynti €'], ['peakBase', 'Huippu kW, lähtö'], ['peakHyb', 'Huippu kW, hybridi'],
      ['co2Base', 'CO₂ kg, lähtö'], ['co2Hyb', 'CO₂ kg, hybridi'], ['curt', 'PV katkaistu'], ['gridch', 'Akun verkkolataus'], ['chp', 'CHP'], ['chpsell', 'CHP myynti']];
    table('tKk', ['Kuukausi', ...MC.map(c => c[1])],
      [...m.map((x, i) => [KK[i], ...MC.map(([k]) => f0(x[k]))]),
        ['Vuosi', ...MC.map(([k]) => f0(k.startsWith('peak') ? maxM(k) : sumM(k)))]], { 12: 'total' });
    cumChart(r);
    table('tVuosi', ['Vuosi', 'Kalenterivuosi', 'Diskonttikerroin', 'Energiasäästö', 'Ylläpito', 'Reservi', 'Käyttökassavirta', 'Nykyarvo', 'Uusimiset', 'Kertynyt'],
      r.years.map(y => [y.t, y.year, nf2.format(y.df), f0(y.saving), f0(y.om), f0(y.reserve), f0(y.cash), f0(y.pv), f0(y.replacements), f0(y.cumulative)]));
    table('tUus', ['Ajankohta v', 'Tapahtuma', 'Kustannus €', 'Nykyarvo €'],
      r.events.length ? r.events.map(ev => [f1(ev.t), ev.what, f0(ev.cost), f0(ev.cost / Math.pow(1 + p.korko, ev.t))]) : [['–', 'Ei uusimisia tarkastelujaksolla', '', '']]);
    const row3 = (label, a, unit) => [label, f1(a[0]), f1(a[1]), f1(a[1] - a[0]), unit];
    table('tCo2', ['Päästöerä', 'Lähtötilanne', 'Hybridi', 'Muutos', 'Yksikkö'], [
      row3('Ostosähkö, kotimainen kerroin', q.domestic, 't CO₂/v'), row3('Ostosähkö, kulutuksen tuntikerroin (Fingrid 2025)', q.hourly, 't CO₂/v'),
      row3(`Sähkön vaikutusskenaario, myynti hyvitetty (${f0(q.impactFactor)} g/kWh)`, q.impact, 't CO₂/v'),
      row3('Päälämmitys: toimitusketju ja CH4/N2O', q.heat, 't CO₂e/v'), row3('Laitteiden valmistus (vuosiosuus)', q.manufacturing, 't CO₂e/v'),
      row3('Käyttövaihe, kotimainen kerroin + lämpö', q.opDomestic, 't CO₂e/v'), row3('Käyttövaihe, tuntikerroin + lämpö', q.opHourly, 't CO₂e/v'),
      row3('Biogeeninen CO₂ poltosta (muistio)', q.biogenic, 't CO₂/v'),
    ], [, , , , , 'total', 'total']);
    if (p.reservi === 'Kyllä' && p.akkuOn) {
      const rows = [], cls = [];
      const avg = a => (typeof a === 'number' ? a : (() => { let t = 0, k = 0; a.forEach(v => { if (Number.isFinite(v)) { t += v; k++; } }); return k ? t / k : NaN; })());
      L.SCENARIOS.forEach(s => {
        const pr = L.reservePrices(p, data, s), rv = L.reserveRevenue(p, r.o, pr);
        rows.push([s, f2(avg(pr.up)), f2(avg(pr.down)), f0(rv.upG), f0(rv.downG), f0(rv.farm), pct(pr.growth)]);
        cls.push(s === p.skenaario ? 'sel' : '');
      });
      table('tRes', ['Skenaario', 'Ylös €/MW,h', 'Alas €/MW,h', 'Ylös brutto €/v', 'Alas brutto €/v', 'Tilalle €/v', 'Vuosimuutos'], rows, cls);
      $('resInfo').textContent = `Valittu skenaario korostettu. Tarjonta keskimäärin ylös ${f1(avg(r.o.r))} kW ja alas ${f1(avg(r.o.rdown))} kW. Viimeiset 12 kk = toteutuneet tuntihinnat 24.9.2025–24.9.2026; Kyllästynyt markkina = Fingridin vuosimarkkina 2026. Historialliset vuodet ovat ajalta ennen akkujen tuomaa kyllästymistä.`;
    } else { $('tRes').innerHTML = ''; $('resInfo').textContent = 'Valitse osallistuminen kohdassa 7 (akku mukana), niin skenaariot lasketaan.'; }
    renderCompare();
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(render, 60); }

  const PRODUCTS = [
    ['FCR-D ylös', 'Kyllä', '1 MW, aggregoituna', 'Akun purkuteho. Vuosimarkkina 2026: 3,50 €/MW,h.'],
    ['FCR-D alas', 'Kyllä', '1 MW, aggregoituna', 'Akun latausteho; sopii PV-ylijäämän latauksen pariksi. Vuosimarkkina 2026: 6,00 €/MW,h; tuntimarkkinan toteuma 2026 noin 2,8 €/MW,h.'],
    ['FCR-N', 'Ei', '0,1 MW', 'Jatkuva säätö kierrättää akkua ja varaa saman tehon kuin FCR-D. Ei vuosimarkkinahankintaa 2026.'],
    ['aFRR', 'Ei', '1 MW', 'Pienkohteet vain itsenäisen aggregoinnin kautta; tuotto riippuu aktivoinneista.'],
    ['mFRR', 'Ei', '1 MW', '15 minuutin energiamarkkina; pohjoismainen MARI aikaisintaan 2027. Lähellä pörssikauppaa.'],
    ['FFR', 'Ei', '–', 'Hankitaan vain matalan inertian tilanteissa; vähäinen merkitys maatilan akulle.'],
  ];

  /* ------------------------------------------------------------------ files */
  function parseCsv(text) {
    const rows = text.replace(/^﻿/, '').split(/\r?\n/).filter(x => x.trim() !== '');
    const delim = rows[0].includes(';') ? ';' : rows[0].includes('\t') ? '\t' : ',';
    return rows.map(r => r.split(delim).map(v => v.trim().replace(/^"|"$/g, '')));
  }
  const num = v => (v === '' || v == null ? NaN : Number(String(v).replace(/\s/g, '').replace(',', '.')));
  const isNumRow = r => Number.isFinite(num(r[r.length - 1])) || Number.isFinite(num(r[0]));
  const yearFrom = name => { const m = /(20\d\d)/.exec(name); return m ? m[1] : null; };
  function loadOwn(file, text) {
    let rows = parseCsv(text), head = null;
    if (!isNumRow(rows[0]) || rows[0].some(c => /[a-zäö]/i.test(c))) { head = rows[0].map(h => h.toLowerCase()); rows = rows.slice(1); }
    let iEl, iHeat, iT = -1, iP = -1;
    if (head) {
      iEl = head.findIndex(h => h.includes('sähkö') || h.includes('sahko'));
      iHeat = head.findIndex(h => (h.includes('lämpö') || h.includes('lampo')) && !h.includes('ulko'));
      iT = head.findIndex(h => h.includes('ulkolämpö') || h.includes('ulkolampo') || h.includes('lämpötila'));
      iP = head.findIndex(h => h.includes('pörssi') || h.includes('hinta'));
    }
    if (iEl == null || iEl < 0 || iHeat < 0) { const n = rows[0].length; iEl = n - 2; iHeat = n - 1; }
    const col = i => rows.map(r => num(r[i]));
    const el = col(iEl), heat = col(iHeat);
    const good = rows.length === 8760 && el.every(Number.isFinite) && heat.every(Number.isFinite) && Math.min(...el, ...heat) >= 0;
    if (!good) { own = null; $('ownInfo').textContent = `Tiedostossa ${file} on ${rows.length} riviä tai puuttuvia/negatiivisia arvoja. Tarvitaan 8 760 riviä sähköä ja lämpöä (kWh/h).`; return; }
    own = { el, heat, temp: iT >= 0 ? col(iT) : null }; ownName = file; $('tuotanto').value = 'Oma data';
    let msg = `Ladattu ${file}: sähkö ${f0(el.reduce((a, b) => a + b, 0))} kWh/v, lämpö ${f0(heat.reduce((a, b) => a + b, 0))} kWh/v`;
    if (own.temp) msg += `, ulkolämpötila ${f0(own.temp.filter(Number.isFinite).length)} h`;
    if (iP >= 0) {
      const pr = col(iP), y = yearFrom(file) || $('fPriceYear').value;
      if (pr.some(Number.isFinite)) { prices[y] = Float64Array.from(pr); priceNames[y] = file; $('hintavuosi').value = y; msg += `, pörssihinnat vuodelle ${y}`; updatePriceInfo(); }
    }
    $('ownInfo').textContent = msg + '.';
  }
  function loadPrices(file, text) {
    let rows = parseCsv(text), head = null;
    if (!isNumRow(rows[0]) || rows[0].some(c => /[a-zäö]/i.test(c))) { head = rows[0]; rows = rows.slice(1); }
    if (rows.length !== 8760) return `${file}: ${rows.length} riviä, tarvitaan 8 760.`;
    const yearCols = head ? head.map((h, i) => [String(h).trim(), i]).filter(([h]) => /^20\d\d$/.test(h)) : [];
    if (yearCols.length) {
      yearCols.forEach(([y, i]) => { prices[y] = Float64Array.from(rows, r => num(r[i])); priceNames[y] = file; });
      return null;
    }
    const y = yearFrom(file) || $('fPriceYear').value;
    prices[y] = Float64Array.from(rows, r => num(r[r.length - 1])); priceNames[y] = file;
    return null;
  }
  function updatePriceInfo() {
    const ys = Object.keys(prices).sort();
    $('priceInfo').innerHTML = ys.length ? 'Hinnat: ' + ys.map(y => {
      const v = prices[y], n = v.filter(Number.isFinite).length, a = v.reduce((s, x) => s + (Number.isFinite(x) ? x : 0), 0) / Math.max(1, n);
      return `${y} (${f0(n)} h, ka. ${f2(a)} €/MWh)`;
    }).join(', ') + '. Valitse vuosi tai keskiarvo yllä.' : 'Ei hintoja.';
  }

  /* ------------------------------------------------------------------ save, share, export */
  function download(name, text, type) {
    try {
      const blob = new Blob(['﻿' + text], { type: type || 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      msg(`Tallennettu ${name}.`);
    } catch (e) { msg('Lataus ei onnistunut tässä näkymässä. Avaa laskuri GitHub Pagesista tai omalta koneelta.'); }
  }
  function msg(t) { $('tMsg').textContent = t; }
  const fiNum = v => (ok(v) ? String(Math.round(v * 1000) / 1000).replace('.', ',') : '');
  function csvRows(rows) { return rows.map(r => r.map(x => (typeof x === 'number' ? fiNum(x) : `"${String(x).replace(/"/g, '""')}"`)).join(';')).join('\r\n'); }
  function resultsCsv(r) {
    const e = r.econ, en = r.energy, out = [['Maatilan hybridienergialaskuri 0.10.0', new Date().toISOString().slice(0, 10)], ['Tila', r.status], []];
    out.push(['YHTEENVETO', 'Arvo', 'Yksikkö']);
    [['Kassasäästö ylläpidon jälkeen', e.cash, '€/v'], ['NPV', e.npv, '€'], ['Takaisinmaksuaika', e.payback, 'v'], ['Investointi brutto', e.gross, '€'],
      ['Tuki', e.subsidy, '€'], ['Nettoinvestointi', e.net, '€'], ['Energiasäästö', e.energySaving, '€/v'], ['Reservituotto', e.reserve.farm, '€/v'],
      ['Ylläpito', e.om, '€/v'], ['Sähkön osto, lähtö', en.buyBase, 'kWh/v'], ['Sähkön osto, hybridi', en.buyHyb, 'kWh/v'], ['PV-tuotanto', en.pv, 'kWh/v'],
      ['PV-myynti', en.sell, 'kWh/v'], ['CHP-sähkö', en.chp, 'kWh/v']].forEach(x => out.push(x));
    out.push([], ['KUUKAUDET', 'Osto lähtö kWh', 'Osto hybridi kWh', 'PV kWh', 'Myynti kWh', 'Akun purku kWh', 'LP lämpö kWh', 'Päälämpö kWh', 'Osto hybridi €', 'Myynti €', 'Huippu kW']);
    r.monthly.forEach((m, i) => out.push([KK[i], m.base, m.buy, m.pv, m.sell, m.dis, m.hp, m.main, m.costHyb, m.sales, m.peakHyb]));
    out.push([], ['VUODET', 'Kalenterivuosi', 'Energiasäästö €', 'Ylläpito €', 'Reservi €', 'Käyttökassavirta €', 'Nykyarvo €', 'Uusimiset €', 'Kertynyt €']);
    r.years.forEach(y => out.push([y.t, y.year, y.saving, y.om, y.reserve, y.cash, y.pv, y.replacements, y.cumulative]));
    out.push([], ['LÄHTÖTIEDOT (poikkeamat oletuksista)', 'Arvo']);
    Object.entries(diffParams(r.p)).forEach(([k, v]) => out.push([k, v]));
    return csvRows(out);
  }
  function hourlyCsv(r) {
    const o = r.o, keys = [['buy', 'Verkko-osto kWh'], ['sell', 'Myynti kWh'], ['pv', 'PV kWh'], ['dis', 'Akun purku kWh'], ['ch', 'Akun lataus PV kWh'],
      ['gridch', 'Akun verkkolataus kWh'], ['soc', 'Akun varaus kWh'], ['hp', 'LP lämpö kWh'], ['hpel', 'LP sähkö kWh'], ['eb', 'Sähkökattila kWh'],
      ['main', 'Päälämpö kWh'], ['unmet', 'Lämpövaje kWh'], ['chp', 'CHP kWh'], ['r', 'FCR-D ylös kW'], ['rdown', 'FCR-D alas kW'], ['buyP', 'Ostohinta €/kWh'], ['sellP', 'Myyntihinta €/kWh']];
    const out = [['Tunti', ...keys.map(k => k[1])]];
    for (let t = 0; t < 8760; t++) out.push([t + 1, ...keys.map(([k]) => o[k][t])]);
    return csvRows(out);
  }
  const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  function applyParams(obj) { setInputs(Object.assign({}, L.DEFAULTS, obj)); render(); }
  function fromHash() {
    const m = /[#&]p=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (!m) return false;
    try { applyParams(JSON.parse(b64d(m[1]))); msg('Lähtötiedot avattu jakolinkistä. Omat data- ja hintatiedostot eivät kulje linkissä.'); return true; }
    catch (e) { msg('Jakolinkin lähtötietoja ei voitu lukea.'); return false; }
  }

  /* ------------------------------------------------------------------ comparison */
  const STORE = 'hybridilaskuri.vertailu.v1';
  let pinned = [];
  try { pinned = JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { pinned = []; }
  const saveStore = () => { try { localStorage.setItem(STORE, JSON.stringify(pinned)); } catch (e) { /* storage unavailable */ } };
  function describe(p) {
    const parts = [];
    if (p.pvOn) parts.push(`PV ${p.pv}`); if (p.akkuOn) parts.push(`akku ${p.akku}`); if (p.lpOn) parts.push(`LP ${p.lp}`);
    if (p.ekOn) parts.push(`SK ${p.ek}`); if (p.varOn) parts.push(`varaaja ${p.varaaja}`); if (p.chpOn) parts.push(`CHP ${p.chpOsuus}`);
    if (p.reservi === 'Kyllä') parts.push('FCR-D ' + p.skenaario);
    if (p.hinnoittelu === 'Pörssihinta') parts.push('pörssi ' + p.hintavuosi);
    if (p.tuotanto !== 'Lihasikala') parts.push(p.tuotanto.toLowerCase());
    return parts.join(', ') || 'Lähtötilanne';
  }
  function pin() {
    if (!last || !last.econ) return;
    const p = readInputs(), e = last.econ, en = last.energy;
    pinned.push({ name: describe(p), params: diffParams(p), own: ownName, res: {
      status: last.status, gross: e.gross, net: e.net, saving: e.energySaving, reserve: e.reserve.farm, om: e.om, cash: e.cash, payback: e.payback,
      npv: e.npv, buy: en.buyHyb, pv: en.pv, sell: en.sell, co2: last.co2.opHourly[1] } });
    if (pinned.length > 6) pinned.shift();
    saveStore(); renderCompare(); msg(`Lisätty vertailuun: ${pinned[pinned.length - 1].name}.`);
  }
  function renderCompare() {
    if (!pinned.length) { $('tCmp').innerHTML = ''; return; }
    const rows = [['Tila', 'status', x => x], ['Investointi brutto €', 'gross', f0], ['Nettoinvestointi €', 'net', f0], ['Energiasäästö €/v', 'saving', f0],
      ['Reservituotto €/v', 'reserve', f0], ['Ylläpito €/v', 'om', f0], ['Kassasäästö €/v', 'cash', f0], ['Takaisinmaksu v', 'payback', f1], ['NPV €', 'npv', f0],
      ['Sähkön osto kWh/v', 'buy', f0], ['PV kWh/v', 'pv', f0], ['Myynti kWh/v', 'sell', f0], ['Käyttövaiheen CO₂e t/v (tuntikerroin)', 'co2', f1]];
    const head = ['', ...pinned.map((x, i) => `${i + 1}. ${esc(x.name)}${x.own ? '<span class="badge">oma tiedosto</span>' : ''}`)];
    const body = rows.map(([l, k, f]) => [l, ...pinned.map(x => f(x.res[k]))]);
    body.push(['', ...pinned.map((x, i) => `<button type="button" class="ghost" data-apply="${i}">Avaa</button> <button type="button" class="ghost" data-del="${i}">Poista</button>`)]);
    table('tCmp', head, body, { 8: 'total' });
  }

  /* ------------------------------------------------------------------ wiring */
  const TABS = [['yhteenveto', 'Yhteenveto'], ['kuukaudet', 'Kuukaudet'], ['kassavirta', 'Kassavirta'], ['paastot', 'Päästöt'], ['reservi', 'Reservi'],
    ['optimointi', 'Optimointi'], ['vertailu', 'Vertailu'], ['menetelma', 'Menetelmä ja lähteet']];
  function showTab(id) {
    TABS.forEach(([t]) => { $('p-' + t).hidden = t !== id; const b = $('tab-' + t); b.setAttribute('aria-selected', String(t === id)); });
  }
  function init() {
    buildForm();
    $('tabs').innerHTML = TABS.map(([id, label]) => `<button type="button" role="tab" id="tab-${id}" aria-controls="p-${id}">${label}</button>`).join('');
    TABS.forEach(([id]) => $('tab-' + id).addEventListener('click', () => showTab(id)));
    table('tProd', ['Tuote', 'Laskennassa', 'Vähimmäistarjous', 'Perustelu'], PRODUCTS);
    setInputs(L.DEFAULTS); showTab('yhteenveto');
    $('inputs').addEventListener('input', schedule); $('inputs').addEventListener('change', schedule);
    $('palauta').addEventListener('click', () => { setInputs(L.DEFAULTS); render(); });
    $('fOwn').addEventListener('change', ev => { const f = ev.target.files[0]; if (f) f.text().then(t => { loadOwn(f.name, t); render(); }); });
    $('fPrice').addEventListener('change', ev => {
      const files = [...ev.target.files];
      Promise.all(files.map(f => f.text().then(t => loadPrices(f.name, t)))).then(errs => {
        updatePriceInfo(); const e = errs.filter(Boolean); if (e.length) $('priceInfo').textContent += ' ' + e.join(' ');
        if (Object.keys(prices).length) $('hinnoittelu').value = 'Pörssihinta';
        const ys = Object.keys(prices); if (ys.length && !prices[$('hintavuosi').value]) $('hintavuosi').value = ys.sort().slice(-1)[0];
        render();
      });
    });
    $('fPriceClear').addEventListener('click', () => { prices = {}; priceNames = {}; updatePriceInfo(); render(); });
    $('tSave').addEventListener('click', () => download('hybridilaskuri_lahtotiedot.json', JSON.stringify({ versio: '0.10.0', lahtotiedot: diffParams(readInputs()) }, null, 2), 'application/json'));
    $('tOpenBtn').addEventListener('click', () => $('tOpen').click());
    $('tOpen').addEventListener('change', ev => {
      const f = ev.target.files[0]; if (!f) return;
      f.text().then(t => { try { const j = JSON.parse(t); applyParams(j.lahtotiedot || j); msg(`Avattu ${f.name}.`); } catch (e) { msg(`Tiedostoa ${f.name} ei voitu lukea.`); } });
    });
    $('tLink').addEventListener('click', () => {
      const url = location.href.split('#')[0] + '#p=' + b64e(JSON.stringify(diffParams(readInputs())));
      const done = () => msg('Jakolinkki kopioitu. Omat data- ja hintatiedostot eivät kulje linkissä.');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => msg(url));
      else msg(url);
    });
    $('tCsv').addEventListener('click', () => { if (last && last.econ) download('hybridilaskuri_tulokset.csv', resultsCsv(last)); });
    $('tHourly').addEventListener('click', () => { if (last && last.o) download('hybridilaskuri_tuntitase.csv', hourlyCsv(last)); });
    $('tPin').addEventListener('click', pin);
    $('tCmp').addEventListener('click', ev => {
      const a = ev.target.getAttribute('data-apply'), d = ev.target.getAttribute('data-del');
      if (a != null) { applyParams(pinned[+a].params); showTab('yhteenveto'); }
      if (d != null) { pinned.splice(+d, 1); saveStore(); renderCompare(); }
    });
    $('oRun').addEventListener('click', () => {
      const parse = s => s.split(',').map(x => parseFloat(x.trim())).filter(Number.isFinite);
      const lists = ['oPv', 'oLp', 'oEk', 'oVar', 'oAkku', 'oChp'].map(k => parse($(k).value));
      $('oRun').disabled = true; $('oTila').textContent = 'Lasketaan…';
      setTimeout(() => {
        const t0 = performance.now();
        const res = L.optimise(readInputs(), data, own, Object.keys(prices).length ? prices : null, lists, $('oMetric').value);
        const b = res.best, map = { pv: ['pvOn', 'pv'], lp: ['lpOn', 'lp'], ek: ['ekOn', 'ek'], varaaja: ['varOn', 'varaaja'], akku: ['akkuOn', 'akku'], chpOsuus: ['chpOn', 'chpOsuus'] };
        Object.entries(map).forEach(([k, [on, size]]) => { if (b[k] > 0) { $(on).checked = true; $(size).value = b[k]; } else $(on).checked = false; });
        const log = res.log.filter(x => x.score != null).sort((a, c) => c.score - a.score).slice(0, 10);
        table('tOpt', ['#', 'PV kWp', 'LP kW', 'SK kW', 'Varaaja m³', 'Akku kWh', 'CHP', 'Netto €', 'Säästö €/v', 'Takaisinm. v', 'NPV €'],
          log.map((x, i) => [i + 1, ...x.cfg.map(v => String(v).replace('.', ',')), f0(x.net), f0(x.cash), f1(x.payback), f0(x.npv)]), ['sel']);
        $('oTila').textContent = `${res.log.length} kokoonpanoa, ${res.passes} kierrosta, ${nf1.format((performance.now() - t0) / 1000)} s. Paras asetettu syötteisiin; taulukossa 10 parasta.`;
        $('oRun').disabled = false; render();
      }, 30);
    });
    updatePriceInfo();
    if (!fromHash()) render();
    window.addEventListener('hashchange', fromHash);
  }
  init();
})();
