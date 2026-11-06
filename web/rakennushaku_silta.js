/* Rakennushaku → Maatilan hybridienergialaskuri: siirto ilman CSV-tiedostoa.
 * Lisätään Rakennushaun selainversioon (web/rakennushaku.html) koontiskriptillä scripts/rakenna_web.py.
 * Silta ei muuta Rakennushaun laskentaa: se muistaa laskentamoottorin (window.RH) viimeisimmän
 * tuloksen, projektin ja haetut pörssihinnat ja lisää tulosnäkymään painikkeen "Siirrä laskuriin".
 * Upotettuna (iframe) tiedot lähetetään laskurille postMessage-viestinä. Erillisenä sivuna ne
 * tallennetaan selaimen localStorageen ja laskuri avataan osoitteella index.html#rakennushaku.
 * SEAMK, Maatalous ja energia -tutkimusryhmä. Lisenssi: MIT. */
(function () {
  'use strict';
  const RH = window.RH;
  if (!RH || RH.__laskuriSilta) return;
  RH.__laskuriSilta = true;
  const TYPE = 'rakennushaku-siirto', STORE = 'hybridilaskuri.rakennushaku.v1';
  let project = null, result = null;
  const prices = {};

  const prepare = RH.prepare, run = RH.run, fetchPrices = RH.fetchPrices;
  RH.prepare = function (p) { const out = prepare.apply(this, arguments); project = p; return out; };
  RH.run = function () { const out = run.apply(this, arguments); result = out; return out; };
  RH.fetchPrices = async function (year) {
    const out = await fetchPrices.apply(this, arguments);
    if (out && out.values) prices[year] = out.values;
    return out;
  };

  function payload() {
    const r = result;
    const circuits = ((project && project.circuits) || []).map(c => {
      const d = c.data || {}, rep = ((r.calibration && r.calibration.circuits) || []).find(x => x.id === c.id) || {};
      return {
        nimi: c.name || c.id, tapa: d.system || 'fuel', yksikko: d.unit || '', hyotysuhde: d.efficiency == null ? null : +d.efficiency,
        hakeTiheys: d.chip_density == null ? null : +d.chip_density, teho: +d.capacity_kw > 0 ? +d.capacity_kw : null,
        lampo: rep.annual_kwh == null ? null : rep.annual_kwh, huippu: rep.peak_kw == null ? null : rep.peak_kw,
      };
    });
    const ps = {};
    Object.keys(prices).forEach(y => { if (prices[y] && prices[y].length === 8760) ps[y] = prices[y]; });
    const area = document.querySelector('#results h3');
    return {
      type: TYPE, versio: 1, vuosi: r.year, kohde: area ? area.textContent.replace(/^Tuntiprofiili \d+,?\s*/, '') : '',
      sahko: r.electricity, lampo: r.heat, ulkolampotila: r.temperature, hinnat: ps, piirit: circuits,
      yhteensa: { sahko: r.totals.electricity_kwh, lampo: r.totals.heat_kwh, sahkoHuippu: r.totals.electricity_peak_kw,
        lampoHuippu: r.totals.heat_peak_kw, lammityssahko: r.totals.heating_el_kwh || 0 },
    };
  }

  function send(btn) {
    if (!result || !result.electricity || result.electricity.length !== 8760) return;
    const msg = payload();
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, '*');
      btn.textContent = 'Siirretty laskuriin';
      return;
    }
    try { localStorage.setItem(STORE, JSON.stringify(msg)); }
    catch (e) { btn.textContent = 'Siirto ei onnistunut (selaimen tallennustila). Lataa CSV.'; return; }
    window.open(new URL('index.html#rakennushaku', location.href).href, '_blank');
    btn.textContent = 'Avattu laskurissa';
  }

  function addButton() {
    const actions = document.querySelector('#results .res-actions');
    if (!actions || !document.getElementById('dlCsv') || document.getElementById('toLaskuri')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'toLaskuri'; b.className = 'btn small primary';
    b.textContent = window.parent !== window ? 'Siirrä laskuriin' : 'Avaa laskurissa';
    b.title = 'Siirtää sähkön, lämmön, ulkolämpötilan ja haetut pörssihinnat suoraan Maatilan hybridienergialaskuriin.';
    b.addEventListener('click', () => send(b));
    actions.insertBefore(b, actions.firstChild);
    const csv = document.getElementById('dlCsv');
    if (csv) csv.classList.remove('primary');
  }

  function start() {
    const host = document.getElementById('results');
    if (!host) return;
    new MutationObserver(addButton).observe(host, { childList: true, subtree: true });
    addButton();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
