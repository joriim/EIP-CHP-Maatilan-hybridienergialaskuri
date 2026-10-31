"""Latausmuotojen tulkinnan testit: python -m unittest discover -s scripts -p 'test_hintadata.py'."""
import json
import unittest
from hae_porssihinnat import lue, EET

class HintadataTest(unittest.TestCase):
    def test_sahkotin(self):
        t,p=lue('hour,price\n2024-12-31T22:00:00Z,-2.5\n')[0]
        self.assertEqual((t.astimezone(EET).year,t.astimezone(EET).hour,p),(2025,0,-2.5))

    def test_elering_utc_ei_kesaaika(self):
        t,p=lue('"Ajatempel (UTC)";"Kuupäev (Eesti aeg)";"NPS Soome"\n"1735682400";"01.01.2025 00:00";"4,01"')[0]
        self.assertEqual(t.isoformat(),'2024-12-31T22:00:00+00:00')
        self.assertEqual(p,4.01)

    def test_elering_vaara_alue(self):
        with self.assertRaises(ValueError):
            lue('Ajatempel (UTC);Kuupäev;NPS Eesti\n1735682400;x;4,01')

    def test_json_puuttuva_nolla_negatiivinen(self):
        data=lue(json.dumps(dict(unix_seconds=[0,900,1800],price=[None,0,-3],unit='EUR / MWh')))
        self.assertEqual([p for t,p in data],[0,-3])

    def test_json_vaara_yksikko_tai_pituus(self):
        for obj in [dict(unix_seconds=[0],price=[1],unit='ct/kWh'),dict(unix_seconds=[0],price=[],unit='EUR/MWh')]:
            with self.assertRaises(ValueError):lue(json.dumps(obj))

if __name__=='__main__':unittest.main()
