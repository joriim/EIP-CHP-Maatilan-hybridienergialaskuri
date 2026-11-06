# Käyttöohje

Laskurin tarkoitus, tulosten tulkinta, avoimet lisenssit ja jatkokehitys: [esittely-, käyttö- ja kehitysopas](OPAS.md).

Tämä ohje käy laskurin läpi vaihe vaiheelta. Laskuri on kahtena tasavertaisena versiona: selaimessa (https://joriim.github.io/EIP-CHP-Maatilan-hybridienergialaskuri/ tai web/index.html) ja Excelissä (suositus Microsoft 365 / Excel 2019 tai uudempi, myös LibreOffice Calc). Versiot laskevat samat tulokset. Työkirja 0.10.0 on avattu ja uudelleenlaskettu LibreOffice Calcissa. Microsoft Excelin omaa avaamista ei ole testattu tässä ympäristössä; varmista uudelleenlaskenta avatessasi tiedoston. MAXIFS ei ole kaikissa Excel 2016 -asennuksissa saatavilla.

## Kaksi tiedostoa

| Tiedosto | Käyttö |
|---|---|
| `Maatilan_hybridienergialaskuri.xlsx` | Kaikki laskenta ilman makroja. Aloita tästä. |
| `Maatilan_hybridienergialaskuri.xlsm` | Sama laskuri ja lisäksi kokoonpanon optimointi -painike (makro). |

Internetistä ladatun .xlsm-tiedoston makrot ovat oletuksena estetty. Jos luotat lähteeseen: sulje tiedosto, napsauta sitä hiiren oikealla → **Ominaisuudet** → rastita **Poista esto** (Unblock) → **OK**. Avaa tiedosto ja valitse **Ota sisältö käyttöön**. LibreOfficessa Excelin painikemakro ei välttämättä toimi; käytä .xlsx-tiedostoa.

## Välilehdet

| Välilehti | Käyttö |
|---|---|
| **Ohjauspaneeli ja Tulokset** | Kaikki asetukset ja tulokset. Aloita tästä. |
| **Oma kulutusdata** | Tilan oma tunnittainen sähkönkulutus ja lämmöntarve |
| **Reservimarkkina** | Akun tuotto Fingridin FCR-D ylös- ja alas-markkinalta, skenaariot ja reservituotteiden vertailu |
| **Optimointi** | Kokoonpanon haku: ehdokasarvot, paras kokoonpano ja hakuloki (.xlsm) |
| **Pörssihinnat** | Laskennassa käytetty tuntihintasarja (kaava, ei muokata) |
| **Hintahistoria** | Vuosien 2023–2026 tuntihinnat (käyttäjä liittää) ja tuntikohtainen keskiarvo |
| **Kuukausikoonti** | Energiatase ja kustannukset kuukausittain |
| **Vuosikassavirta** | Vuosittaiset kassavirrat, laitteiden uusimiset ja tukioletukset |
| **Tuntitase_8760h** | Laskenta tunti tunnilta, ei tarvitse muokata |
| **Menetelmä ja lähteet** | Yhtälöt, oletusarvot ja lähteet |
| **Värit ja ilme** | Laskurin värikoodi |

Muokattavat solut ovat **keltaisia**. Harmaat ja vaalealila solut ovat laskettuja; älä kirjoita niiden päälle.

## 1. Tila ja lämmitys

- **D4 Tuotantosuunta:** *Lihasikala*, *Broilerikasvattamo* tai *Oma data*.
- **D5 Päälämmitys:** *Hakekattila* tai *Biokaasu (lannanvaihto)*.

## 2. Kulutustiedot

Paras tulos syntyy tilan omasta tuntidatasta.

**Tuntidata**
1. Hae sähkönkulutuksen tuntisarja vuoden ajalta verkkoyhtiösi palvelusta tai Datahubista (oma.datahub.fi).
2. Jos sinulla on lämmön kulutusseuranta, laske siitä tuntisarja. Jos mittaat kattilan polttoainetta, kerro se kattilan hyötysuhteella (esim. 0,85).
3. Liitä arvot välilehdelle *Oma kulutusdata*: sähkö sarakkeeseen E ja lämpö sarakkeeseen F, alkaen riviltä 2 (1.1. klo 0–1). Käytä *Liitä määräten → Arvot*.
4. Valitse D4 = *Oma data*.
5. Tarkista välilehden tarkistustaulukko: täytettyjä tunteja pitää olla 8 760 ja tilan pitää olla *OK*.

**Vain vuosikulutus**
1. Pidä D4:ssä lähin esimerkkiprofiili.
2. Syötä vuosikulutus soluihin **K7** (sähkö, kWh/v) ja **L7** (lämpö, kWh/v). Profiilin muoto säilyy, taso skaalautuu.

Lohko **1B** näyttää käytetyt vuosikulutukset ja huipputehot. Se varoittaa, jos lämmön huipputeho on suurempi kuin päälämmityskattilan teho (D14).

## 3. Laitteet

Taulukossa rivit 9–15: kytke laite päälle (1) tai pois (0), syötä koko ja yksikköhinta. Yksikköhinnat ovat esimerkkejä; korvaa ne tarjousten hinnoilla. Investointituen osuus on solussa D17.

**CHP (rivi 15, oletuksena pois).** Päälämmityskattilan yhteyteen voi lisätä sähköntuotannon. D15 on sähkön osuus päälämmön tuotosta (0,15 = 15 %), ja sähköteho on D15 × kattilan teho D14. Investointi = sähköteho × F15 (€/kWe). CHP-sähkö käytetään ensin tilan omaan kulutukseen, ylijäämä myydään. Lisäpolttoaine on CHP-sähkö / kattilan hyötysuhde C26. Ylläpito K65 (€/MWh sähköä), käyttöikä K66 ja uusimiskustannus K67. CHP ei toimi, jos K62 = *Toimitettu lämpö*. Kaikki CHP-arvot ovat omia oletuksia; korvaa ne laitetoimittajan tiedoilla (sähköhyötysuhde, minimikuorma, huolto).

## 4. Hinnat ja korko

- **C22–C23:** kiinteä ostohinta (sisältää energian, siirron ja veron) ja myyntihinta, c/kWh
- **C24–C26:** hakkeen tai biokaasulämmön hinta ja kattilan hyötysuhde
- **C27–C28:** laskentakorko ja pitoaika

**Pörssihinta (valinnainen):**
1. Hae vuoden tuntihinnat (ks. alla) ja liitä ne välilehdelle *Hintahistoria* vuoden sarakkeeseen (C = 2023, D = 2024, E = 2025, F = 2026) riviltä 2 alkaen, €/MWh ilman arvonlisäveroa.
2. Valitse **K22** = *Pörssihinta* ja **K49** = tarkasteltava vuosi tai *Keskiarvo*. Valitun vuoden puuttuvat tunnit korvataan syötettyjen vuosien tuntikeskiarvolla; M49 kertoo puuttuvien tuntien määrän.
3. Syötä **K23**: siirtomaksu, sähkövero ja myyjän marginaali yhteensä, c/kWh. Arvon löydät sähkölaskusta.
4. Tehomaksu (€/kW/kk) syötetään soluun **K30**, jos verkkoyhtiösi perii sellaisen.

| Suora lataus | Muoto ja muunnos |
|---|---|
| [Sähkötin 2023 – CSV](https://sahkotin.fi/prices.csv?start=2022-12-31T22:00:00.000Z&end=2023-12-31T21:59:59.999Z) | 2023, CSV → tuntisarja |
| [Sähkötin 2024 – CSV](https://sahkotin.fi/prices.csv?start=2023-12-31T22:00:00.000Z&end=2024-12-31T21:59:59.999Z) | 2024, CSV → tuntisarja; poista 29.2. muunnoksessa |
| [Sähkötin 2025 – CSV](https://sahkotin.fi/prices.csv?start=2024-12-31T22:00:00.000Z&end=2025-12-31T21:59:59.999Z) | 2025, CSV → tuntisarja |
| [Elering 2025 – CSV (FI)](https://dashboard.elering.ee/api/nps/price/csv?fields=fi&start=2024-12-31T22:00:00Z&end=2025-12-31T21:59:59Z) | 2025, CSV; UTC-aikaleima ja desimaalipilkku |
| [Energy-Charts 2025 – JSON (FI)](https://api.energy-charts.info/price?bzn=FI&start=2024-12-31T22:00Z&end=2025-12-31T21:59Z) | 2025, JSON; unix_seconds ja price |
| [Sähkötin 2026 – CSV](https://sahkotin.fi/prices.csv?start=2025-12-31T22:00:00.000Z&end=2026-12-31T21:59:59.999Z) | 2026, vuosi kesken: puuttuvat tunnit jäävät tyhjiksi |

[Muunnoskomennot ja käyttöehdot](PORSSIHINNAT.md). `python scripts/hae_porssihinnat.py 2025` hakee Sähköttimestä suoraan. Vaihtoehtoinen lataus: `python scripts/hae_porssihinnat.py 2025 hinnat.csv` tai `hinnat.json`. Liitä tulostiedoston hintasarake, älä raakalatausta.

## 5. Akun ohjaus

- **K26** = *Vain PV-ylijäämä*: akku latautuu vain aurinkosähkön ylijäämästä.
- **K26** = *Pörssiohjattu*: akku latautuu verkosta vuorokauden halvimpina tunteina (K27) ja purkaa vain kalleimpina tunteina (K28). Toimii vain pörssihinnoilla.

Pörssiohjaus on yksinkertainen sääntö. Suhteellista hyötyä optimointiin nähden ei ole validoitu nykyiselle versiolle. Katso [MENETELMA.md](MENETELMA.md).

## 5B. Kokoonpanon optimointi (.xlsm)

Välilehti *Optimointi* etsii laitekoot annetuista ehdokasarvoista.

1. Säädä ensin kaikki muut lähtötiedot (tila, lämmitys, hinnat, korko).
2. Valitse mittari solussa **C5**: *NPV (suurin)*, *Takaisinmaksuaika (lyhin)* tai *Vuotuinen säästö (suurin)*.
3. Kirjoita ehdokasarvot soluihin **D8:D13** pilkuin eroteltuna. 0 tarkoittaa, että laite on pois. CHP-osuus desimaalina pisteellä (0.15).
4. Paina painiketta. Haku vaihtaa yhden laitteen kokoa kerrallaan, laskee laskurin uudelleen ja toistaa, kunnes tulos ei parane (enintään 4 kierrosta).
5. Paras kokoonpano asetetaan Ohjauspaneelin riveille 9–15. Rivi 18 näyttää parhaan tuloksen ja rivit 25– jokaisen lasketun kokoonpanon.

Yksi kokoonpano vaatii koko 8 760 tunnin uudelleenlaskennan. Pitkät listat voivat kestää kymmeniä minuutteja. Esc keskeyttää haun ja palauttaa alkuperäisen kokoonpanon. Koordinaattihaku ei takaa parasta mahdollista yhdistelmää; tarkista tulos kokeilemalla lähiarvoja. Laitekokojen välinen vuorovaikutus (esim. PV ja akku) voi jäädä löytämättä, jos listat ovat harvat.

## 6. Reservimarkkina

Välilehdellä *Reservimarkkina* voit arvioida akun lisätuoton Fingridin FCR-D-reservimarkkinalta. Akun purkuteho tarjotaan FCR-D ylös- ja latausteho FCR-D alas -reserviin (C36–C37). Sama teho voidaan tarjota kumpaankin suuntaan, koska ne aktivoituvat vastakkaisissa taajuustilanteissa.

- **Skenaario C8.** Oletus on *Viimeiset 12 kk*: toteutuneet FCR-D-tuntihinnat 24.9.2025–24.9.2026 (ylös keskimäärin 4,7, alas 2,9 €/MW,h). *Kyllästynyt markkina* käyttää Fingridin vuoden 2026 vuosimarkkinahintoja (ylös 3,50, alas 6,00 €/MW,h, C40–C41) ja hintojen laskua −10 %/v (C42); sen alas-hinta on tuntimarkkinan toteumaa selvästi korkeampi. Vuosien 2021–2025 historiaa ei pidä käyttää ennusteena, koska markkina on sen jälkeen täyttynyt akuista.
- **Tuntihinnat.** Ylös-suunta (Fingrid 318) ja alas-suunta (Fingrid [283](https://data.fingrid.fi/datasets/283), 21.4.2021–30.10.2026) ovat valmiina välilehdellä *Tuntitase_8760h* (AO–AT ja BJ–BO). Uudemmat hinnat: lataa Fingridin tiedosto ja muunna se komennolla `python scripts/muunna_fingrid_reservi.py ladattu.xlsx`, liitä tulos sarakkeisiin BJ–BO. Jos sarakkeet tyhjennetään, K14 näyttää *Reservihinta puuttuu*.
- **Aggregaattori.** Tilan osuus C10 (oletus 50 %) ja kiinteä vähimmäispalkkio C39 (oletus 12 €/kk). Pienellä akulla vähimmäispalkkio voi viedä koko tuoton. Kysy aggregaattorilta osuus, vähimmäispalkkio, sopimusaika ja omakäytön suojaus.
- **Muut tuotteet.** FCR-N, aFRR, mFRR ja FFR eivät ole laskennassa. Perustelut ovat välilehden taulukossa riveillä 48–55.

Tee vertailu aina myös ilman reservituloa. Toteutunut tuotto vaihtelee kuukausittain ja aggregaattoreittain.

## 7. Tulokset

| Kohta | Sisältö |
|---|---|
| Osa 3 | Energiatase: verkko-osto, aurinkosähkö, akku, lämmöntuotanto |
| Osa 4 | Kustannukset, vuotuinen säästö, takaisinmaksuaika ja NPV |
| Osa 5 | Akun syklit ja käyttöikä, ylläpito ja korvausinvestoinnit |
| Osa 6 | Hiilijalanjälki |

**NPV (E54)** sisältää ylläpidon sekä invertterin ja akun uusimisen. Rivillä E55 on yksinkertaistettu NPV ilman niitä.

## Huomioitavaa

- Sää (ulkolämpötila ja aurinkosähkön tuotto) on Etelä-Pohjanmaan referenssivuosi, ei tarkasteluvuoden sää.
- Akun ja reservimarkkinan arvo riippuu voimakkaasti hinnoista ja tehomaksusta. Tarkista oman verkkoyhtiön hinnasto.
- Maatalouden investointituen ehdot (esim. verkosta ladattava akku) tarkistetaan ELY-keskukselta.

## Selainversio

Selainversio sisältää samat syötteet ja tulokset kuin työkirja. Syötteiden kohdalla näkyy vastaava Excel-solu (vie hiiri rivin päälle).

- **Rakennushaku:** kohta 1, *Hae tila Rakennushaulla*. Hae tila kiinteistötunnuksella, osoitteella tai kartalta (Maanmittauslaitoksen ilmainen API-avain), valitse rakennukset, anna kulutus laskuilta tai mittareilta, valitse säätiedot ja hae halutessa pörssihinnat. Paina *Laske tuntiprofiili* ja sitten *Siirrä laskuriin*. Laskuri ottaa käyttöön Oma data -profiilin, ulkolämpötilan ja hinnat, ja kohdan 1 alle tulee luettelo siirretyistä tiedoista. Tarkista sen jälkeen päälämmitys (D5), polttoaineen hinta ja hinnoittelu (kohta 3). Erillinen Rakennushaku: https://joriim.github.io/EIP-CHP-Maatilan-hybridienergialaskuri/rakennushaku.html (*Avaa laskurissa*).
- **Oma kulutus ja Rakennushaun CSV:** kohta 1, tiedosto *Oma kulutusdata tai Rakennushaun vienti*. Rakennushaun `oma_kulutusdata_<vuosi>.csv` tuo sähkön, lämmön, ulkolämpötilan ja vuoden pörssihinnat kerralla. Muu CSV: 8 760 riviä, kaksi viimeistä saraketta sähkö ja lämpö kWh/h.
- **Pörssihinnat:** kohta 3. Lataa Rakennushaun `hintahistoria_2023-2026.csv`, hae_porssihinnat.py-tiedostoja tai muita yhden hintasarakkeen tiedostoja (vuosi tiedostonimestä tai valinnasta). Valitse vuosi tai *Keskiarvo*.
- **Tulokset:** välilehdet Yhteenveto, Kuukaudet, Kassavirta, Päästöt, Reservi, Optimointi, Vertailu sekä Menetelmä ja lähteet.
- **Tallennus:** *Tallenna lähtötiedot* (JSON), *Avaa lähtötiedot*, *Kopioi jakolinkki* (lähtötiedot linkissä; ladatut tiedostot eivät kulje linkissä), *Lataa tulokset* ja *Lataa tuntitase* (CSV, puolipiste ja desimaalipilkku). *Lisää vertailuun* tallentaa laskelman vertailutaulukkoon tähän selaimeen.

## Muutokset version 0.11.0 käyttöön

- Selainversio: Rakennushaku avautuu laskurista ja siirtää tiedot suoraan (ks. Selainversio).
- Excel: ei kaavamuutoksia. Rakennushaun CSV liitetään edelleen *Oma kulutusdata* -välilehden sarakkeisiin A–G ja sarake H *Hintahistoria*-välilehden vuoden sarakkeeseen (J3).

## Muutokset version 0.10.0 käyttöön

- Oma kulutusdata, sarake G: valinnainen ulkolämpötila (°C). Kun D4 = Oma data, lämpöpumpun COP ja pakkasraja käyttävät sitä; puuttuvat tunnit esimerkkivuodesta. Rakennushaun vienti liitetään sarakkeisiin A–G sellaisenaan.
- Tuntitase BR: laskennassa käytetty ulkolämpötila.

## Muutokset version 0.9.3 käyttöön

- Reservimarkkina: uudet asetukset C36–C45 (suunnat, alas-oma hinta, aggregaattorin palkkio, kyllästyneen markkinan hinnat ja vuosimuutos). Skenaariotaulukko riveillä 18–28 on uudistettu; tilan osuuden oletus on 50 %. Reservi on oletuksena edelleen pois.
- Tuntitase: uudet sarakkeet BH–BQ (alas-tarjonta, alas-aktivointi, alas-tuntihinnat ja 12 kk -sarjat).

## Muutokset version 0.9.2 käyttöön

- Rivi 15 (CHP) on uusi. Siksi kaikki Ohjauspaneelin solut riviltä 16 alkaen ovat siirtyneet yhden rivin alas 0.9.1:een verrattuna (esim. NPV E53 → E54, hinnoitteluperuste K21 → K22).
- Pörssihinnat liitetään nyt *Hintahistoria*-välilehdelle. *Pörssihinnat*-välilehden sarake C on kaava.
- Uusi *Optimointi*-välilehti (.xlsm).

## Muutokset version 0.9.1 käyttöön

- Tarkista Ohjauspaneelin K14: lämpövaje, puuttuva kulutus tai puuttuvat pörssihinnat estävät kannattavuusvertailun. K13/L13 näyttävät toimittamattoman lämmön.
- Vuotuinen kassasäästö E51 ja takaisinmaksu sisältävät ylläpidon. E54 huomioi uusimiset ja E55 on erikseen nimetty vertailu ilman ylläpitoa/uusimisia.
- K50: akun kalenteri-ikä, oletus 15 vuotta. Vuosikassavirta näyttää kaikki akun uusimiset. Tarkasteluaika 1–100 v, käyttöikä vähintään 1 v.
- K51/K52: varaajan häviö ja purkuteho. K53 sallii edullisen verkkosähkön sähkökattilalle.
- K54: Taloudellinen tai Etusija LP-ohjaus. Kalibroi COP-parametrit K55–K58, pakkasraja K59 ja käytettävissä oleva teho K60 laitetiedoilla.
- K62: Polttoaine tai Toimitettu lämpö. Sopimuslämmön hinta €/MWh lämpöä ei tarvitse kattilahyötysuhteen jakoa.
- Vuosikassavirta P3:Q8: korvaa laitekohtaiset tukikelpoiset kustannukset ja tukiosuudet viranomais-/päätöstiedoilla. 40 % on oletus.
- Reservimarkkina C16: tavoitevaraus Reservi ensin -tilassa. C33 on odotetun aktivointienergian skenaario, ei toteutunut havainto. C34 on energianhallintatehon oletus. Lataus ja energia sisältyvät kustannuksiin.
- Päästörivi 71 on erillinen valmistusarvio. Rivit 72–74 eivät ole täydellisiä elinkaarituloksia.
- Vertaa laitteen lisäinvestointia samalla mallilla: merkitse E54 ilman laitetta, kytke laite päälle ja laske erotus. Oletusesimerkki toistuu komennolla `python malli/vertaa.py`.
- Kohdista oma data, sää ja hinnat samaan kiinteään EET-aikakantaan. Varttihinnat eivät oikeuta varttitason jouston arviointiin tuntimallissa.

Lähteiden tila ja puuttuvat aineistot: [LAHTEET.md](LAHTEET.md).
