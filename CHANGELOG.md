# Muutosloki

## Julkaisematon (2026-11-10): selainversion syötteet

**Muutettua**
- Selainversio: ORC-syötteet (laiterivi, täystehoajo, kohdan 6 CHP/ORC-asetukset, optimoinnin ORC-ehdokkaat) ja ryhmä *8. Päästökertoimet* poistettu näkyvistä. ORC on selainversiossa pois päältä ja päästöt lasketaan oletuskertoimilla; laskentamalli (web/malli.js), Python-malli ja Excel-työkirja ovat ennallaan. Vanhan jakolinkin tai tallennetun tiedoston ORC- ja päästökerroinasetuksia ei enää lueta.
- Selainversio: laskentakorko siirretty investointituen alle (kohta 2) ja annetaan prosentteina.

## 0.13.0 (2026-11-10): ORC:n täystehoajo

**Uutta**
- ORC:n täystehoajo valittuina kuukausina (Ohjauspaneeli K80 Kyllä/Ei, K81 kattilateho 500 kW, K83:K94 kuukausiliput, oletus tammi–huhti ja loka–joulu). Täystehotunnilla kattila syöttää ORC:lle B = min(D14, K81); sähkö = min(K78, K77 × B) ja lämpö ulos B − sähkö. Lämpö kattaa ensin tilan tarpeen, sitten lataa varaajan; loput jäähdytetään. Lämpöpumppu kattaa vain ORC-lämmön ylittävän tarpeen, sähkökattila ei lataa varaajaa. Ehto: CHP ja päälämmitys päällä, K62 ≠ Toimitettu lämpö, B ≥ K76.
- Tuntitase BT (täystehoajo päällä), BU (ORC-lämpö ulos), BV (ylijäämä varaajaan), BW (ylijäämä jäähdyttimeen); muutetut kaavat S, V, W, X, Y, AZ ja BD. Päälämpö Y sisältää täystehotunteina koko tuotetun lämmön, joten polttoaine ja päästöt sisältävät myös jäähdytetyn lämmön. Tulokset K95–K97.
- Selainversio: valinnat ORC-laitteen alla (kohta 2), lämpökuvaajaan ORC-ylijäämä varaajaan ja jäähdyttimeen, energiataseeseen täystehotunnit ja ylijäämät, tuntitase-CSV:hen ylijäämäsarakkeet.
- Python-malli: sim(full_load_kw, full_months).
- Testit: täystehoajo Excel–Python (broileri 1 300 MWh + varaaja; sikala, lämpöpumppu, sähkökattila, 10 m³ varaaja ja kesäkuukaudet) ja Excel–selain (sama kaksi tapausta, 525 arvoa kumpikin).

**Korjattua**
- Ohjauspaneelin solu K77 (ORC:n nettohyötysuhde) jäi yhdistetyn alueen H77:M77 alle piiloon; yhdistely rajattu H77:I77:een.

## 0.12.0 (2026-11-09): 500 kW:n päälämmitys, ORC ja lämpötase

**Muutettua**
- Päälämmityksen teho (D14) oletuksena 500 kW (tuorehakelämpökeskus). Oletusesimerkin tulokset eivät muutu, koska 300 kW riitti jo.
- CHP (rivi 15) on ORC-malli: D15 = bruttosähköteho (40 kWe:n ORC-moduuli), investointi = D15 × F15. Asetukset K69–K79: nimellinen lämpöteho 640 kWth, menovesi 110 °C, paluupiiri 30 °C, viiteolosuhde 110/25 °C, omakäyttö 10 %, pienin lämpöteho 450 kWth. Nettosähköhyötysuhde skaalataan Carnot-kertoimella viiteolosuhteesta; brutto ei ylitä D15:tä. Lämpöohjattu: sähkö = K79 × päälämpö, enintään K78, vain kun ORC:n lämpöteho ≥ K76.
- Aiempi sähköosuus (D15 = 0,15) poistui. Optimoinnin CHP-ehdokkaat ovat nyt kWe (0, 40).
- Python-malli: sim(chp_max, chp_min_heat) ja orc_params(); oletuskattila 500 kW.

**Uutta**
- Tuntitase BS (päälämpö ORC:n kautta) ja Kuukausikoonti Y:AA (lämmöntarve, päälämpö ORC:n kautta, lämpövaje).
- Selainversio: *Lämmön kulutus ja tuotanto kuukausittain* sähkökuvaajan rinnalle; ORC-sähkö sähkökuvaajaan; ORC samalla värillä molemmissa. Kuvaajat avautuvat klikkaamalla suurena omaan ikkunaan kuukausi-, päivä- tai tuntitasolla (ponnahdusikkunan estyessä samalle sivulle).
- Testit: ORC-tapaukset Excel–Python (ei käy sikalalla, broileri 1 300 MWh, paluu 45 °C ja tehoraja, toimitettu lämpö, virheelliset asetukset) ja Excel–selain (2 uutta yksityiskohtaista tapausta, kuukausikoonti C–AA).

**Lähteet**
- Valmistajan datasheet 2019 (40 kWe:n ORC-moduuli): lämmönlähde 70–120 °C, 450–640 kWth, 40 kWe brutto, jäähdytysvesi 0–60 °C.


## 0.11.0 (2026-11-06): Rakennushaku osaksi laskuria

**Uutta**
- Selainversio: kohdan 1 painike *Hae tila Rakennushaulla* avaa Rakennushaun (versio 0.6.0) laskurin päälle. Tulosnäkymän *Siirrä laskuriin* vie sähkön, lämmöntarpeen, ulkolämpötilan, haetut pörssihinnat sekä lämmitysjärjestelmien tehon, kattilan hyötysuhteen ja hakkeen energiatiheyden laskuriin. Laskuri listaa siirretyt tiedot ja huomauttaa, jos nykyinen lämmitys on muu kuin hake- tai biokaasukattila.
- Erillisenä avattu Rakennushaku (https://joriim.github.io/EIP-CHP-Maatilan-hybridienergialaskuri/rakennushaku.html) siirtää tiedot painikkeella *Avaa laskurissa* (selaimen tallennustilan kautta).
- `web/rakennushaku.html` ja siirtosilta `web/rakennushaku_silta.js`; `scripts/rakenna_web.py --rakennushaku` päivittää Rakennushaun. Molemmat sivut julkaistaan GitHub Pagesiin.
- Testit `scripts/test_rakennushaku.py`: silta kerran, koonti toistettava, viestin kentät samat molemmissa päissä.

**Muutettua**
- Excel: *Oma kulutusdata* J3 kertoo, mihin Rakennushaun CSV:n sarake H (pörssihinta) liitetään, ja antaa Rakennushaun osoitteen; versioteksti B81 ja menetelmävälilehti päivitetty. Kaavat ja tulokset eivät muutu.
- Selainversion ilme SEAMKin brändikäsikirjan (2025/03) mukaan: lila ja keltainen päävärit, lisävärit vain tukielementeissä, otsikot Barlow Condensed (korvaa Alte DIN 1451 Mittelschriftin), leipäteksti Arial.
- Laskennan tulokset eivät muutu (node web/testi.js: 2 932 arvoa).


## 0.10.0 (2026-11-02): selainversio tasavertaiseksi Excelin kanssa

**Uutta**
- Selainversio (web/index.html) sisältää kaikki työkirjan parametrit ja tulokset: energiatase, kustannukset, investoinnit ja uusimiset, kuukausikoonti, vuosikassavirta ja kertynyt kassavirta, koko päästöosio (kotimainen kerroin, tuntikerroin, vaikutusskenaario, lämmön toimitusketju, valmistus, biogeeninen muistio), FCR-D-skenaariot, optimointi sekä menetelmä ja lähteet. Jokaisen syötteen kohdalla näkyy vastaava Excel-solu.
- Rakennushaku-tuonti: `oma_kulutusdata_<vuosi>.csv` (sähkö, lämpö, ulkolämpötila, pörssihinta) ja `hintahistoria_2023-2026.csv` luetaan selaimeen sellaisenaan.
- Oma ulkolämpötila lämpöpumpun COP:hen ja pakkasrajaan molemmissa versioissa. Excel: Oma kulutusdata, sarake G (Rakennushaun vienti liitetään sarakkeisiin A–G); Tuntitase BR on laskennassa käytetty lämpötila.
- Monivuotiset pörssihinnat selaimessa: vuosi tai keskiarvo, valitun vuoden puuttuvat tunnit keskiarvolla (kuten Hintahistoria).
- Tallennus ja jakaminen: lähtötiedot JSON-tiedostoon ja jakolinkkiin, tulokset ja tuntitase CSV:nä, vertailu enintään kuudesta vaihtoehdosta.
- GitHub Pages -julkaisu (.github/workflows/pages.yml) ja testit GitHub Actionsissa (.github/workflows/testit.yml).
- Vertailutesti: `malli/vie_vertailu.py` vie työkirjan tulokset kuudesta tapauksesta, ja `node web/testi.js` vertaa niihin 2 932 selainversion arvoa.

**Muutettua**
- Selainversion lähdekoodi jaettu: web/malli.js (laskenta), web/sovellus.js (käyttöliittymä), web/sovellus.html (sivupohja); `scripts/rakenna_web.py` kokoaa yhden tiedoston.
- Nimet: SEAMK ja Maatalous ja energia -tutkimusryhmä tekijätiedoissa; CITATION.cff:ssä ORCID-tunnisteet ja selainversion osoite.
- Oletusesimerkin tulokset eivät muutu.

## 0.9.3 (2026-10-23): reservimarkkinan uudistus

**Uutta**
- FCR-D alas: akun latausteho tarjotaan alas-reserviin ylös-reservin rinnalla (Reservimarkkina C36–C37). Tarjontaa rajaavat vapaa varastotila, latausteho ja energianhallinnan purkutehoreservi. Alas-aktivointi ostetaan verkosta ja lisää varausta (Tuntitase BH–BI, Q, Z).
- Skenaariot: *Kyllästynyt markkina* (Fingridin vuosimarkkina 2026: ylös 3,50, alas 6,00 €/MW,h; vuosimuutos −10 %/v), *Viimeiset 12 kk* (oletus) ja ylös/alas-hinnat jokaiselle vuodelle. *Heikoin vuosi* poistettu.
- Aggregaattorin kiinteä vähimmäispalkkio (C39, 12 €/kk): tilan tuotto = max(0, brutto − max(brutto × (1 − osuus), 12 × palkkio)).
- Reservituotetaulukko: miksi FCR-N, aFRR, mFRR ja FFR eivät ole laskennassa.
- FCR-D alas -tuntihinnat (Fingrid 283, 21.4.2021–30.10.2026) mukana: Tuntitase BJ–BO ja data/fingrid_fcr_d_alas_tuntihinnat.csv. Muunnos `scripts/muunna_fingrid_reservi.py` (CSV ja Excel) ja testit.
- Selainversio web/index.html: sama tuntitase, talous, CHP, FCR-D-reservi ja kokoonpanon optimointi JavaScriptinä (web/malli.js). `node web/testi.js` vertaa tuloksia työkirjan testitapauksiin. Sivu kootaan `scripts/rakenna_web.py`.
- K14: *Reservihinta puuttuu*, jos valitulle skenaariolle ei ole alas-hintoja.

**Muutettua**
- Tilan osuuden oletus 70 % → 50 %. NPV ja Vuosikassavirta käyttävät valitun skenaarion vuosimuutosta (C43).
- Reservi on oletuksena edelleen pois; oletusesimerkin tulokset eivät muutu.
- sim.py: `reserve_down`, `reserve_up`, `reserve_revenue`. lp2.py:n osuuden oletus 50 % (vain ylös-suunta).
- calcChain poistettu työkirjasta; Excel muodostaa sen uudelleen.

## 0.9.2 (2026-10-22): CHP, kokoonpanon optimointi ja hintahistoria

**Uutta**
- CHP-sähkö päälämmityksen yhteydessä (Ohjauspaneelin rivi 15, oletuksena pois). Sähkö = osuus D15 × päälämmön tuotto; ensin tilan sähköntarpeeseen, ylijäämä myyntiin. Lisäpolttoaine kattilan hyötysuhteella, ylläpito €/MWh (K65), käyttöikä ja uusiminen (K66–K67, Vuosikassavirta T2:U7), tukiosuus (Vuosikassavirta rivi 8). Tuntitase BD–BG, Kuukausikoonti W–X.
- Optimointi-välilehti ja makro AjaOptimointi (.xlsm): koordinaattihaku käyttäjän ehdokasarvoista mittarilla NPV, takaisinmaksuaika tai vuotuinen säästö. Paras kokoonpano asetetaan Ohjauspaneeliin ja jokainen kokoonpano kirjataan hakulokiin.
- Hintahistoria-välilehti: vuodet 2023–2026 rinnakkain ja tuntikohtainen keskiarvo. Vuosi tai keskiarvo valitaan solusta K49. Valitun vuoden puuttuvat tunnit täytetään keskiarvolla.
- Makroton .xlsx-versio samoilla kaavoilla. Makron lähdekoodi laskuri/Optimointi.bas. Skripti scripts/tee_xlsx.py.

**Korjattua**
- Ilman pörssihintoja täysi uudelleenlaskenta antoi #ARVO!-virheen akun verkkolataussarakkeesta (Tuntitase AH) kaikkiin tuloksiin. Excelin AND() laskee kaikki argumentit, joten hintaero laskettiin tyhjästä hinnasta. Virhe koski myös 0.9.1-tiedostoa. Hintaero lasketaan nyt vain numeerisesta hinnasta; tulokset hintojen kanssa eivät muutu.
- Makron korjattu versio tiedostossa laskuri/Optimointi.bas: laskenta odotetaan valmiiksi jokaisen kokoonpanon jälkeen, laskenta on haun ajan manuaalinen (nopeampi, ei 12 uudelleenlaskentaa kokoonpanoa kohti), Esc ja virhe palauttavat alkuperäisen kokoonpanon, tyhjä ehdokaslista ei kaada hakua, lokin täyttyminen pysäyttää haun hallitusti ja samanlaisista tuloksista varoitetaan. Moduuli tuodaan työkirjaan Excelissä ennen julkaisua (docs/TESTAUS.md, Makron päivitys); VBA-koodia ei voi kääntää tässä ympäristössä.
- CHP-investointia ei lasketa, kun päälämpö on Toimitettu lämpö (CHP ei silloin tuota). CHP-osuuden on oltava 0–1 (K14). Biogeenisen CO2:n muistiorivi sisältää CHP:n lisäpolttoaineen kuten toimitusketjurivi.
- Tuotantosuunnan virheilmoitus mainitsee myös Oma data -valinnan.

**Muutettua**
- Ohjauspaneelin solut riviltä 16 alkaen siirtyivät yhden rivin alas (esim. NPV E53 → E54, kassasäästö E50 → E51, hinnoitteluperuste K21 → K22, akun kalenteri-ikä K49 → K50). Ohjeet päivitetty.
- Pörssihinnat-välilehden sarake C on kaava; hinnat liitetään Hintahistoria-välilehdelle.
- Excelin regressiotesti päivitetty uusiin soluihin, ja siihen on lisätty kolme CHP-tapausta ja CHP-osuuden virhetapaus. Python-sääntömalliin (sim.py, talous.py) lisätty CHP. Kaavatulkitsin tukee jaettuja kaavoja ja Excelin tyhjän merkkijonon #ARVO!-käytöstä.

**Julkaisuversion tietosuoja**
- Hintahistorian hintasarjat poistettu (käyttöehdot), samoin kommentit, Excel-lisäosien sidokset, luottamuksellisuusmerkinnät ja ylä-/alatunnisteet, henkilökohtainen tallennuspolku ja muokkaajan nimi. Optimoinnin hakuloki tyhjennetty.
- Esimerkkioletukset palautettu 0.9.1:n mukaisiksi (Lihasikala, PV 200 kWp, akku 60 kWh, kattila 300 kW, hake 16 €/MWh, korko 8 %, kiinteä hinta, reservi pois). Oletusesimerkin tulokset ovat samat kuin 0.9.1:ssä.

**Säilyvät rajat**
- CHP:n arvot ovat omia oletuksia. Sähköhyötysuhdetta, minimikuormaa ja käynnistyksiä ei mallinneta.
- Optimointi ei takaa globaalia optimia. Microsoft Excelin avaamista ja makron ajoa ei ole testattu tässä ympäristössä.

## 0.9.1 tekijäjärjestys viitteissä (2026-10-22)

- Päivitetty tekijä- ja viittaustietojen järjestykseksi Suvi Karirinne, Miiro Jääskeläinen README-tiedostoissa, esittelyoppaassa ja niiden Word-versioissa.
- CITATION.cff-tiedostossa Suvi Karirinne on ensimmäinen kirjoittaja ja Miiro Jääskeläinen toinen.

## 0.9.1 tekoälysuosituksen rajaus (2026-10-22)

- Poistettu Geminiä tukevaa Excel-lisäosaa käsittelevä kappale erillisestä README-käyttöohjeesta ja sen Word-versiosta sekä vastaava suositus projektin etusivulta.
- Poistettu kappaleen tarpeettomiksi jääneet lähteet 17–18. Copilot-, ChatGPT- ja Claude-ohjeet säilytetty.

## 0.9.1 tekoälyn käytön kuvaus ja Excel-avustajat (2026-10-22)

- Lisätty README- ja Excel-käyttöohjeeseen maininta tekoälyn hyödyntämisestä laskurin kehittämisessä.
- Excel-käyttöohjeeseen lisätty Copilot-, ChatGPT for Excel-, Claude for Excel- ja Geminiä tukevan kolmannen osapuolen lisäosan käyttösuositukset, lähteet ja tilakohtaiset esimerkkikehotteet.
- Täsmennetty Googlen oman Sheets-integraation ja Excel-lisäosien ero sekä lisäosien saatavuuden ja mallikohtaisen toimivuuden rajat.
- Päivitetty erillisen Excel-käyttöohjeen Word-versio. Työkirjan laskentaa ei muutettu.

## 0.9.1 hinnat ja talous käsitekarttoina (2026-10-22)

- Lisätty Hinnat ja ohjaus- sekä Talous ja muut oletukset -käsitekartat PNG- ja SVG-muodoissa.
- Kartat kuvaavat nykyversion hinnat, ohjausvalinnat, kassavirran, uusimiset ja oletusten vaikutuksen. Energiamyynnin sisältyminen energiasäästöön ja päästöarvioiden erillinen raportointi on merkitty näkyviin.
- Laskentaan tai työkirjaan ei tehty muutoksia.

## 0.9.1 Word-ohjeet ja osakokonaisuuksien käsitekartat (2026-10-22)

- Lisätty erillisen Excel-käyttöohjeen ja esittely-, käyttö- ja kehitysoppaan DOCX-versiot. Taulukot, linkit ja lähteet säilytetty; sivut tarkistettu LibreOffice-renderöinnistä.
- Lisätty omat Tilan energiantarve- sekä Sää ja tuotanto -käsitekartat PNG- ja SVG-muodoissa ja linkitetty ne konseptikuvan ohjeeseen.
- Laskentaan ja työkirjaan ei tehty muutoksia.

## 0.9.1 erillinen Excel-käyttöohje (2026-10-22)

- Lisätty laskuri/README_EXCEL.md: itsenäinen Excel-mallin käyttöohje ilman julkaisualustaviittauksia tai ohjelmointiohjeita.
- Ohje kattaa käyttöönoton, välilehdet, soluviitteet, kulutus- ja hintadatan kohdistamisen, tulosten tulkinnan ja tavallisten virheiden selvittämisen.
- Lisätty 13 lähteen käyttötarkoituksen ja rajaukset selittävä lähdeluettelo. Omat oletukset ja puuttuvat alkuperätiedot erotettu ulkoisista lähteistä.
- Excel-tiedostoon tai laskentaan ei tehty muutoksia.

## 0.9.1 konseptikuva (2026-10-22)

- Lisätty mallin käsitteellinen kokonaiskuva SVG- ja PNG-muodoissa: lähtötiedot, sähkön ja lämmön kytkentä, varastointi, reservi sekä energia-, talous- ja päästötulokset.
- Lisätty docs/KONSEPTIKUVA.md ja linkki README-tiedostoon. Kuva perustuu nykyversion menetelmäkuvaukseen; laskentaan ei tehty muutoksia.

## 0.9.1 esittely- ja kehitysopas (2026-10-21)

- Lisätty docs/OPAS.md: laskurin tarkoitus, käyttöönotto, datan aikakanta ja yksiköt, vaihtoehtojen vertailu, tulosten tulkinta sekä nykyversion rajat.
- Kuvattu nykyinen CC BY 4.0 / MIT -lisenssijako, lähteen mainitseminen ja ulkoisten aineistojen erilliset ehdot.
- Lisätty priorisoitu jatkokehitysehdotus, hyväksymisperusteet, kehittäjän työnkulku, testikomennot ja julkaisuohje.
- Linkitetty opas README- ja käyttöohjetiedostoista sekä täydennetty CONTRIBUTING.md. Täsmennetty englanninkielinen esittely: käyttäjä valitsee laitekoot, CHP-prosessia ei mallinneta ja päästöarviot ovat erillisiä.
- Laskentakaavoihin, oletusarvoihin tai Excel-tiedostoon ei tehty muutoksia.

## 0.9.1 latauslinkit (2026-10-21)

- Lisätty viisi suoraa FI-pörssihintojen latauslinkkiä Pörssihinnat-välilehdelle, README-tiedostoon ja käyttöohjeeseen: Sähkötin 2023–2025, Elering 2025 ja Energy-Charts 2025.
- Lisätty docs/PORSSIHINNAT.md: CSV/JSON-muunnos, EET-aikarajaus, varttihintojen käsittely, karkauspäivä ja lähdekohtaiset käyttöehdot.
- Muunnosskripti lukee myös Eleringin puolipiste-/desimaalipilkku-CSV:n ja Energy-Chartsin JSONin. Korjattu vanhan latausohjeen UTC-rajaus vastaamaan kiinteää EET-vuotta.

## 0.9.1 rakennekorjaus (2026-10-21)

- Korjattu Excelin vioittumisilmoituksen aiheuttava tyylitiedoston elementtijärjestys: dxfs ennen colors-elementtiä.
- Työkirja avattu, laskettu uudelleen ja tallennettu LibreOffice Calcissa (LibreOfficeDev 26.8.0.0.alpha0).
- Kaikki 334 532 kaavaa säilyivät. Uudelleenlaskennan jälkeen ei soluvirheitä.
- 21 tuntisarakkeen 8 760 tunnin tulokset verrattu aiempiin: suurin ero 4,98 × 10^-14. Nettonykyarvo täsmäsi alle 0,000001 euron poikkeamalla.
- Microsoft Excelin omaa avaamista ei ole voitu testata tässä ympäristössä.


## 0.9.1 (2026-10-21): laskentakorjaukset ja lähteet

**Korjattua**
- Reservi ensin ei enää saa tuottoa tyhjästä akusta. Varaustason lataus, odotettu aktivointienergia, häviöt ja aktivointienergian myynti sisältyvät taseeseen.
- Rinnakkaisen reservin energiakate vähennetään omakäyttöpurun jälkeen. Tämän tunnin latausta ei lueta alkutunnin katteeksi. Energianhallinnan lataustehoreservi huomioidaan.
- Lähtötilanteella ja hybridillä sama päälämmön tehoraja. Toimittamaton lämpö raportoidaan ja vajaus estää kannattavuusvertailun.
- Pörssilataus vaatii pörssihinnoittelun. Tasahintojen järjestys on ajallinen; latausehto huomioi hyötysuhteen ja kulumisarvion. Puuttuvat hinnat estävät taloustuloksen.
- Akun käyttöikä huomioi kalenteri- ja syklirajan. Kaikki uusimiset ja uusitun akun jäännösarvo huomioidaan NPV:ssä. Invertterivaihtoa ei vähennetä alle 12 vuoden tarkastelussa.
- Vuotuinen kassasäästö ja yksinkertainen takaisinmaksu sisältävät ylläpidon. Kulumisproksia ei lisätä kassakuluksi uusimisten päälle.
- Toimitetun lämmön hintaa ei tarvitse jakaa kattilan hyötysuhteella: uusi hinnan peruste -valinta.
- Python-optimoinnissa PV-leikkaus rajattu tuotantoon. Binääriset lataus/purku- ja osto/myyntisuunnat estävät keinotekoiset negatiivisten hintojen kierrot. Tehomaksulla yksi huippumuuttuja per kuukausi horisontilla.

**Lisättyä ja muutettua**
- Varaajan seisontahäviö ja purkuteho, sähkökattilan valinnainen verkkolataus ja LP:n taloudellinen/etusijaohjaus.
- Muokattavat COP-parametrit, pakkasraja ja lämpötehon kerroin, näkyvästi oletuksina.
- Vuosikassavirta-välilehti: kassavirrat, uusimisaikataulu, laitekohtaiset hyväksyttävät kustannukset ja tukiosuudet.
- Käyttövaiheen päästöt, valmistusarvio ja vain sähkön vaikutusskenaario erilleen. Eri rajauksia ei summata elinkaaritulokseksi.
- Motivan lähdepisteet ja oma vuosittainen interpolointi näkyviin. Vuoden 2045 arvo korjattu 39:stä 35:een. 2026–2045 keskiarvo 116,642857 g/kWh.
- docs/LAHTEET.md: tarkat viitteet, tarkistuspäivä, oletukset ja puuttuva alkuperätieto. Tukiehtojen blogi korvattu Ruokavirastolla. Forbes ei enää varmennus akkupäästökertoimelle.
- Poistettu toistamaton väite sääntöohjauksen 55 % hyödystä. Optimoinnin ennakkotieto- ja horisonttirajat dokumentoitu.
- Lisäinvestointivertailu ja regressiotestit. Tulokset ja validoinnin rajat: docs/TESTAUS.md.

**Säilyvät rajat**
- Sää/PV:n lähdevuosi, alkuperäinen lähde ja profiiligeneraattori puuttuvat toimitetusta paketista. CSV-aineistot säilytetty muuttumattomina.
- COP, laitevalmistus, kalenteri-ikä ja reserviaktivointi sisältävät käyttäjän oletuksia. Ei täydellistä elinkaarivertailua tai reservin hyväksyntää.
- Vuosienergia toistaa yhden tuntivuoden. Ei PV:n asteittaista ikääntymistä, sää-/hintaennustetta eikä vero-/rahoitusmallia.

## 0.9.0 (2026-10-16): ensimmäinen julkinen versio

Julkaistaan palautteen keräämiseksi.

**Uutta alkuperäiseen laskuriin (220926) verrattuna**
- Pörssihinta: käyttäjä liittää tuntihinnat välilehdelle *Pörssihinnat*; puuttuvat tunnit lasketaan kiinteällä hinnalla
- Akun pörssiohjaus (verkkolataus halvimpina ja purku kalleimpina tunteina), PV-myynnin katkaisu negatiivisella hinnalla, tehomaksu
- Oman tuntidatan syöttö ja esimerkkiprofiilin skaalaus vuosikulutukseen, datan tarkistukset
- Reservimarkkinatuotto (FCR-D ylös) vuosien 2021–2026 hinnoilla
- Hiilijalanjälki kolmella menetelmällä, biogeeninen CO₂ muistioeränä
- NPV sisältää ylläpidon sekä invertterin ja akun uusimisen

**Korjattua**
- NPV-rivin teksti näyttää laskennassa käytetyn koron
- Hakkeen kulutus -rivin otsikko, hakkeen energiatiheys parametriksi
- PV-omakäyttöaste ei sisällä katkaistua tuotantoa

**Esimerkkidata**
- Synteettiset esimerkkiprofiilit lihasikalalle ja broilerille; broilerin lämpö riippuu nyt ulkolämpötilasta ja lintujen iästä
