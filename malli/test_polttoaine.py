"""Polttoainemoduulin testit: käsin lasketut tarkistukset ja yhteiset tapaukset (data/polttoaine_testitapaukset.json)."""
import json
import unittest

from polttoaine import DEFAULTS, TAPAUKSET, TESTIT, aja, lampoarvo_saapumistilassa, laske, ominaisuudet


class Polttoaine(unittest.TestCase):
    def test_lampoarvo_saapumistilassa(self):
        # tuore hake 50 %: 19,2 × 0,5 − 0,02443 × 50 = 8,3785 MJ/kg
        self.assertAlmostEqual(lampoarvo_saapumistilassa(19.2, 50) * 3.6, 8.3785, places=4)

    def test_ominaisuudet_kasin(self):
        # Oma puu 50 %: 1 k-m³ = 400 kg ka = 0,8 t → 0,8 × 8,3785 / 3,6 = 1,86189 MWh; 0,4 k-m³/i-m³ → 0,74476 MWh/i-m³
        o = ominaisuudet(DEFAULTS['oma'])
        self.assertAlmostEqual(o['mwhPerKm3'], 1.861889, places=5)
        self.assertAlmostEqual(o['mwhPerIm3'], 0.744756, places=5)
        self.assertAlmostEqual(o['hintaMwh'], 28 / 1.861889, places=4)
        self.assertAlmostEqual(o['hintaKm3'], 28, places=9)
        # Ostohake 40 %: 19,2 × 0,6 − 0,9772 = 10,5428 MJ/kg; 0,6667 t/k-m³ → 1,95237 MWh/k-m³ → 0,78095 MWh/i-m³ (laskurin K35 ≈ 0,8)
        b = ominaisuudet(DEFAULTS['osto'])
        self.assertAlmostEqual(b['mwhPerIm3'], 0.780948, places=5)
        self.assertAlmostEqual(b['hintaIm3'], 16 * 0.780948, places=4)

    def test_hinnan_yksikot_vastaavat(self):
        o = ominaisuudet(DEFAULTS['oma'])
        for yks, hinta in (('mwh', o['hintaMwh']), ('km3', o['hintaKm3']), ('im3', o['hintaIm3'])):
            r = laske(1300, oma=dict(maara=300, hinta=hinta, hintaYksikko=yks), osto=dict(hinta=30))
            self.assertAlmostEqual(r['yhteensa']['kustannus'], 300 * 28 + r['rivit'][1]['polttoaine'] * 30, places=6, msg=yks)

    def test_taseet(self):
        for nimi, t in TAPAUKSET.items():
            r = laske(t['lampo'], t.get('oma'), t.get('osto'))
            y = r['yhteensa']
            self.assertAlmostEqual(sum(x['lampo'] for x in r['rivit']), t['lampo'], places=9, msg=nimi)
            self.assertLessEqual(y['kustannus'], y['vainOsto'] + 1e-9, msg=nimi)   # oma puu ei koskaan nosta kustannusta
            if y['polttoaine'] > 0:
                # laskurin polttoainekustannus = lämpö / hyötysuhde × hinta; tilavuus = polttoaine / energiatiheys
                self.assertAlmostEqual(t['lampo'] / y['hyotysuhde'] * y['hinta'], y['kustannus'], places=6, msg=nimi)
                self.assertAlmostEqual(y['polttoaine'] / y['energiatiheys'],
                                       sum(x['polttoaine'] / x['mwhPerIm3'] for x in r['rivit']), places=6, msg=nimi)

    def test_rajoitteet(self):
        r = aja(TAPAUKSET['oma_kalliimpi'])
        self.assertEqual(r['rivit']['oma']['lampo'], 0)
        self.assertEqual(r['yhteensa']['saasto'], 0)
        r = aja(TAPAUKSET['oma_riittaa'])
        self.assertEqual(r['rivit']['osto']['lampo'], 0)
        self.assertAlmostEqual(r['yhteensa']['omaOsuus'], 1)

    def test_yhteiset_tapaukset(self):
        tallennettu = json.loads(TESTIT.read_text(encoding='utf-8'))
        self.assertEqual(set(tallennettu), set(TAPAUKSET))
        for nimi, t in TAPAUKSET.items():
            tulos = aja(t)
            for k, v in tulos['yhteensa'].items():
                self.assertAlmostEqual(v, tallennettu[nimi]['tulos']['yhteensa'][k], places=9, msg=(nimi, k))
            for key, rivi in tulos['rivit'].items():
                for k, v in rivi.items():
                    self.assertAlmostEqual(v, tallennettu[nimi]['tulos']['rivit'][key][k], places=9, msg=(nimi, key, k))


if __name__ == '__main__':
    unittest.main()
