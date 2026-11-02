# Maatilan hybridienergialaskuri 0.10.0

Excel-laskuri, jolla sika- tai siipikarjatila voi arvioida, kannattaako olemassa olevan hake- tai biokaasulämmityksen rinnalle hankkia aurinkosähköä, sähköakkua, lämpöpumppua, sähkökattilaa, lämpövaraajaa tai CHP-sähköntuotantoa.

Laskuri simuloi tilan sähkön ja lämmön tunti tunnilta koko vuoden (8 760 tuntia) ja laskee:

- energiataseen: verkko-ostot, aurinkosähkön omakäytön ja myynnin, akun käytön ja lämmöntuotannon
- energiakustannukset ja vuotuisen säästön kiinteällä tai pörssihinnalla, tehomaksu mukaan lukien
- investoinnin, tuen, takaisinmaksuajan ja nettonykyarvon (NPV) sekä ylläpidon ja laitteiden uusimisen
- akun lisätuoton Fingridin FCR-D ylös- ja alas-reservimarkkinalta aggregaattorin palkkioiden jälkeen, kyllästyneen markkinan ja historiallisten vuosien skenaarioilla
- käyttövaiheen päästöt, erillisen valmistuspäästöarvion ja sähköjärjestelmän vaikutusskenaarion
- makroversiossa parhaan laitekokoonpanon annetuista vaihtoehdoista (NPV, takaisinmaksu tai vuotuinen säästö)

Laskuri on tehty **EIP CHP Energiaälykäs eteläpohjalainen maatila** -hankkeessa Seinäjoen ammattikorkeakoulun (SEAMK) Maatalous ja energia -tutkimusryhmässä. Se on suuntaa-antava suunnittelutyökalu, ei investointi-, rahoitus- tai verosuositus.

**Laskurin kehittämisessä on hyödynnetty tekoälyä** laskentakaavojen ja koodin tarkastelussa, dokumentoinnissa sekä vaihtoehtojen luonnostelussa. Tekoälyä voi käyttää myös oman tilan lähtötietojen jäsentämiseen ja syötön valmisteluun. Suosittelemme kokeilemaan Microsoft Copilotia Excelissä, OpenAI:n ChatGPT for Excel -lisäosaa tai Anthropicin Claude for Excel -lisäosaa. Asennuslähteet, käyttörajojen täsmennykset ja valmiit esimerkkikehotteet ovat [Excel-käyttöohjeen tekoälyosiossa](laskuri/README_EXCEL.md#13-tekoäly-laskurin-kehittämisessä-ja-käytössä). Saatavuus riippuu palvelusta, tilauksesta ja organisaation asetuksista.

**[Lue esittely, käyttö- ja kehitysopas](docs/OPAS.md).** Opas kertoo, mitä laskuri laskee, miten oman tilan tiedot syötetään, miten vaihtoehtoja vertaillaan ja miten laskuria voi kehittää avoimilla lisensseillä. Käyttäjä valitsee laitteiden koot tai antaa makroversion etsiä parhaan kokoonpanon antamistaan vaihtoehdoista. CHP on yksinkertaistettu sähköosuusmalli; laitoksen prosessia tai biokaasuprosessia ei mallinneta.

## Uutta versiossa 0.10.0

Laskuri on nyt kahtena tasavertaisena toteutuksena: **selainversio** ja **Excel-työkirja** laskevat samat tulokset. Selainversion testi vertaa lähes 3 000 arvoa (energiatase, talous, kuukausikoonti, vuosikassavirta ja päästöt) työkirjaan kuudessa tapauksessa.

- **Selainversio kokonaisena:** kaikki työkirjan parametrit ja tulokset, myös kuukausikoonti, vuosikassavirta, uusimiset, koko päästöosio, reservin skenaariot, optimointi sekä menetelmä ja lähteet.
- **Rakennushaku-tuonti:** Rakennushaun `oma_kulutusdata_<vuosi>.csv` (sähkö, lämpö, ulkolämpötila, pörssihinta) ja `hintahistoria_2023-2026.csv` luetaan suoraan selaimeen; Excelissä ne liitetään Oma kulutusdata- ja Hintahistoria-välilehdille.
- **Oma ulkolämpötila** ohjaa lämpöpumpun COP:ta ja pakkasrajaa molemmissa versioissa (Excel: Oma kulutusdata, sarake G).
- **Monivuotiset pörssihinnat** selaimessa kuten Excelin Hintahistoria: vuosi tai keskiarvo, puuttuvat tunnit keskiarvolla.
- **Tallennus ja jakaminen:** lähtötiedot JSON-tiedostoon ja jakolinkkiin, tulokset ja tuntitase CSV:nä, vaihtoehtojen vertailu rinnakkain.
- **GitHub Pages:** selainversio julkaistaan repositoriosta automaattisesti.

## Uutta versiossa 0.9.3

- **Reservimarkkina:** akku tarjoaa purkutehon FCR-D ylös- ja lataustehon FCR-D alas -reserviin. Oletusskenaario on *Viimeiset 12 kk* (toteutuneet tuntihinnat 24.9.2025–24.9.2026); lisäksi *Kyllästynyt markkina* (Fingridin vuosimarkkina 2026, −10 %/v) ja vuodet 2021–2026. Aggregaattorin osuuden oletus on 50 %, ja mukana on kiinteä vähimmäispalkkio. Välilehdellä perustellaan, miksi FCR-N, aFRR, mFRR ja FFR eivät ole laskennassa.
- FCR-D alas -tuntihinnat (Fingrid avoin data 283, 21.4.2021–30.10.2026) ovat mukana: `data/fingrid_fcr_d_alas_tuntihinnat.csv`. Päivitys: `scripts/muunna_fingrid_reservi.py`.
- **Selainversio** `web/index.html` samalla laskennalla.
- Reservi on oletuksena pois, joten oletusesimerkin tulokset eivät muutu.

## Uutta versiossa 0.9.2

- **CHP-sähkö** päälämmityskattilan yhteydessä (Ohjauspaneelin rivi 15, oletuksena pois).
- **Kokoonpanon optimointi** -välilehti ja -painike (.xlsm): haku käy läpi antamasi laitekoot ja asettaa parhaan kokoonpanon.
- **Hintahistoria**: vuosien 2023–2026 tuntihinnat rinnakkain ja niiden keskiarvo. Vuosi valitaan solusta K49.
- Korjattu: ilman pörssihintoja työkirja näytti täydessä uudelleenlaskennassa #ARVO!-virheen kaikissa tuloksissa (koski myös versiota 0.9.1).
- Ohjauspaneelin solut riviltä 16 alkaen ovat siirtyneet yhden rivin alas (esim. NPV on nyt E54).

Oletusesimerkin tulokset ovat samat kuin 0.9.1:ssä. Versio 0.9.1 korjasi reservin energiakatteen, lämpövajevertailun, akun uusimiset ja pörssiohjauksen. [Muutosloki](CHANGELOG.md), [menetelmä](docs/MENETELMA.md), [lähteet ja oletukset](docs/LAHTEET.md) sekä [testaus](docs/TESTAUS.md).

Valmistuspäästöjä ei yhdistetä käytönaikaisiin sähköpäästöihin yhdeksi elinkaariluvuksi. Sää- ja PV-profiilien alkuperäistä lähdeketjua ei ole toimitettu. Laskuriin ei ole lisätty keksittyjä lähteitä.

## Aloita näin

Mallin osakokonaisuudet ja niiden yhteydet: [konseptikuva](docs/KONSEPTIKUVA.md).

1. **Lataa laskuri** (avaa linkki ja paina *Download raw file*):
   - [Maatilan_hybridienergialaskuri.xlsx](laskuri/Maatilan_hybridienergialaskuri.xlsx): kaikki laskenta ilman makroja. Suositus useimmille.
   - [Maatilan_hybridienergialaskuri.xlsm](laskuri/Maatilan_hybridienergialaskuri.xlsm): lisäksi kokoonpanon optimointi. Windows estää ladatun tiedoston makrot: napsauta tiedostoa hiiren oikealla → *Ominaisuudet* → *Poista esto* → *OK*, avaa ja valitse *Ota sisältö käyttöön*. Makron lähdekoodi: [laskuri/Optimointi.bas](laskuri/Optimointi.bas).
2. Avaa tiedosto Excelissä tai LibreOfficessa. Laskenta kestää avattaessa muutaman sekunnin.
3. Täytä Ohjauspaneelin **keltaiset solut**: tuotantosuunta, laitteiden koot ja hinnat.
4. Lue tulokset Ohjauspaneelin osista 3–6.

Tarkempi ohje: [docs/KAYTTOOHJE.md](docs/KAYTTOOHJE.md).

Excel-tiedoston mukana erikseen jaettava käyttöohje ja lähdeluettelo: [laskuri/README_EXCEL.md](laskuri/README_EXCEL.md).

### Oman tilan tiedot

Laskurissa on valmiina **synteettiset esimerkkiprofiilit** lihasikalalle (noin 3 000 paikkaa) ja broilerikasvattamolle. Ne eivät ole minkään tilan mittauksia. Saat oman tilasi tulokset kahdella tavalla:

- **Tuntidata:** valitse tuotantosuunnaksi *Oma data* ja liitä tilasi tunnittainen sähkönkulutus ja lämmöntarve välilehdelle *Oma kulutusdata*. Sähkön tuntidatan saat verkkoyhtiösi palvelusta tai Fingridin Datahubista (oma.datahub.fi).
- **Vain vuosikulutus:** valitse lähin esimerkkiprofiili ja syötä tilasi vuosikulutukset Ohjauspaneelin soluihin K7 (sähkö) ja L7 (lämpö).

### Pörssihinnat

| Suora lataus | Muoto ja muunnos |
|---|---|
| [Sähkötin 2023 – CSV](https://sahkotin.fi/prices.csv?start=2022-12-31T22:00:00.000Z&end=2023-12-31T21:59:59.999Z) | 2023, CSV → tuntisarja |
| [Sähkötin 2024 – CSV](https://sahkotin.fi/prices.csv?start=2023-12-31T22:00:00.000Z&end=2024-12-31T21:59:59.999Z) | 2024, CSV → tuntisarja; poista 29.2. muunnoksessa |
| [Sähkötin 2025 – CSV](https://sahkotin.fi/prices.csv?start=2024-12-31T22:00:00.000Z&end=2025-12-31T21:59:59.999Z) | 2025, CSV → tuntisarja |
| [Elering 2025 – CSV (FI)](https://dashboard.elering.ee/api/nps/price/csv?fields=fi&start=2024-12-31T22:00:00Z&end=2025-12-31T21:59:59Z) | 2025, CSV; UTC-aikaleima ja desimaalipilkku |
| [Energy-Charts 2025 – JSON (FI)](https://api.energy-charts.info/price?bzn=FI&start=2024-12-31T22:00Z&end=2025-12-31T21:59Z) | 2025, JSON; unix_seconds ja price |
| [Sähkötin 2026 – CSV](https://sahkotin.fi/prices.csv?start=2025-12-31T22:00:00.000Z&end=2026-12-31T21:59:59.999Z) | 2026, vuosi kesken; puuttuvat tunnit täytetään keskiarvolla |

[Muunnosohjeet ja lähteiden käyttöehdot](docs/PORSSIHINNAT.md). Lataa aineisto ja muunna se skriptillä ennen liittämistä.

Pörssihintoja ei jaeta laskurin mukana, koska niiden käyttöehdot määrää hinnan tarjoaja. Liitä tuntihinnat välilehdelle *Hintahistoria* vuoden sarakkeeseen (C = 2023 … F = 2026) ja valitse vuosi Ohjauspaneelin solusta K49. Skripti [scripts/hae_porssihinnat.py](scripts/hae_porssihinnat.py) hakee ja muuntaa ne valmiiksi. Ilman pörssihintoja valitse kiinteä sähkön hinta. Pörssitilassa puuttuva hintadata estää kannattavuustuloksen.

## Selainversio

**Avaa laskuri selaimessa:** https://seamkedu.github.io/maatilan-hybridienergialaskuri/ (GitHub Pages; toimii myös avaamalla [web/index.html](web/index.html) omalta koneelta).

Selainversiossa on sama laskenta ja samat tulokset kuin Excel-työkirjassa. Laskenta tehdään selaimessa, eivätkä ladatut tiedostot lähde koneelta. Lähtötiedot voi tallentaa JSON-tiedostoon tai jakaa linkkinä, ja tulokset saa CSV-tiedostoina.

Kehittäjälle: laskentamalli on [web/malli.js](web/malli.js), käyttöliittymä [web/sovellus.js](web/sovellus.js) ja sivupohja [web/sovellus.html](web/sovellus.html). `python scripts/rakenna_web.py` kokoaa niistä ja `data/`-kansiosta `web/index.html`:n. `node web/testi.js` vertaa tuloksia työkirjaan (vertailuarvot `web/vertailu_excel.json`, päivitys `python malli/vie_vertailu.py laskuri/Maatilan_hybridienergialaskuri.xlsm`).

## Palaute ja parannusehdotukset

Palaute on tervetullutta, erityisesti viljelijöiltä ja neuvojilta.

Avaa [uusi Issue](../../issues/new/choose) ja valitse lomake: *Virhe laskurissa*, *Parannusehdotus* tai *Käyttökokemus*. Palautteen antamiseen tarvitaan ilmainen GitHub-tunnus (github.com → *Sign up*).

Katso myös [CONTRIBUTING.md](CONTRIBUTING.md).

## Sisältö

| Kansio | Sisältö |
|---|---|
| `laskuri/` | Excel-laskuri (.xlsx ilman makroja, .xlsm optimoinnilla), makron lähdekoodi ja Excel-ohje |
| `docs/` | Esittely-, käyttö- ja kehitysopas, menetelmä, lähteet ja testaus |
| `data/` | Esimerkkiprofiilit ja Fingridin avoin data (CSV) |
| `web/` | Selainversio (index.html), laskentamalli (malli.js) ja vertailutesti |
| `scripts/` | Pörssihintojen haku- ja muunnosskripti, työkirjan rakennetarkistus ja .xlsx-muunnos |
| `malli/` | Python-malli: laskurin yhtälöt ja optimoitu akun ohjaus (MILP-optimointivertailu) |

## Lisenssi ja lähteen mainitseminen

- Laskuri, dokumentaatio ja esimerkkidata: [CC BY 4.0](LICENSE). Saat käyttää, muokata ja jakaa vapaasti, kun mainitset lähteen.
- Python-koodi (`malli/`, `scripts/`), selainversion koodi (`web/`) ja makro (`laskuri/Optimointi.bas`): [MIT](LICENSE-CODE).
- Fingridin data (`data/fingrid_*`): Fingrid Oyj, avoin data, CC BY 4.0.

CC BY 4.0 -aineistoa jaettaessa mainitse tekijät ja lähde, linkitä lisenssi ja ilmoita muutoksista. MIT-koodin mukana säilytetään tekijänoikeus- ja lisenssiteksti. Ulkoisen hintadatan ja muun käyttäjän hankkiman aineiston käyttöehdot tarkistetaan erikseen. Tarkempi [uudelleenkäyttöohje](docs/OPAS.md#avoin-lisenssi-ja-uudelleenkäyttö).

Viittausohje: [CITATION.cff](CITATION.cff) tai GitHubin *Cite this repository* -painike.

## Tekijät

Suvi Karirinne ja Miiro Jääskeläinen, Seinäjoen ammattikorkeakoulu (SEAMK), Maatalous ja energia -tutkimusryhmä.

## Rahoitus

EIP CHP Energiaälykäs eteläpohjalainen maatila -hanke, Euroopan unionin osarahoittama. Hankkeessa ovat mukana Seinäjoen ammattikorkeakoulu, Suomen metsäkeskus ja Veljekset Ala-Talkkari Oy.

---

## In English

An Excel calculator for Finnish pig and poultry farms that already heat with wood chips or biogas. It compares PV, battery, heat pump, electric boiler, hot-water storage and simplified CHP electricity configurations using an hourly energy balance for a full year. It reports savings, NPV, scenarios for battery revenue from the Fingrid FCR-D up and down reserve markets after aggregator fees (default: saturated-market scenario at 2026 yearly-market prices), and separate emissions estimates. The macro-enabled workbook can search user-given equipment sizes for the best NPV, payback or annual saving (coordinate search, not a global optimum). CHP is modelled as an electricity share of boiler heat output, not as a plant process model. The interface and the [user and development guide](docs/OPAS.md) are in Finnish. Example load profiles are synthetic; users paste their own hourly consumption and spot prices. Licences: CC BY 4.0 (calculator, documentation and example profiles), MIT (code). Fingrid data retains its own attribution; external spot-price data has separate terms. Feedback goes through GitHub Issues.
