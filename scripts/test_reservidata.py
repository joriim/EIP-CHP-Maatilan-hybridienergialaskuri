"""Tests for the Fingrid reserve-price converter (EET hours, sub-hour averaging, leap day)."""
import unittest
from muunna_fingrid_reservi import lue, tunneiksi


class Reservidata(unittest.TestCase):
    def test_utc_to_eet_and_quarter_average(self):
        txt = ('startTime,endTime,FCR-D alas\n'
               '2024-12-31T22:00:00.000Z,2024-12-31T23:00:00.000Z,4\n'
               '2025-01-01T00:00:00.000Z,2025-01-01T00:15:00.000Z,2\n'
               '2025-01-01T00:15:00.000Z,2025-01-01T00:30:00.000Z,4\n')
        c = tunneiksi(lue(txt))[2025]
        self.assertEqual(c[0], 4.0)      # 1.1. klo 00 EET
        self.assertEqual(c[2], 3.0)      # 1.1. klo 02 EET, quarter average
        self.assertEqual(c[1], '')

    def test_semicolon_comma_and_leap_day(self):
        txt = 'startTime;endTime;arvo\n2024-02-29T10:00:00Z;2024-02-29T11:00:00Z;9,5\n2024-03-01T10:00:00Z;2024-03-01T11:00:00Z;1,5\n'
        c = tunneiksi(lue(txt))[2024]
        self.assertEqual(sum(1 for x in c if x != ''), 1)
        self.assertEqual(c[59 * 24 + 12], 1.5)  # 1.3. klo 12 EET, 29.2. removed

    def test_missing_header(self):
        with self.assertRaises(ValueError):
            lue('a,b,c\n1,2,3\n')


if __name__ == '__main__':
    unittest.main()
