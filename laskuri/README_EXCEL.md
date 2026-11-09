# Maatilan hybridienergialaskuri – Excel-mallin käyttöohje

**Mallin versio:** 0.12.0  
**Ohje päivitetty:** 9.11.2026  
**Työkirjat:** Maatilan_hybridienergialaskuri.xlsx (ilman makroja) ja Maatilan_hybridienergialaskuri.xlsm (lisäksi kokoonpanon optimointi)  
**Tekijät:** Suvi Karirinne ja Miiro Jääskeläinen, Seinäjoen ammattikorkeakoulu (SEAMK), Maatalous ja energia -tutkimusryhmä  
**Hanke:** EIP CHP Energiaälykäs eteläpohjalainen maatila

Laskurista on myös selainversio samalla laskennalla: https://joriim.github.io/EIP-CHP-Maatilan-hybridienergialaskuri/. Tilan oman kulutusprofiilin voi tehdä Rakennushaulla: https://joriim.github.io/EIP-CHP-Maatilan-hybridienergialaskuri/rakennushaku.html

## 1. Mihin laskuria käytetään?

Maatilan hybridienergialaskuri auttaa vertailemaan aurinkosähkön, sähköakun, lämpöpumpun, sähkökattilan ja lämpövaraajan käyttöä maatilan olemassa olevan hake- tai biokaasulämmityksen rinnalla. Se laskee sähkön ja lämmön käytön tunti tunnilta koko vuodelle ja näyttää, miten käyttäjän valitsemat laitteet vaikuttavat energiavirtoihin, kustannuksiin ja päästöarvioihin.

Laskuri soveltuu alustavaan vaihtoehtojen vertailuun ja energianeuvonnan tueksi. Valmiit kulutusprofiilit kuvaavat lihasikalaa ja broilerikasvattamoa. Oman tilan mittaustiedot parantavat tarkastelun osuvuutta. Käyttäjä valitsee laitekoot. Makroversion Optimointi-välilehti voi lisäksi käydä läpi käyttäjän antamat kokovaihtoehdot. Päälämmityksen yhteyteen voi lisätä CHP-sähköntuotannon yksinkertaistetulla sähköosuusmallilla. Laskuri ei mallinna CHP-laitoksen prosessia tai biokaasun tuotantoprosessia.

Keskeiset tulokset ovat verkosta ostettu ja verkkoon myyty sähkö, aurinkosähkön omakäyttö, akun ja lämpövaraajan käyttö, lämmöntuotanto, lämmitysvaje, vuotuinen kassasäästö, takaisinmaksuaika ja nettonykyarvo (NPV). Akun FCR-D ylös -reservikäytöstä ja päästöistä esitetään erilliset arviot. Tulokset ovat valittujen lähtötietojen ja oletusten mukaisia, eivät lupaus investoinnin toteutuvasta tuotosta.

## 2. Avaa tiedosto ja tee työkopio

1. Tallenna työkirja omalle koneelle. Jos tiedosto on pakattu, pura se ennen avaamista. Valitse **.xlsx**, jos et tarvitse kokoonpanon optimointia. **.xlsm**-tiedoston makrot Windows estää, kun tiedosto on ladattu internetistä: napsauta tiedostoa hiiren oikealla → **Ominaisuudet** → **Poista esto** → **OK**, avaa tiedosto ja valitse **Ota sisältö käyttöön**. Tee näin vain, jos tiedosto on peräisin projektin virallisesta lähteestä.
2. Säilytä alkuperäinen tiedosto ja tee omaa tarkastelua varten työkopio.
3. Avaa tiedosto Excelissä. Suositus on Microsoft 365 tai Excel 2019 tai uudempi. Kaikki käytetyt funktiot, kuten MAXIFS, eivät ole saatavilla kaikissa Excel 2016 -asennuksissa.
4. Varmista **Kaavat → Laskenta-asetukset → Automaattinen**. Tarvittaessa käynnistä täysi uudelleenlaskenta näppäimillä **Ctrl+Alt+F9**. Laskenta voi kestää.
5. Aloita välilehdeltä **Ohjauspaneeli ja Tulokset**. Muokkaa keltaisia syöttösoluja ja säilytä laskentasolujen kaavat.

Version 0.12.0 työkirjat on laskettu uudelleen LibreOffice Calcissa ja tarkistettu riippumattomalla kaavatulkitsimella. Microsoft Excelin omaa avaamista ja makron ajoa ei ole testattu tässä tarkistuksessa. Jos sovellus ilmoittaa tiedoston korjauksesta tai kaavavirheistä, selvitä ilmoitus ennen tulosten käyttöä.

## 3. Välilehdet

| Välilehti | Käyttötarkoitus |
|---|---|
| Ohjauspaneeli ja Tulokset | Tilan ja laitteiden valinnat, hinnat, ohjausasetukset ja päätulokset |
| Oma kulutusdata | Oman tilan sähkönkulutuksen ja lämmöntarpeen tuntisarjat |
| Optimointi | Kokoonpanon haku: ehdokasarvot, mittari, paras kokoonpano ja hakuloki (.xlsm) |
| Pörssihinnat | Laskennassa käytetty tuntihintasarja (kaava; älä liitä tähän) |
| Hintahistoria | Käyttäjän liittämät vuosien 2023–2026 tuntihinnat ja tuntikohtainen keskiarvo |
| Reservimarkkina | Akun FCR-D ylös- ja alas-käytön asetukset, tuottoskenaariot ja reservituotteiden vertailu |
| Kuukausikoonti | Energian ja kustannusten kuukausittainen tarkastelu |
| Vuosikassavirta | Kassavirrat, laitteiden uusimiset ja laitekohtaiset tukioletukset |
| Tuntitase_8760h | Varsinainen tuntikohtainen energialaskenta |
| Menetelmä ja lähteet | Mallin yhtälöt, oletukset ja lähdetiedot |
| Värit ja ilme | Työkirjan värien merkitykset |

## 4. Syötä tilan kulutus ja nykyinen lämmitys

Valitse Ohjauspaneelin solusta **D4** tuotantosuunta ja solusta **D5** päälämmitysmuoto. Tarkista nykyisen kattilan teho **D14**-solusta (oletus 500 kW, Veto Cont 500e -tyyppinen). Vertailun molemmissa vaihtoehdoissa lämmön toimituskyvyn pitää riittää samaan tarpeeseen.

### Vaihtoehto A: käytössä on vain vuosikulutus

Valitse lähin esimerkkiprofiili ja syötä tilan vuotuinen sähkönkulutus soluun **K7** ja lämmöntarve soluun **L7**, molemmat yksikössä **kWh/v**. Malli skaalaa esimerkkiprofiilin vuositasoa. Kulutuksen ajallinen jakauma säilyy esimerkin mukaisena.

Esimerkkiprofiilit ovat synteettisiä. Ne eivät ole mitattuja tiloja eikä niiden skaalaus osoita, että oman tilan huipputehot tai vuorokausirytmi vastaavat esimerkkiä.

### Vaihtoehto B: käytössä on oma tuntidata

1. Hanki sähkönkulutustiedot verkkoyhtiöstäsi tai Datahubin asiakasportaalista [1].
2. Muodosta lämmöntarpeesta vastaava tuntisarja. Jos lähtötietona on polttoaineen massa tai tilavuus, muunna se ensin polttoaine-energiaksi lämpöarvon avulla ja sen jälkeen hyötysuhteella toimitetuksi lämmöksi.
3. Liitä **Oma kulutusdata** -välilehdelle sähkö sarakkeeseen **E** ja lämpö sarakkeeseen **F**, alkaen riviltä **2**. Käytä **Liitä määräten → Arvot**.
4. Valitse Ohjauspaneelin **D4 = Oma data**.
5. Tarkista molempien sarjojen kattavuus ja tarkistustaulukon ilmoitukset. Kummassakin sarjassa tarvitaan 8 760 numeerista tuntiarvoa.
6. Valinnainen: liitä saman vuoden ulkolämpötila (°C) sarakkeeseen **G**. Lämpöpumpun COP ja pakkasraja käyttävät sitä; puuttuvat tunnit otetaan esimerkkivuodesta. Rakennushaun (https://joriim.github.io/EIP-CHP-Maatilan-hybridienergialaskuri/rakennushaku.html) vienti `oma_kulutusdata_<vuosi>.csv` liitetään sarakkeisiin A–G sellaisenaan ja sen hintasarake H Hintahistoria-välilehden vuoden sarakkeeseen.

Kulutussarjojen yksikkö on **kWh tunnissa**, eli jokaisen rivin tulee sisältää kyseisen tunnin energia. Todellinen nolla ja puuttuva havainto ovat eri asioita: älä täydennä tuntematonta kulutusta nollaksi ilman perustetta.

### Aikakanta on sama kaikille sarjoille

Malli käyttää **8 760 tuntia kiinteässä EET-ajassa (UTC+2)**. Ensimmäinen rivi vastaa 1.1. klo 00–01 ja viimeinen 31.12. klo 23–24. Kesäaikasiirtymää ei käytetä. Karkausvuoden 29.2. poistetaan.

Kohdista kulutus, sähkön hinta, lämpötila ja aurinkosähkön tuotanto tähän samaan aikajärjestykseen. Muunna kesäaikaa käyttävä aineisto ennen liittämistä, jotta kevään puuttuva ja syksyn toistuva tunti eivät siirrä sarjoja. Varttien **kulutusenergiat summataan** tunneiksi; varttien **hinnat keskiarvoistetaan** tunneiksi. Tuntimalli ei arvioi varttien sisäistä joustoa.

## 5. Valitse laitteet ja kustannukset

Ohjauspaneelin riveillä **9–15** valitaan laitteiden käyttö, koko ja yksikköhinta. Kytke tarkasteltava laite päälle arvolla 1 ja pois arvolla 0. Korvaa esimerkkihinnat tilakohtaisilla tarjouksilla. Noudata kunkin rivin yksikköä: sähköteho kW, aurinkosähkön nimellisteho kWp, akun energia kWh ja varaajan tilavuus m³ ovat eri suureita.

Tarkista seuraavat asetukset:

| Asetus | Sijainti | Tarkistettava asia |
|---|---|---|
| Laskentakorko ja tarkasteluaika | C27–C28 | Käytä kustannuksiin nähden johdonmukaista reaali- tai nimelliskorkoa. |
| Laitekohtaiset investointituet | Vuosikassavirta P3:Q8 | Hyväksyttävät kustannukset ja tukiosuus perustuvat kohteen ehtoihin tai päätökseen [12]. |
| Akun kalenteri-ikä | K50 | Korvaa oletus laitteen ja käytön mukaisella arviolla. |
| Varaajan häviö ja purkuteho | K51–K52 | Tarkista eristys, lämpötilataso ja käytettävissä oleva teho. |
| Sähkökattilan verkkolataus | K53 | Valitse, saako varaajaa ladata verkosta ostetulla sähköllä. |
| Lämpöpumpun ohjaus | K54 | Taloudellinen ohjaus tai lämpöpumpun etusijakäyttö. |
| COP-parametrit ja käyttörajat | K55–K60 | Sovita arvot laitteen, menoveden lämpötilan ja käyttöolosuhteiden tietoihin. |
| CHP: ORC bruttoteho, €/kWe | D15, F15 | Enogia ENO-40LT -tyyppinen 40 kWe. Investointi = D15 × F15. |
| ORC-asetukset | K69–K76 | Lämpöteho 640 kWth, menovesi 110 °C, paluupiiri 30 °C, viiteolosuhde 110/25 °C (oma oletus), omakäyttö 10 % (oma oletus), pienin lämpöteho 450 kWth. Tulokset K77–K79. |
| CHP: ylläpito, käyttöikä, uusiminen | K65–K67 | €/MWh sähköä, vuodet ja uusimisen osuus nykyhinnasta ovat omia oletuksia. |

**CHP: ORC (rivi 15).** ORC-sähkö = K79 × päälämmön tuotto joka tunti, enintään K78, ja vain tunteina, joina ORC:n lämpöteho on vähintään K76. K79 lasketaan menoveden K71 ja paluupiirin K72 lämpötilasta (Carnot-skaalaus viiteolosuhteesta). Se kattaa ensin tilan sähköntarpeen; ylijäämä myydään. Lisäpolttoaine = CHP-sähkö / kattilan hyötysuhde C26, ja se näkyy polttoainekustannuksessa ja päästöissä. Vuotuinen tuotanto näkyy solussa K68 ja rivillä 43. CHP ei toimi eikä sen investointia lasketa, jos K62 = *Toimitettu lämpö*. Malli ei huomioi osakuorman hyötysuhdetta, käynnistyksiä eikä lauhdutusajoa.

Pidä kustannusten arvonlisäverokäsittely yhtenäisenä. Laskuri ei laske vero- tai rahoituskassavirtoja. Tukiprosentti on laskentaoletus, ei vahvistus tuen myöntämisestä.

## 6. Syötä energian hinnat

### Kiinteä sähkön hinta

Syötä ostohinta **C22**-soluun ja myyntihinta **C23**-soluun, yksikkönä **c/kWh**. Kiinteän ostohinnan tulee sisältää energia, siirto ja sähkövero. Valitse **K22**-solussa kiinteä hinnoittelu. Syötä mahdollinen tehomaksu erikseen **K30**-soluun, yksikkönä **€/kW/kk**.

### Pörssisähkö

Hanki Suomen FI-alueen historialliset hinnat. Mahdollisia latauspalveluja ovat Sähkötin [2], Elering [3] ja Energy-Charts [4]. Aineistojen käyttö- ja jakamisoikeudet ovat palvelukohtaisia. Laskurin avoin lisenssi ei anna oikeutta ulkoisen hintadatan käyttöön.

Esimerkkejä vuoden 2025 suorista latauslinkeistä (muut vuodet: docs/PORSSIHINNAT.md):

- [Sähkötin: CSV](https://sahkotin.fi/prices.csv?start=2024-12-31T22:00:00.000Z&end=2025-12-31T21:59:59.999Z).
- [Elering: Suomen CSV](https://dashboard.elering.ee/api/nps/price/csv?fields=fi&start=2024-12-31T22:00:00Z&end=2025-12-31T21:59:59Z).
- [Energy-Charts: Suomen JSON](https://api.energy-charts.info/price?bzn=FI&start=2024-12-31T22:00Z&end=2025-12-31T21:59Z).

Raakalatausta ei liitetä suoraan laskuriin. Tuo aineisto tarvittaessa Excelin **Tiedot → Nouda tiedot / Tekstistä tai CSV:stä** -toiminnolla, muunna aikaleimat kiinteään EET-aikaan ja muodosta yksi hinta jokaiselle tunnille. JSON-aineisto vaatii JSON-tuonnin tai muun muunnoksen. Varmista desimaalierotin, puuttuvat havainnot, aikajärjestys ja mahdollisten varttihintojen tuntikeskiarvot. Muunnoksen tuloksena on 8 760 riviä; kesken olevalla vuodella osa riveistä voi olla tyhjiä.

1. Liitä valmis hintasarake ilman otsikkoa välilehdelle **Hintahistoria** vuoden sarakkeeseen riviltä 2 alkaen (**C** = 2023, **D** = 2024, **E** = 2025, **F** = 2026), käyttäen **Liitä määräten → Arvot**. Älä liitä Pörssihinnat-välilehdelle: sen sarake C on kaava.
2. Hintojen yksikkö on **€/MWh ilman arvonlisäveroa**. Esimerkiksi 100 €/MWh vastaa 10 c/kWh.
3. Valitse Ohjauspaneelissa **K22 = Pörssihinta** ja **K49** = tarkasteltava vuosi tai *Keskiarvo*. Valitun vuoden puuttuvat tunnit korvataan syötettyjen vuosien tuntikeskiarvolla; **M49** kertoo puuttuvien tuntien määrän.
4. Syötä **K23**-soluun siirto, sähkövero ja myyjän marginaali yhteensä, yksikkönä **c/kWh**. Älä lisää samaa maksua kahdesti.
5. Tarkista M49 ja Ohjauspaneelin puuteilmoitukset. Jos tunnilta puuttuu hinta kaikilta vuosilta, kannattavuustulos estetään.

### Lämmön hinta

Syötä hakkeen tai biokaasulämmön hinta ja kattilan hyötysuhde soluihin **C24–C26**. Määritä **K62**-solussa, tarkoittaako hinta polttoainetta vai toimitettua lämpöä. Toimitetun lämmön sopimushintaa ei jaeta uudelleen kattilan hyötysuhteella.

## 7. Akun ohjaus ja reservit

Akun käyttötapa valitaan **K26**-solussa. **Vain PV-ylijäämä** lataa akkua aurinkosähkön ylijäämällä. **Pörssiohjattu** sallii lisäksi verkkolatauksen valittuina halpoina tunteina ja purun kalliina tunteina. Tarkista lataus- ja purkutuntien määrät **K27–K28**-soluissa. Pörssiohjaus tarvitsee pörssihintasarjan ja on sääntöpohjainen arvio, ei koko vuoden kustannusoptimi.

**Reservimarkkina**-välilehdellä voidaan arvioida akun FCR-D-reservikäyttöä. Purkuteho tarjotaan FCR-D ylös- ja latausteho FCR-D alas -reserviin; suunnat valitaan soluissa **C36–C37**. Tarkista käyttötapa, tavoitevaraus, saatavuus, aggregaattorin osuus (**C10**, oletus 50 %), vähimmäispalkkio (**C39**, oletus 12 €/kk) ja aktivointienergian oletus.

Oletusskenaario **Viimeiset 12 kk** käyttää toteutuneita tuntihintoja 24.9.2025–24.9.2026. Skenaario **Kyllästynyt markkina** käyttää Fingridin vuoden 2026 vuosimarkkinahintoja (ylös 3,50 ja alas 6,00 €/MW,h) [17] ja hintojen vuosimuutosta −10 %/v (**C42**); sen alas-hinta on yli kaksinkertainen tuntimarkkinan toteumaan nähden. Tuntihinnat ovat mukana: ylös-suunta [5] sarakkeissa AO–AT ja alas-suunta [18] sarakkeissa **BJ–BO** välilehdellä **Tuntitase_8760h**. Päivitä ne tarvittaessa Fingridin latauksesta skriptillä `scripts/muunna_fingrid_reservi.py`. Jos sarakkeet tyhjennetään, **K14** näyttää *Reservihinta puuttuu*.

FCR-N-, aFRR-, mFRR- ja FFR-tuotteita ei lasketa. Välilehden tuotetaulukko kertoo syyt: vähimmäistarjous, akun kuluminen, markkinan muutokset ja aggregoinnin ehdot. Tuotteen taustakuvaus ja osallistumisen vaatimusten lähteet ovat [6–7].

Tee vertailu aina myös ilman reservituloa. Käyttöhistoria ei takaa tulevaa hintaa, ja vuoden 2026 osavuodesta vuositasolle skaalattu tulos on skenaario. Laskuri ei toista taajuushäiriöitä eikä osoita laitteen markkinakelpoisuutta. Käytännön sopimus, tekninen hyväksyntä ja kulut on selvitettävä erikseen.

## 7B. Kokoonpanon optimointi (.xlsm)

**Optimointi**-välilehti käy läpi laitekokojen vaihtoehdot ja asettaa niistä parhaan Ohjauspaneeliin.

1. Aseta ensin kaikki muut lähtötiedot: tila, lämmitys, hinnat, korko ja ohjaustavat.
2. Valitse mittari solussa **C5**: *NPV (suurin)*, *Takaisinmaksuaika (lyhin)* tai *Vuotuinen säästö (suurin)*.
3. Kirjoita ehdokasarvot soluihin **D8:D13** pilkuin eroteltuna. Arvo 0 tarkoittaa, että laite on pois päältä. ORC:n ehdokkaat kirjoitetaan kWe:inä, esimerkiksi 0, 40.
4. Paina hakupainiketta. Haku muuttaa yhden laitteen kokoa kerrallaan, laskee koko laskurin uudelleen ja jättää voimaan parhaan arvon. Kierroksia tehdään, kunnes tulos ei parane, enintään neljä.
5. Paras kokoonpano kirjoitetaan Ohjauspaneelin riveille 9–13 ja 15. Rivillä 18 on paras tulos ja riveiltä 25 alkaen jokainen laskettu kokoonpano (Sija-sarake: 1 = paras).

Jokainen kokoonpano vaatii koko 8 760 tunnin uudelleenlaskennan, joten pitkät listat voivat kestää kymmeniä minuutteja. **Esc** keskeyttää haun ja palauttaa alkuperäisen kokoonpanon. Haku hyväksyy vain kokoonpanot, joissa K14 = OK. Koordinaattihaku löytää parhaan tuloksen annetusta ruudukosta yhden laitteen muutoksilla; se ei takaa parasta mahdollista yhdistelmää. Tarkista tulos kokeilemalla lähiarvoja ja vertaa tulosta myös ilman tukea ja reservituloa. Makrottomassa .xlsx-tiedostossa hakupainiketta ei ole; vertaa silloin kokoonpanoja käsin.

## 8. Lue tulokset ja vertaile vaihtoehtoja

**Tarkista ensin kelvollisuus.** Ohjauspaneelin **K14** ilmoittaa vertailun estävistä puutteista. **K13/L13** näyttävät toimittamatta jäävää lämpöä. Lämmitysvaje tai puuttuva kulutus- tai hintadata on ratkaistava ennen kannattavuuden tulkintaa.

**Tarkista energiatase.** Seuraa verkko-ostoa, omakäyttöä, myyntiä, akun käyttöä ja lämmöntuotantoa. Kuukausikoonti auttaa löytämään vuodenaikaiset erot. Tuntitaseesta voi selvittää yksittäisen poikkeaman.

**Tarkista talouden sisältö.** Vuotuinen kassasäästö **E51** sisältää ylläpidon. Varsinainen NPV **E54** huomioi mallinnetut uusimiset (akku, invertteri, CHP). **E55** on erillinen vertailu ilman ylläpitoa ja uusimisia. Yksinkertainen takaisinmaksuaika ei kuvaa kaikkien tulevien uusimisten ajankohtia. Positiivinen NPV tarkoittaa, että vaihtoehto ylittää valitun vertailutilanteen kustannukset ja tuottovaatimuksen mallin oletuksilla; se ei yksin osoita jokaisen mukana olevan laitteen kannattavuutta.

Tee esimerkiksi seuraava vertailu: nykyinen järjestelmä; nykyinen järjestelmä ja aurinkosähkö; edellinen ja akku; edellinen ja lämpöpumppu. Pidä tilan energiantarve ja muut yhteiset lähtötiedot samoina. Laske laitteen lisäarvo kahden ajon erotuksena:

**Laitteen lisä-NPV = NPV laitteen kanssa − NPV ilman laitetta.**

Muuta myös sähkön ja lämmön hintoja, laitehintaa, korkoa, käyttöikää, COP:ta ja reservituloa. Kirjaa, missä tilanteessa vaihtoehtojen paremmuusjärjestys vaihtuu. Tallenna kunkin ajon versio, aineistovuodet, lähteet, laitevalinnat, hinnat ja ohjaustavat.

## 9. Päästölukujen tulkinta ja oletusten rajat

Laskuri näyttää useita eri rajauksia:

- Kotimaisen sähköntuotannon keskimääräinen CO₂-kerroin perustuu Motivan tietoihin [9]. Version 0.9.1 arvo 45 g/kWh vastaa vuosien 2022–2024 keskiarvoa. Tuontisähkö ja elinkaaripäästöt eivät sisälly tähän rajaukseen.
- Suomessa kulutetun sähkön käytönaikainen tuntikerroin perustuu Fingridin aineistoon [8], jossa huomioidaan myös tuonti ja vienti.
- Sähkön vaikutusskenaarion lähtöpisteet perustuvat Sitowisen raporttiin [10]. Vuosittainen interpolointi ja tilakohtainen sovellus ovat laskurin omia ratkaisuja. Tulos ei ole mitattu marginaalipäästövaikutus.
- Laitteiden valmistusarvio ja polttoaineiden yhdistelmäkertoimet sisältävät omia skenaario-oletuksia. PV:n elinkaaritutkimus [11] on taustalähde, ei kaikkien laitekohtaisten kertoimien varmennus.

Älä laske eri rajauksia yhteen täydelliseksi elinkaaritulokseksi. Valmistuskertoimet tulisi korvata vertailukelpoisilla EPD- tai LCA-tiedoilla, joiden järjestelmärajat tunnetaan.

Seuraavat arvot ovat **mallin oletuksia**, eivät lähdeluettelon vahvistamia laiteominaisuuksia:

| Oletusryhmä | Version 0.11.0 lähtöarvoja | Käyttäjän tarkistettava |
|---|---|---|
| Lämpöpumppu | COP = rajattu 3,2 + 0,07 × ulkolämpötila; rajat 1,8–4,8 | Laitteen COP, lämmönjaon lämpötilat, sulatukset ja pakkaskäyttö |
| Akku | Hyötysuhde 90 %, 0,5C, 6 000 sykliä, kalenteri-ikä 15 v | Käytettävä kapasiteetti, teho, takuu ja ikääntyminen |
| Varaaja | 46,5 kWh/m³, häviö 100 W, purkuteho 300 kW | Vesitilavuus, lämpötilaero, häviö ja lämmönsiirto |
| Reservi | Odotettu aktivointi 0,01 h/h, saatavuus 95 %, tilan osuus 50 %, vähimmäispalkkio 12 €/kk, kyllästyneen markkinan vuosimuutos −10 % | Toteutuva käyttö, aggregaattorin sopimus ja kustannukset |
| Valmistuspäästöt | PV 700 kg/kWp, akku 90 kg/kWh, lämpöpumppu 100 kg/kW, varaaja 300 kg/m³ | Tuote- ja järjestelmäkohtaiset elinkaaritiedot |
| Päälämmitys | Veto Cont 500e -tyyppinen, 500 kW, hyötysuhde 0,85 | Oman kattilan teho ja hyötysuhde |
| CHP: ORC | ENO-40LT-tyyppinen 40 kWe, 3 000 €/kWe, viiteolosuhde 110/25 °C, omakäyttö 10 %, ylläpito 15 €/MWh, käyttöikä 15 v, uusiminen 80 % | Toimittajan teho- ja hyötysuhdetiedot, hinta ja huolto |
| Polttoaineiden päästöarviot | Hake 13 ja biokaasu 15 kg CO₂e/MWh polttoainetta | Toimitusketju, metaanipäästöt ja laskennan rajaus |

Sää- ja PV-esimerkkien alkuperäistä havaintovuotta, havaintoasemaa, lähdepalvelua ja muunnosketjua ei ole toimitetussa aineistossa täysin dokumentoitu. Myös synteettisten kulutusprofiilien muodostus ja validointi ovat puutteellisesti dokumentoituja. Niille ei siksi nimetä varmistamatonta lähdettä. Eri vuosien kulutus, sää ja hinnat muodostavat herkkyysskenaarion, eivät toteutuneen vuoden jälkilaskentaa.

Talouslaskenta toistaa yhden tuntivuoden toimintaa. Tulevia hintoja ja säätä, paneelien asteittaista ikääntymistä tai kaikkia laitteiden käyttörajoja ei mallinneta erikseen.

## 10. Tavalliset käyttötilanteet

| Havainto | Tarkistus |
|---|---|
| Taloustulos puuttuu | Tarkista K14, lämmitysvaje ja vaadittujen tuntisarjojen kattavuus. |
| Tulokset eivät muutu | Varmista automaattinen laskenta ja tee täysi uudelleenlaskenta. |
| Optimointipainike ei toimi | Käytä .xlsm-tiedostoa, poista tiedoston esto (Ominaisuudet → Poista esto) ja salli sisältö. LibreOfficessa Excel-makro ei välttämättä toimi. |
| Kaikilla optimoinnin riveillä sama tulos | Laskenta ei päivittynyt. Varmista automaattinen laskenta ja aja haku uudelleen. |
| Hinnat näyttävät kymmenkertaisilta | Tarkista €/MWh- ja c/kWh-yksiköt sekä desimaalierotin. |
| Kulutusta tai hintaa on liikaa/liian vähän | Tarkista 8 760 tuntia, karkauspäivä, kesäaika ja mahdollinen varttidata. |
| Akku ei lataudu verkosta | Tarkista pörssihinnat, K26-ohjaus, lataustunnit ja ohjauksen hintaehto. |
| Lämpöpumpun hyöty on poikkeavan suuri | Tarkista COP, lämpöteho, lämmön hinnan peruste ja vertailutilanteen lämmön riittävyys. |
| Kaavassa näkyy #NIMI? tai #NAME? | Tarkista Excel-version funktiotuki ja se, ettei kaavoja ole korvattu tuonnissa. |

## 11. Lähdeluettelo

Lähteet on ryhmitelty käyttötarkoituksen mukaan. Varmennetut sisältötiedot tarkistettiin 22.10.2026; JavaScriptiä tai kirjautumista vaativissa palveluissa sivun saatavuus ei tarkoita koko aineiston tarkistusta. Ulkoisten hintapalvelujen vuoden 2025 latausten toiminta tarkistettiin 21.10.2026. Jokaisen työkirjaan sisältyvän havaintorivin alkuperää ei ole tässä tarkistuksessa varmennettu uudelleen. Lähde ei sellaisenaan vahvista laskurin koko laskentamenetelmää tai kaikkia oletusarvoja.

### Kulutus- ja sähkön hintatiedot

**[1] Fingrid Datahub Oy. Datahubin asiakasportaali.**  
https://oma.datahub.fi/  
Käyttö: oman käyttöpaikan sähkönkulutuksen lähtötiedot. Palvelu edellyttää kirjautumista. Tarkista ladatun aineiston aika-askel, yksikkö ja aikavyöhyke ennen käyttöä. Portaali ei ole lähde laskurin synteettisille esimerkkiprofiileille.

**[2] Pakastin Oy. Sähkötin – API.**  
https://sahkotin.fi/api  
Käyttö: historiallisten pörssisähköhintojen lataus; oletusyksikkö €/MWh. `vat` lisää arvonlisäveron ja `fix` muuntaa yksikön c/kWh:ksi, joten niitä ei käytetä laskurin raakahintasarjassa. Palvelu ilmoittaa ilmaisen API:n olevan ei-kaupalliseen käyttöön ja Nord Poolin omistavan spot-hintadatan. Varmista omaan käyttöön soveltuvat oikeudet.

**[3] Elering AS. Electricity system dashboard – API documentation.**  
https://dashboard.elering.ee/assets/swagger-ui/index.html  
Käyttö: vaihtoehtoinen Suomen aluehintojen CSV-lataus, `fields=fi`. Aineiston UTC-aikaleimaa käytetään aikakohdistukseen; paikallinen kellonaikasarake voi sisältää kesäaikasiirtymät. Dokumentaatiosivu vaatii JavaScriptiä; CSV-lataus toimi 21.10.2026. Tarkista datan käyttöehdot erikseen.

**[4] Fraunhofer ISE. Energy-Charts API, price-rajapinta.**  
https://api.energy-charts.info/  
Käyttö: vaihtoehtoinen Suomen JSON-hintasarja, `bzn=FI`, aikaleimat `unix_seconds` ja hinnat `price`. Hintavastauksen `license_info`-kenttä rajasi 21.10.2026 käytön yksityiseen ja sisäiseen käyttöön sekä kielsi ulkoisen ja kaupallisen käytön. Älä sovella API:n muiden aineistojen lisenssiä automaattisesti hintasarjaan. Varmista ajantasaiset ehdot ennen käyttöä.

### Reservimarkkina

**[5] Fingrid Oyj. Taajuusohjattu häiriöreservi ylössäätö, tuntimarkkinahinnat. Avoin data, aineisto 318.**  
https://data.fingrid.fi/datasets/318  
Käyttö: FCR-D ylös -kapasiteettihintojen historiallinen tuntisarja. Laskennassa yksikkö €/MW,h. Aineisto kertoo markkinahinnan, ei yksittäisen akun toteutunutta nettotuottoa tai aktivointienergiaa.

**[6] Fingrid Oyj (2023). Tuotekuvaus: taajuuden vakautusreservit (FCR). Päivitetty 21.9.2023.**  
https://www.fingrid.fi/globalassets/dokumentit/fi/sahkomarkkinat/reservit/tuotekuvaus-taajuuden-vakautusreservit-fcr.pdf  
Käyttö: mallin FCR-energia- ja energianhallintarajausten taustakuvaus, erityisesti taulukko 1. Dokumentti ilmoittaa olevansa epävirallista lisämateriaalia. Se ei korvaa voimassa olevia sopimusliitteitä tai hyväksymisprosessia eikä ole lähde laskurin odotetulle vuosittaiselle aktivointienergialle.

**[7] Fingrid Oyj. Sähköjärjestelmän reservit.**  
https://www.fingrid.fi/sahkomarkkinat/reservit/sahkojarjestelman-reservit/  
Käyttö: reservituotteiden ja niiden roolin yleiskuva sekä polku tuotteiden teknisiin ja markkinaosallistumisen vaatimuksiin. Käytännön osallistumisessa tarkistetaan kulloinkin voimassa olevat tuote- ja sopimusehdot.

### Päästöt

**[8] Fingrid Oyj. Suomessa kulutetun sähkön päästökerroin – päivitys 15 minuutin välein. Avoin data, aineisto 396.**  
https://data.fingrid.fi/datasets/396  
Käyttö: Suomessa kulutetun sähkön käytönaikaisen CO₂-päästökertoimen aikasarja, yksikkö gCO₂/kWh. Mukana ovat kotimainen tuotanto, tuonti ja vienti. Tuntimalli käyttää tuntitasolle muunnettua sarjaa. Aineisto ei ole täydellinen sähköntuotannon elinkaarikerroin.

**[9] Motiva Oy. CO₂-päästökertoimet.**  
https://www.motiva.fi/tietopankki/energiankaytto-suomessa/co2-paastokertoimet/  
Käyttö: kotimaisen sähköntuotannon keskimääräinen kerroin. Sivun mukaan vuosien 2022–2024 keskiarvo on 45 kgCO₂/MWh eli 45 gCO₂/kWh. Lähde perustuu Tilastokeskuksen tietoihin ja energiamenetelmään. Tuontisähkö ja energiantuotannon elinkaaripäästöt on rajattu pois.

**[10] Sitowise Oy (2025). Päästökerrointarkastelu: Suomen ilmastopolitiikkatoimien arviointi. Kesäkuu 2025. Motivan ja työ- ja elinkeinoministeriön toimeksianto; rahoittaja Energiavirasto.**  
https://www.motiva.fi/wp-content/uploads/sites/2/2025/07/Vaikuttavuusarvioinnin-paastokerrointarkastelu-06-2025.pdf  
Käyttö: sähkön vaikutusskenaarion lähtöpisteet, PDF:n sivu 37, taulukko 5. Taulukossa vuosille 2030, 2035, 2040, 2045 ja 2050 esitetään 155, 110, 80, 35 ja 0 tCO₂/GWh (sama lukuarvo gCO₂/kWh). Raportti käsittelee politiikkatoimien vaikutusarviointia. Laskurin tilakohtainen sovellus ja lineaarinen interpolointi ovat omia skenaario-oletuksia.

**[11] Louwen, A., van Sark, W. G. J. H. M., Faaij, A. P. C. & Schropp, R. E. I. (2016). Re-assessment of net energy production and greenhouse gas emissions avoidance after 40 years of photovoltaics development. Nature Communications, 7, 13728.**  
https://doi.org/10.1038/ncomms13728  
Käyttö: aurinkosähkön elinkaarivaikutusten tutkimustausta. Vertaisarvioitu tutkimus ei sellaisenaan varmista laskurin 700 kg/kWp -skenaariokerrointa tai nykyisen, kokonaisena asennetun järjestelmän päästöjä. Kertoimien sopivuus on tarkistettava kohde- ja tuoteaineistosta.

### Investointituet ja lisenssi

**[12] Ruokavirasto. Maatalouden investointituet.**  
https://www.ruokavirasto.fi/tuet/maatalous/investoinnit/maatalouden-investointituet/  
Käyttö: tukimenettelyjen ja ajantasaisten ehtojen viranomaislähde. Laskurin tukioletus ei vahvista hakijan tai laitteiston tukikelpoisuutta. Tarkista hyväksyttävät kustannukset, tukiosuus, hakumenettely ja kohteen päätös erikseen.

**[13] Creative Commons. Nimeä 4.0 Kansainvälinen / Attribution 4.0 International.**  
https://creativecommons.org/licenses/by/4.0/  
Käyttö: laskurin ja tämän ohjeen uudelleenkäytön lisenssi. Varsinaiset ehdot ovat sivulta avautuvassa lisenssitekstissä. Ulkoisen datan oikeudet määräytyvät sen omien ehtojen mukaan.

## 12. Tekijät ja käyttöoikeus

Laskuri on laadittu EIP CHP Energiaälykäs eteläpohjalainen maatila -hankkeessa. Tekijät ovat Suvi Karirinne ja Miiro Jääskeläinen, Seinäjoen ammattikorkeakoulu (SEAMK), Maatalous ja energia -tutkimusryhmä. Hanke on Euroopan unionin osarahoittama.

Excel-laskuria ja tätä ohjetta voi käyttää, muokata ja jakaa **CC BY 4.0** -lisenssillä [13], kun tekijät ja lähde mainitaan, lisenssiin viitataan ja muutoksista ilmoitetaan. Säilytä mukana toimitetut lisenssi- ja tekijätiedot. Laskuri toimitetaan ilman takuuta.

Lähdeviite: Karirinne, S. & Jääskeläinen, M. (2026). *Maatilan hybridienergialaskuri*, versio 0.12.0. Seinäjoen ammattikorkeakoulu, EIP CHP Energiaälykäs eteläpohjalainen maatila -hanke. CC BY 4.0.

## 13. Tekoäly laskurin kehittämisessä ja käytössä

**Laskurin kehittämisessä on hyödynnetty tekoälyä.** Tekoälyä on käytetty apuna laskentakaavojen ja koodin tarkastelussa, dokumentoinnissa sekä vaihtoehtojen luonnostelussa. Se on toiminut tekijöiden työvälineenä. Tekoälyn käyttö ei itsessään varmista laskennan oikeellisuutta: tarkistukset, lähtötiedot ja mallin rajaukset ratkaisevat tulosten käyttökelpoisuuden.

### Tekoälyavustajan käyttäminen Excelissä

Suosittelemme Excelissä toimivan tekoälyavustajan kokeilemista lähtötietojen kokoamiseen, syötettävien tietojen jäsentämiseen ja oman tilan vaihtoehtojen luonnosteluun. Valitse käytössäsi olevaan tiliin ja työympäristöön sopiva vaihtoehto. Laskuri toimii myös ilman tekoälylisäosia.

- **Microsoft Copilot Excelissä** on luonteva vaihtoehto Microsoft 365 -ympäristössä. Sillä voi pyytää apua taulukoiden ja lähtötietojen jäsentämiseen, kaavojen selittämiseen sekä vaihtoehtojen vertailun valmisteluun. Käyttö aloitetaan Excelin Copilot-toiminnosta; saatavuus riippuu tilauksesta ja organisaation asetuksista. Ohje: [14].
- **ChatGPT for Excel** on OpenAI:n Excel-lisäosa. Se soveltuu esimerkiksi monivälilehtisen työkirjan rakenteen selittämiseen, syöttötietojen tarkistuslistaan ja tilakohtaisten skenaarioiden luonnosteluun. Asenna virallinen lisäosa Excelin **Aloitus → Lisäosat** -valikosta ja kirjaudu oikealle ChatGPT-tilille. Tarkista oman tilauksen saatavuus ja organisaation asetukset. Ohje: [15].
- **Claude for Excel** on Anthropicin Excel-lisäosa. Se on vaihtoehto erityisesti kaavasuhteiden selvittämiseen, oletusten tarkasteluun ja lähtötietojen täydentämisen suunnitteluun. Asenna virallinen Anthropic-lisäosa palvelun asennusohjeen mukaan ja tarkista oman Claude-tilauksen käyttöoikeus. Ohje: [16].
Suositukset koskevat avustavaa työskentelyä. Lisäosien toimivuutta juuri tämän työkirjan kaikilla kaavoilla ja toiminnoilla ei ole testattu. Tuotenimet, ominaisuudet ja käyttöoikeudet on tarkistettu valmistajien ohjeista 22.10.2026; ne voivat muuttua.

### Käyttötapa tämän laskurin kanssa

1. Tee laskurista työkopio ja kokoa oman tilan tiedot erilliseen lähtötietotaulukkoon. Pyydä avustajaa merkitsemään puuttuvat tiedot sekä kunkin luvun lähde, yksikkö ja aineistovuosi. Puuttuvia mittauksia ei pidä keksiä.
2. Pyydä ensin ehdotus syöttösoluista ja muunnoksista. Tarkista erityisesti kWh/MWh, kW/kWp, c/kWh/€/MWh, arvonlisävero sekä kiinteä EET-aikakanta ja 8 760 tuntia.
3. Anna hyväksytyt muutokset rajattuina syöttösoluihin. Pyydä avustajaa säilyttämään laskentakaavat, välilehdet ja lähtöaineistot sekä esittämään muutetut solut ja uudet arvot.
4. Luonnostele esimerkiksi nykytilanne, PV-vaihtoehto, PV ja akku sekä lämpöpumppuvaihtoehto. Erota mitattu tieto, tarjoushinta ja oma oletus toisistaan. Tarkista tulokset uudelleenlaskennan jälkeen ja säilytä vertailuajojen lähtötiedot.

Käytä oman organisaation hyväksymää tiliä ja lisäosaa. Tarkista palvelun tietojen käsittely ennen tilan tunnistetietojen, sopimusten tai yksityiskohtaisen kulutusdatan lähettämistä.

### Esimerkkikehotteita

**Lähtötietojen kokoaminen:** ”Auta minua valmistelemaan tämän laskurin syötteet oman tilani tiedoista. Tee taulukko: tieto, arvo, yksikkö, lähde, vuosi ja puuttuva tarkennus. Kysy puuttuvat tiedot. Älä muuta työkirjaa tai keksi mittaustuloksia.”

**Tietojen syöttösuunnitelma:** ”Selvitä laskurin nykyiset syöttösolut ja ehdota, mihin antamani tiedot kuuluvat. Tarkista yksiköt, alv-peruste ja aikakanta. Näytä muutosehdotukset muodossa välilehti, solu, nykyinen arvo, ehdotettu arvo ja perustelu. Säilytä kaavat.”

**Oman tilanteen luonnostelu:** ”Luonnostele näillä kulutustiedoilla ja tarjoushinnoilla nykytilanne sekä kolme hybridivaihtoehtoa. Pidä energiantarve ja yhteiset oletukset samoina. Listaa vielä tarvittavat tiedot ja herkkyystarkastelut. Älä esitä luonnosta lopullisena mitoituksena tai investointisuosituksena.”

### Lisäosien lähteet ja asennusohjeet

**[14] Microsoft. Get started with Copilot in Excel.**\
https://support.microsoft.com/en-us/excel/copilot/get-started-with-copilot-in-excel\
Käyttö: Copilotin Excel-toiminnot, käyttöönotto ja saatavuuden tarkistaminen.

**[15] OpenAI. ChatGPT for Excel and Google Sheets.**\
https://help.openai.com/en/articles/20001063-chatgpt-for-excel-and-google-sheets\
Käyttö: virallisen ChatGPT-lisäosan ominaisuudet, asennus, kirjautuminen ja tilikohtainen saatavuus.

**[16] Anthropic. Use Claude for Excel.**\
https://claude.com/docs/office-agents/excel\
Käyttö: virallisen Claude-lisäosan ominaisuudet, asennus ja käyttöoikeudet.

### Reservimarkkinan lisälähteet (0.9.3)

**[17] Fingrid Oyj. Taajuusohjatut reservit (FCR-N, FCR-D ylös ja FCR-D alas), kaupat tunti- ja vuosimarkkinoilla.**\
https://www.fingrid.fi/en/electricity-market-information/reserve-market-information/frequency-controlled-disturbance-reserve/\
Käyttö: vuosimarkkinan hinnat ja määrät 2024–2026 (FCR-D ylös 4,00 / 4,00 / 3,50 €/MW,h; FCR-D alas 9,50 / 8,66 / 6,00 €/MW,h; FCR-N ei hankintaa 2026). Tarkistettu 23.10.2026.

**[18] Fingrid Oyj. Taajuusohjattu häiriöreservi alassäätö, tuntimarkkinahinnat. Avoin data, aineisto 283.**\
https://data.fingrid.fi/datasets/283\
Käyttö: FCR-D alas -kapasiteettihintojen tuntisarja 21.4.2021–30.10.2026, mukana laskurissa ja tiedostossa data/fingrid_fcr_d_alas_tuntihinnat.csv. CC BY 4.0, lähde Fingrid Oyj.

**[19] Enion. Tilannekatsaus optimointeihin ja reservimarkkinoihin syksyllä 2026.**\
https://www.enion.fi/artikkelit/tilannekatsaus-optimointeihin-ja-reservimarkkinoihin-syksyll-2026\
Käyttö: esimerkki aggregaattorin palkkiorakenteesta (vähimmäispalkkio 12 €/kk, asiakasosuus) ja kyllästyneen markkinan toteutuneesta tasosta. Yhden palveluntarjoajan kaupallinen tiedote, ei markkinatilasto.
