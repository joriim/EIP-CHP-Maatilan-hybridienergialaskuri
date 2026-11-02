# Version 0.10.0 tarkistukset — 2.11.2026

| Tarkistus | Tulos |
|---|---|
| LibreOffice Calc, täysi uudelleenlaskenta (.xlsm ja .xlsx) | 431 720 kaavaa, 0 virhettä |
| Riippumaton kaavatulkitsin vs. LibreOffice | 0 poikkeamaa |
| Excel-regressio (malli/test_excel.py), uutena oma data + oma ulkolämpötila + lämpöpumppu 30 kW | 16 täyttä vuotta ja 5 puutetilaa hyväksytty; uusi tapaus: tuntiero 0, NPV 38 306,13 € |
| Selainversio vs. työkirja (node web/testi.js) | 10 tapausta ja 3 puutetilaa sekä 2 932 yksityiskohtaista arvoa kuudessa tapauksessa täsmäävät |
| Selainversion käyttöliittymä Chromiumissa (1 400 px vaalea, 420 px tumma) | ei skriptivirheitä eikä vaakavieritystä; Rakennushaku-muotoinen tiedosto, pörssihinnat, CSV- ja JSON-lataus, jakolinkki ja vertailu toimivat |

Yksityiskohtainen vertailu kattaa Ohjauspaneelin energia-, talous- ja päästörivit (C33–D43, C46–E55, G16–G18, C59–C64, C68–D76, K37, K68), Kuukausikoonnin C–X kaikilta kuukausilta ja Vuosikassavirran B–I kaikilta vuosilta. Tapaukset: oletus, CHP 15 %, reservi (viimeiset 12 kk), lämpöpumppu + sähkökattila + varaaja synteettisellä pörssihinnalla, oma data omalla ulkolämpötilalla sekä broileri + biokaasu + 25 vuotta. Toleranssi on 10⁻⁶ suhteellinen; kuukausittaiset CO₂-kilot 10⁻⁵, koska työkirjan tuntikerroin poikkeaa data/fingrid_paastokerroin_2025.csv:stä ±0,001 g/kWh muutamalla tunnilla pyöristyksen vuoksi.

Microsoft Excelin avaamista ja makron ajoa ei ole testattu tässä ympäristössä. GitHub Pages -julkaisu ja Actions-testit ajetaan vasta, kun repositorio on GitHubissa.

---

# Version 0.9.3 tarkistukset — 23.10.2026

| Tarkistus | Tulos |
|---|---|
| LibreOffice Calc, täysi uudelleenlaskenta (.xlsm ja .xlsx) | 422 958 kaavaa, 0 virhettä |
| Riippumaton kaavatulkitsin vs. LibreOffice, kaikki kaavat | 0 poikkeamaa |
| Tallennettujen kaavojen vertailu sim.py-malliin, 12 täyttä vuotta, 27 tuntisaraketta (mukana FCR-D alas BH–BI) | hyväksytty, suurin tuntiero 3,8 × 10⁻¹⁴ |
| Reservituotto C30 vs. `reserve_revenue` (osuus 50 %, 12 €/kk) | täsmää alle 10⁻⁶ € |
| Puutetilat, uutena *Reservihinta puuttuu* (alas-hinnat puuttuvat valitulta vuodelta) | NPV estetty |
| Excel-regressiotapaukset | 15 täyttä vuotta ja 5 puutetilaa hyväksytty |
| Python-regressiotestit | 18/18 (uutena alas-reservin varastotila- ja tehorajat sekä palkkiokaava) |
| Hinta- ja reservidatan muunnostestit | 5/5 ja 3/3 |

Reservitapaukset (akku 60 kWh / 30 kW, PV 200 kWp, kiinteä hinta, rinnakkain omakäytön kanssa ellei toisin mainita):

| Tapaus | Tilan reservituotto €/v | Kassasäästö €/v | NPV € |
|---|---:|---:|---:|
| Ei reserviä (oletus) | 0 | 17 493,04 | 57 994,04 |
| Viimeiset 12 kk, ylös ja alas (oletusskenaario) | 405,65 | 17 857,20 | 61 569,50 |
| Kyllästynyt markkina, ylös ja alas | 708,02 | 18 159,57 | 61 417,56 |
| Kyllästynyt markkina, vain alas | 647,60 | 18 109,22 | 61 189,50 |
| Tuntihinnat 2025, ylös ja alas | 1 515,69 | 18 967,24 | 72 468,04 |
| Tuntihinnat 2025, vain ylös | 325,42 | 17 808,65 | 61 092,80 |
| Reservi ensin, kyllästynyt markkina | 871,73 | 17 645,38 | 55 647,59 |

FCR-D alas -tuntihinnat (Fingrid 283) ladattiin 31.10.2026 ja muunnettiin skriptillä muunna_fingrid_reservi.py. Keskihinnat 2022–2026: 24,5 / 16,4 / 16,6 / 10,8 / 2,8 €/MW,h (2021 kaikki 0). Vuoden 2026 alas-tuntihinta on alle puolet vuosimarkkinan 6,00 €/MW,h:sta, joten oletusskenaario on toteutunut 12 kuukautta. Rinnakkaiskäytössä alas-suunta tuo suurimman osan tuotosta. Reservi ensin tuottaa enemmän reservituloa, mutta menetetty omakäyttösäästö tekee NPV:stä oletusta heikomman.

**Selainversio.** `node web/testi.js` laskee kymmenen työkirjan tapausta (oletus, ei akkua, pörssi, lämpöpumppu ja varaaja, CHP kolme tapausta, reservi kolme tapausta, 10 vuotta) ja kolme puutetilaa JavaScript-mallilla; kaikki täsmäävät työkirjaan suhteellisella erolla alle 10⁻⁹ (12 kk -reservi alle 10⁻⁴, vertailuarvo pyöristetty). Sivu tarkistettiin Chromiumissa 1 400 ja 420 px leveydellä, vaaleassa ja tummassa teemassa: ei skriptivirheitä eikä vaakavieritystä; optimointi laski 46 kokoonpanoa 0,6 sekunnissa.

Toistaminen: kuten 0.9.2, lisäksi `python -m unittest discover -s scripts -p test_reservidata.py -v` ja `node web/testi.js`.

---

# Version 0.9.2 tarkistukset — 22.10.2026

## Mitä tarkistettiin

| Tarkistus | Tulos |
|---|---|
| LibreOffice Calc, täysi uudelleenlaskenta (.xlsm ja .xlsx) | 387 903 kaavaa, 0 virhettä |
| Riippumaton kaavatulkitsin (excel_tarkistus.py) vs. LibreOffice, kaikki kaavat | 0 poikkeamaa, suurin hyväksytty ero 1,1 × 10⁻⁸ |
| Tallennettujen kaavojen vertailu sim.py-malliin, 10 täyttä vuotta, 25 tuntisaraketta | kaikki hyväksytty, suurin tuntiero 2,8 × 10⁻¹⁴ |
| Puute- ja virhetilat (lämpövaje, hinta puuttuu, oma data puuttuu, CHP-osuus > 1) | NPV estetty, K14 oikea viesti |
| Python-regressiotestit | 16/16 hyväksytty (3 uutta CHP-testiä) |
| Hintatiedoston tuontitestit | 5/5 hyväksytty |
| ZIP/XML-rakenne ja tyylijärjestys (.xlsm ja .xlsx) | hyväksytty |
| Tietosuoja: hintasarjat, kommentit, lisäosat, merkinnät, polut, nimet | ei löydöksiä |

## Tallennettujen kaavojen tapaukset

| Tapaus | Suurin tuntiero | Kassasäästö ylläpidon jälkeen €/v | NPV € |
|---|---:|---:|---:|
| Oletus, PV 200 kWp + akku 60 kWh | 0 | 17 493,04 | 57 994,04 |
| PV 200 kWp, ei akkua | 0 | 17 180,44 | 73 914,69 |
| Reservi ensin, 2025 kapasiteettihinnat | 0 | 18 827,74 | 71 098,41 |
| Rinnakkainen reservi, 2025 kapasiteettihinnat | 2,8 × 10⁻¹⁴ | 17 938,82 | 62 370,80 |
| Synteettinen tasahintainen pörssivuosi | 0 | 32 948,33 | 209 736,39 |
| Kiinteä hinnoittelu, pörssiohjaus valittuna | 0 | 17 493,04 | 57 994,04 |
| LP, vastus ja varaaja synteettisillä hinnoilla | 7,1 × 10⁻¹⁵ | 29 364,57 | 162 490,48 |
| CHP 15 % (45 kWe), kiinteä hinta | 0 | 19 032,83 | −26 486,67 |
| CHP 15 %, synteettinen pörssi, negatiivisen myynnin katkaisu | 0 | 32 810,02 | 108 779,85 |
| CHP päällä, päälämpö Toimitettu lämpö (CHP ei käy) | 0 | 17 493,04 | 57 994,04 |
| 10 vuoden tarkastelu (ei invertterin vaihtoa) | – | – | 11 179,69 |

Kiinteän hinnan tapausten tulokset ovat samat kuin versiossa 0.9.1, eli rivin 15 lisäys ja hintahistoria eivät muuttaneet aiempaa laskentaa. CHP-tapauksissa tuntisarakkeet BD–BG, verkko-osto ja NPV täsmäävät sim.py- ja talous.py-laskentaan. Oletuksilla (15 %, 3 000 €/kWe, hake 16 €/MWh) CHP lisää vuotuista säästöä, mutta 135 000 euron lisäinvestointi tekee kokonais-NPV:stä negatiivisen. Synteettinen hintasarja (12 h 0 €/MWh ja 12 h 200 €/MWh joka päivä) on regressiotesti, ei hintaennuste.

## Löydetty ja korjattu virhe

Ilman pörssihintoja täysi uudelleenlaskenta antoi #ARVO!-virheen akun verkkolataussarakkeeseen (Tuntitase AH) ja sitä kautta kaikkiin tuloksiin. Excelin ja Calcin AND() laskee kaikki argumentit, joten ehto `AD-AB` laskettiin myös tyhjällä hinnalla. Virhe toistui myös 0.9.1-tiedostossa LibreOfficen täydessä uudelleenlaskennassa (88 236 virhesolua). Aiempi tarkistus ei havainnut sitä, koska tulkitsin käsitteli tyhjää merkkijonoa nollana. Tulkitsin noudattaa nyt Excelin sääntöä, ja AH-kaava laskee hintaeron vain numeerisesta hinnasta.

## Makro

Optimointimakroa ei voi ajaa tässä ympäristössä (ei Microsoft Exceliä). Ajettavaa makroa vastaava laskenta on testattu yllä: jokainen haun kokoonpano on tavallinen Ohjauspaneelin syöte. Makron koodi tarkistettiin lukemalla. 0.9.2-luonnoksen hakulokissa kaikilla 28 kokoonpanolla oli sama säästö ja NPV, mikä viittaa siihen, ettei laskenta päivittynyt kokoonpanojen välillä. Korjattu moduuli (laskuri/Optimointi.bas) odottaa laskennan valmistumista ja varoittaa samanlaisista tuloksista.

### Makron päivitys työkirjaan

Työkirjassa on 0.9.2-luonnoksen moduuli. Korjattu moduuli tuodaan Excelissä:

1. Avaa laskuri/Maatilan_hybridienergialaskuri.xlsm ja salli makrot.
2. Alt+F11 → Project-ikkunassa Module1 hiiren oikealla → Remove Module1 → No (ei vientiä).
3. File → Import File… → laskuri/Optimointi.bas. Moduulin nimeksi tulee Module1.
4. Debug → Compile VBAProject. Sulje editori ja tallenna .xlsm-muodossa.
5. Aja haku lyhyillä listoilla (esim. PV 0, 200 ja akku 0, 60) ja tarkista, että lokin säästöt eroavat ja Ohjauspaneeli palautuu Esc-painalluksella.
6. Tarkista, ettei tallennus lisännyt luottamuksellisuusmerkintää, kommentteja tai lisäosia, ja aja `python scripts/tarkista_xlsx_rakenne.py` sekä `python scripts/tee_xlsx.py` uudelleen.

## Toistaminen

```
python -m unittest discover -s malli -p test_regressiot.py -v
python -m unittest discover -s scripts -p test_hintadata.py -v
python scripts/tarkista_xlsx_rakenne.py laskuri/Maatilan_hybridienergialaskuri.xlsm
python scripts/tarkista_xlsx_rakenne.py laskuri/Maatilan_hybridienergialaskuri.xlsx
python malli/test_excel.py laskuri/Maatilan_hybridienergialaskuri.xlsm
python malli/vertaa.py
```

## Rajat

Microsoft Excelin omaa avaamista, makron ajoa ja painikkeen toimintaa ei ole testattu tässä ympäristössä. Tiedostot pyytävät täyttä uudelleenlaskentaa avattaessa. Tallennetut tulokset on laskettu LibreOffice Calcissa (LibreOffice 24.2.7.2). CHP:n parametrit ovat omia oletuksia, eikä niitä ole verrattu laitetietoihin.

---

# Version 0.9.1 tarkistukset — 21.10.2026

## Suoritetut testit

13 Python-regressiotestiä: kaikki hyväksytty.

- Kiinteähintainen tila ei verkkolataa pörssivalinnan perusteella.
- Tasahintainen päivä sisältää täsmälleen valitut lataustunnit ja mahdollistaa purun.
- Tyhjä reserviakku ei tarjoa tehoa; lataus, aktivointienergia ja SOC-tase täsmäävät.
- Rinnakkaisreservin energiakate jää omakäytön jälkeen.
- Lämmitysvaje estää kannattavuusvertailun.
- Taloudellinen LP ei käytä haketta kalliimpaa verkkolämpöä testitapauksessa.
- Varaajan verkkolataus, lämpöhäviö ja purkuteho säilyttävät energiataseen.
- Kuuden vuoden akulle huomioidaan uusimiset vuosina 6, 12 ja 18.
- Alle 12 vuoden tarkastelu ei sisällä invertterin vaihtoa.
- Motiva-taulukon interpolointi: 2045 = 35 ja 2026–2045 keskiarvo 116,642857 g/kWh.
- MILP on rajoitettu negatiivisella hinnalla eikä lataa/pura tai osta/myy samanaikaisesti.
- Tehomaksun huippu huomioidaan kerran kuukaudessa.
- PV-leikkaus ei ylitä PV-tuotantoa.

Excel-tiedoston tallennetut kaavat tarkistettiin lisäksi riippumattomalla, tämän tiedoston funktiojoukolle toteutetulla tulkitsimella (excel_tarkistus.py). Seitsemän täyden 8 760 tunnin tapausta verrattiin sim.py-malliin 21 tuntisarakkeen osalta:

| Tapaus | Suurin tuntiero | Kassasäästö ylläpidon jälkeen €/v | NPV € |
|---|---:|---:|---:|
| Oletus, PV 200 kWp + akku 60 kWh | 0 | 17 493,04 | 57 994,04 |
| PV 200 kWp, ei akkua | 0 | 17 180,44 | 73 914,69 |
| Reservi ensin, 2025 kapasiteettihinnat | 0 | 18 827,74 | 71 098,41 |
| Rinnakkainen reservi, 2025 kapasiteettihinnat | 0 | 17 938,82 | 62 370,80 |
| Synteettinen tasahintainen pörssivuosi | 0 | 32 948,33 | 209 736,39 |
| Kiinteä hinnoittelu, pörssiohjaus valittuna | 0 | 17 493,04 | 57 994,04 |
| LP, vastus ja varaaja synteettisillä hinnoilla | 7,11 × 10⁻¹⁵ | 29 364,57 | 162 490,48 |

Synteettinen hintasarja: joka päivä 12 h hintaan 0 €/MWh ja 12 h hintaan 200 €/MWh. Nämä kolme hintariviä ovat regressiotestejä, eivät hintaennusteita tai todettuja maatilatuottoja. Reserviluvut käyttävät oletettua tasaista aktivointienergiaa; ne eivät ole toteutuneen reservitoiminnan jälkilaskentoja.

Lisäksi tarkistettiin Excel-kaavoista, että lämpövaje, puuttuvat pörssihinnat ja puuttuva oma kulutusdata estävät NPV:n näyttämisen. 10 vuoden tarkastelun invertterikustannuksen nykyarvo on nolla. Oletuksen NPV täsmäsi erilliseen talous.py-laskentaan alle 0,000001 euron poikkeamalla.

Oletusesimerkin akun lisä-NPV on **−15 920,65 €**. Ero aiempaan tarkastukseen johtuu lisätystä 15 vuoden kalenteri-iästä ja akun vaihdosta. Kokonais-NPV ei osoita akun lisäinvestointia kannattavaksi.

## Toistaminen

```
python -m unittest discover -s malli -p test_regressiot.py -v
python malli/vertaa.py
python malli/test_excel.py laskuri/Maatilan_hybridienergialaskuri.xlsx
```

Testiohjelman valinnainen `--write-caches` päivittää tiedoston oletustapauksen tallennetut tulosarvot. Tavallinen testiajo on vain luku.

## Rajat

Alkuperäisessä tarkistuksessa natiivisovelluksen ajo puuttui. Rakennekorjauksen yhteydessä 21.10.2026 työkirja avattiin, laskettiin uudelleen ja tallennettiin LibreOffice Calcissa. Microsoft Excelin omaa avaamista ei ole testattu. Funktiojoukon riippumaton tarkistus, tallennetut arvot ja kuvallinen tarkastus eivät korvaa natiivisovelluksen hyväksyntätestiä. Tiedosto pyytää täyttä uudelleenlaskentaa avattaessa. Suositus: Microsoft 365 / Excel 2019+ tai ajantasainen LibreOffice; MAXIFS ei toimi kaikissa Excel 2016 -asennuksissa.

Sää- ja PV-aineiston alkuperää, kaikkia Fingrid-havaintoja tai laitekohtaisia COP/LCA-arvoja ei ole tällä testillä validoitu. Aineistot säilytettiin muuttumattomina. Katso LAHTEET.md.

## Excel-rakenteen korjaus

Tyylitiedoston elementtijärjestyksessä colors oli dxfs-elementin edellä. Järjestys korjattiin, minkä jälkeen työkirja avattiin ja tallennettiin LibreOfficeDev 26.8.0.0.alpha0:ssa. Toimitettu tiedosto on tämä natiivisovelluksessa tallennettu versio. Kaavamäärä 334 532 säilyi ja soluvirheitä oli nolla.

21 tuntisarakkeen koko vuoden tulosten suurin ero aiempaan tarkistukseen oli 4,973799150320701 × 10^-14. E53 = 57 994,0368039772 euroa säilyi samana. Kaavoja tai laskentaoletuksia ei muutettu rakennekorjauksessa.

## Pörssihintojen latauslinkit (21.10.2026)

Kaikki viisi suoraa latauslinkkiä vastasivat HTTP 200: Sähkötin 2023, 2024 ja 2025, Elering FI 2025 sekä Energy-Charts FI 2025. Kukin lataus muunnettiin 8 760 tuntihinnaksi, puuttuvia 0. Vuoden 2025 sarjojen suurin ero Sähköttimeen oli 0,005 €/MWh. Ladattua hintadataa ei sisällytetä jakeluun.

Viisi tuontimuodon yksikkötestiä läpäistiin: UTC/EET, desimaalipilkku, FI-aluevalinta, nolla/negatiivinen/puuttuva JSON-hinta sekä virheellinen yksikkö tai sarjan pituus. Toistaminen: `python -m unittest discover -s scripts -p test_hintadata.py`.

Pörssihinnat-välilehdelle lisättiin viisi HYPERLINK-kaavaa. Työkirja avattiin, laskettiin ja tallennettiin Calcissa. Alkuperäiset 334 532 kaavaa säilyivät samoina ja niiden numeeriset tulokset täsmäsivät alle 0,000001:n erolla. Lisättyjen linkkikaavojen tallennetut otsikot ja URL-osoitteet tarkistettiin. ZIP/XML-rakennetarkistus ei löytänyt virheitä. Microsoft Excelin omaa avaamista ei ole testattu.
