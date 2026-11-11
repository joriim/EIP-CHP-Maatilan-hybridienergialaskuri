"""Polttoainemoduulin testit: käsin lasketut tarkistukset ja yhteiset tapaukset (data/polttoaine_testitapaukset.json)."""
import json
import unittest

from polttoaine import KEYS, TAPAUKSET, TESTIT, aja, lampoarvo_saapumistilassa, laske


class Polttoaine(unittest.TestCase):
    def test_lampoarvo_saapumistilassa(self):
        # VTT T258: olki 20 %:n kosteudessa noin 13,5 MJ/kg (17,4 MJ/kg kuiva-aineessa)
        self.assertAlmostEqual(lampoarvo_saapumistilassa(17.4, 20) * 3.6, 13.4314, places=4)
        # tuore hake 50 %: 19,2 × 0,5 − 0,02443 × 50 = 8,3785 MJ/kg
        self.assertAlmostEqual(lampoarvo_saapumistilassa(19.2, 50) * 3.6, 8.3785, places=4)

    def test_puu_kasin(self):
        # 1 k-m³: 400 kg ka → 800 kg saapumistilassa → 0,8 t × 8,3785/3,6 MWh/t = 1,86189 MWh
        r = laske(260, 16, 0.85, puu=dict(maara=100, kustannus=20))
        puu = r['rivit'][0]
        self.assertAlmostEqual(puu['mwhPerYksikko'], 1.861889, places=5)
        self.assertAlmostEqual(puu['lampo'], 100 * 1.861889 * 0.85, places=3)
        self.assertAlmostEqual(puu['kustannus'], 2000, places=6)
        y = r['yhteensa']
        self.assertAlmostEqual(y['kustannus'], 2000 + (260 - puu['lampo']) / 0.85 * 16, places=6)
        self.assertAlmostEqual(y['hyotysuhde'], 0.85, places=12)

    def test_taseet(self):
        for nimi, t in TAPAUKSET.items():
            r = laske(t['lampo'], t['ostoHinta'], t['ostoHyotysuhde'], **{k: t.get(k) for k in KEYS})
            y = r['yhteensa']
            self.assertAlmostEqual(sum(x['lampo'] for x in r['rivit']), t['lampo'], places=9, msg=nimi)
            self.assertLessEqual(y['kustannus'], y['vainOsto'] + 1e-9, msg=nimi)   # oma jae ei koskaan nosta kustannusta
            for x in r['rivit'][:-1]:
                self.assertLessEqual(x['lampo'], x['lampoPotentiaali'] + 1e-9, msg=nimi)
                self.assertLessEqual(x['lampo'], x['maxLampo'] + 1e-9, msg=nimi)
            if y['polttoaine'] > 0:
                self.assertAlmostEqual(y['hinta'] * y['polttoaine'], y['kustannus'], places=6, msg=nimi)
                # laskurin polttoainekustannus = lämpö / hyötysuhde × hinta
                self.assertAlmostEqual(t['lampo'] / y['hyotysuhde'] * y['hinta'], y['kustannus'], places=6, msg=nimi)

    def test_rajoitteet(self):
        r = aja(TAPAUKSET['olki_enimmaisosuus'])
        self.assertAlmostEqual(r['rivit']['olki']['lampo'], 75, places=9)            # 15 % × 500 MWh
        r = aja(TAPAUKSET['oma_kalliimpi'])
        self.assertEqual(r['rivit']['puu']['lampo'], 0)
        self.assertEqual(r['yhteensa']['saasto'], 0)

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
