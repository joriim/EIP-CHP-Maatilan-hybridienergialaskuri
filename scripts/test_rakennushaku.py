"""Rakennushaun liitos: silta on sivulla täsmälleen kerran, koonti on toistettava ja laskuri ottaa viestin vastaan."""
import re
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RH = ROOT / 'web' / 'rakennushaku.html'


class Rakennushaku(unittest.TestCase):
    def test_silta_kerran_ja_lopussa(self):
        page = RH.read_text(encoding='utf-8')
        self.assertEqual(page.count('<!-- RAKENNUSHAKU-SILTA -->'), 1)
        self.assertEqual(page.count('RH.__laskuriSilta = true'), 1)
        self.assertLess(page.index('root.RH = RH'), page.index('<!-- RAKENNUSHAKU-SILTA -->'))
        self.assertLess(page.index('<!-- /RAKENNUSHAKU-SILTA -->'), page.rindex('</body>'))

    def test_silta_ajan_tasalla(self):
        page = RH.read_text(encoding='utf-8')
        silta = (ROOT / 'web' / 'rakennushaku_silta.js').read_text(encoding='utf-8')
        self.assertIn(silta, page)

    def test_koonti_toistettava(self):
        before = RH.read_bytes()
        subprocess.run([sys.executable, str(ROOT / 'scripts' / 'rakenna_web.py')], check=True, capture_output=True)
        self.assertEqual(before, RH.read_bytes())

    def test_viestityyppi_sama_molemmissa(self):
        silta = (ROOT / 'web' / 'rakennushaku_silta.js').read_text(encoding='utf-8')
        app = (ROOT / 'web' / 'sovellus.js').read_text(encoding='utf-8')
        for name in ('rakennushaku-siirto', 'hybridilaskuri.rakennushaku.v1'):
            self.assertIn("'%s'" % name, silta)
            self.assertIn("'%s'" % name, app)
        # laskuri hyväksyy viestin vain omasta Rakennushaku-kehyksestään
        self.assertRegex(app, r"ev\.source !== \$\('rhFrame'\)\.contentWindow")
        # siirrettävät kentät
        for key in ('sahko', 'lampo', 'ulkolampotila', 'hinnat', 'piirit', 'vuosi'):
            self.assertTrue(re.search(r'\b%s:' % key, silta), key)
            self.assertIn('m.%s' % key, app)


if __name__ == '__main__':
    unittest.main()
