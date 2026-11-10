# Python-mallit 0.13.0

- sim.py: korjattu Excelin sääntöohjaus, mukaan lukien pörssi, reservin odotusenergia (FCR-D ylös ja alas: `reserve_up`, `reserve_down`), CHP-sähkö (`chp_share`) ja aggregaattorin palkkio (`reserve_revenue`).
- lp2.py: SciPy/HiGHS MILP-vertailu, fyysiset suuntarajoitteet ja kuukausihuiput.
- talous.py: korvausten nykyarvo, NPV (myös CHP:n ylläpito ja uusiminen) ja Motiva-skenaarion interpolointi.
- vertaa.py: kiinteähintainen PV/akku/LP-lisäinvestointivertailu.
- aja_esimerkki.py: vertailu käyttäjän täydellä pörssihintasarjalla.
- test_regressiot.py: energia-, hinta-, reservi-, CHP- ja talousrajojen testit.
- vie_vertailu.py: työkirjan tulokset selainversion vertailutestille (web/vertailu_excel.json).
- excel_tarkistus.py ja test_excel.py: työkirjan tallennettujen kaavojen riippumaton tulkinta ja vertailu sim.py-malliin (`python malli/test_excel.py laskuri/Maatilan_hybridienergialaskuri.xlsm`).

```
pip install -r malli/requirements.txt
python -m unittest discover -s malli -p test_regressiot.py -v
python malli/vertaa.py
python scripts/hae_porssihinnat.py 2025
python malli/aja_esimerkki.py porssihinnat_2025.csv
```

Hintasarja: 8 760 numeerista tuntihintaa kiinteässä EET-ajassa. Osavuoden reservihintoja ei täydennetä nollilla. Excelin osavuoden vuositasolle skaalaus on erillinen skenaario.

SOC on AC-purkuenergiaa: hyötysuhde 0,9 latauksessa ja 1 purussa. Kulumisproksi ohjaa käyttöä, mutta ei ole kassameno akun uusimisten lisäksi. MILP tuntee kuormat ja hinnat horisontilla; reservihinnoille tämä on optimistinen oletus. lp2.py mallintaa vain FCR-D ylös -suunnan. Varaajan suhteellinen häviö eroaa sääntömallin vakiohäviöstä. Rajaukset: [MENETELMA.md](../docs/MENETELMA.md).
