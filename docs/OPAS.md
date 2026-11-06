# Maatilan hybridienergialaskuri – esittely, käyttö ja jatkokehitys

Ohje versiolle 0.11.0. Päivitetty 6.11.2026.

## Mikä laskuri on?

Maatilan hybridienergialaskuri on avoimesti jaettava selain- ja Excel-työkalu maatilan energiaratkaisujen vertailuun. Sen avulla viljelijä, energianeuvoja tai kehittäjä voi tarkastella, miten aurinkosähkö, sähköakku, lämpöpumppu, sähkökattila ja lämpövaraaja toimivat yhdessä olemassa olevan hake- tai biokaasulämmityksen kanssa. Laskuri on kehitetty EIP CHP Energiaälykäs eteläpohjalainen maatila -hankkeessa. Tekijät ovat Suvi Karirinne ja Miiro Jääskeläinen, Seinäjoen ammattikorkeakoulu (SEAMK), Maatalous ja energia -tutkimusryhmä.

Laskennan lähtökohtana ovat tilan sähkönkulutus ja lämmöntarve. Laskuri käy vuoden läpi tunti tunnilta ja arvioi energian tuotannon, käytön, varastoinnin, verkko-ostot ja sähkön myynnin. Käyttäjä valitsee laitteiden koot ja hinnat sekä vertailee vaihtoehtoja. Makroversion Optimointi-välilehti voi lisäksi käydä läpi käyttäjän antamat kokovaihtoehdot ja asettaa niistä parhaan. Laskuri ei mitoita lopullista toteutusta.

Työkalu soveltuu erityisesti sika- ja siipikarjatilojen alustavaan tarkasteluun. Mukana on synteettiset kulutusprofiilit lihasikalalle ja broilerikasvattamolle. Omalla tuntidatalla voi tarkastella myös muita kohteita, mutta mallin soveltuvuus niiden tuotantoprosessiin on arvioitava erikseen. Versiossa 0.9.2 päälämmityksen yhteyteen voi lisätä CHP-sähköntuotannon yksinkertaistetulla sähköosuusmallilla. Laskuri ei mallinna CHP-laitoksen prosessia (sähköhyötysuhde, minimikuorma, käynnistykset) eikä biokaasun tuotantoprosessia.

Laskurin tavoite on tehdä vaihtoehtojen oletukset ja vaikutukset näkyviksi. Se auttaa tunnistamaan jatkoselvitystä vaativat ratkaisut sekä tarkistamaan, mistä laskettu hyöty syntyy. Investointipäätös edellyttää lisäksi kohdekohtaisia mittauksia, laitetarjouksia, teknistä suunnittelua ja sopimusehtojen tarkistamista.

## Mitä laskuri kertoo?

| Tarkastelu | Laskurin tulos | Tulkinnassa huomioitavaa |
|---|---|---|
| Sähkö | Tuotanto, omakäyttö, verkko-osto, myynti ja akun käyttö | Kulutuksen ja tuotannon ajoitus vaikuttaa hyötyyn. |
| Lämpö | Lämmöntuotannon jakautuminen, varaajan käyttö ja toimittamaton lämpö | Lämmitysvaje estää kannattavuusvertailun. |
| Talous | Nettoinvestointi, vuotuinen kassasäästö, yksinkertainen takaisinmaksuaika ja nettonykyarvo (NPV) | NPV huomioi ylläpidon ja mallinnetut uusimiset. |
| Reservimarkkina | Skenaario akun FCR-D ylös- ja alas-kapasiteettitulolle aggregaattorin palkkioiden jälkeen sekä energiavaikutuksille | Markkina on kyllästynyt akuista. Tulos ei vahvista markkinoille pääsyä tai tulevia tuottoja. |
| Päästöt | Käyttövaiheen päästöarviot, erillinen valmistusarvio ja sähkön vaikutusskenaario | Eri rajauksilla laskettuja tuloksia ei summata täydelliseksi elinkaaritulokseksi. |

## Näin aloitat

1. Nopein tapa: avaa [selainversio](https://joriim.github.io/EIP-CHP-Maatilan-hybridienergialaskuri/). Excel-versiota varten avaa [projektin GitHub-sivu](https://github.com/joriim/EIP-CHP-Maatilan-hybridienergialaskuri). Lataa koko projekti valinnalla **Code → Download ZIP**, tai lataa [makroton Excel-tiedosto](../laskuri/Maatilan_hybridienergialaskuri.xlsx) tiedoston latauspainikkeella. Kokoonpanon optimointi on vain [makroversiossa](../laskuri/Maatilan_hybridienergialaskuri.xlsm); internetistä ladatun .xlsm-tiedoston esto poistetaan tiedoston ominaisuuksista (**Poista esto**) ennen avaamista.
2. Pura ZIP ennen käyttöä ja säilytä alkuperäisestä työkirjasta kopio. Nimeä oma tarkastelusi esimerkiksi tilan sisäisellä tunnisteella ja päivämäärällä.
3. Avaa Excel-tiedosto ja varmista, että laskenta on automaattinen. Työkirjan uudelleenlaskenta voi kestää. Suositeltu Excel-versio on Microsoft 365 / Excel 2019 tai uudempi. Osa funktioista, kuten MAXIFS, ei ole käytettävissä kaikissa vanhemmissa versioissa.
4. Aloita välilehdeltä **Ohjauspaneeli ja Tulokset**. Muokkaa keltaisia syöttösoluja. Säilytä laskentasolujen kaavat.
5. Tee ensin lähtötilanne ja tallenna sen tiedot. Lisää sen jälkeen laitteita yksi kerrallaan, jotta kunkin muutoksen vaikutus erottuu.

Työkirjan nykyinen versio on avattu, laskettu uudelleen ja tallennettu LibreOffice Calcissa. Microsoft Excelin omaa avaamista ei ole testattu tässä tarkistuksessa. Jos saat korjaus- tai kaavavirheilmoituksen, tallenna ilmoituksen tiedot virheraporttiin ja varmista laskennan toiminta ennen tulosten käyttöä.

## Valmistele lähtötiedot

Kerää vähintään sähkön ja lämmön vuosikulutukset, nykyisen lämmityksen teho ja kustannukset, sähkösopimuksen hinnat sekä suunniteltujen laitteiden koot ja tarjoukset. Tarkempi arvio edellyttää tuntisarjoja. Käytä kustannuksissa samaa arvonlisäveron käsittelyä ja ilmoita käyttämäsi peruste tulosten yhteydessä. Pörssihintasarja syötetään ilman arvonlisäveroa.

### Kulutus ja aikakanta

Jos käytössä on vain vuosikulutus, valitse Ohjauspaneelin D4-solusta lähin esimerkkiprofiili. Syötä vuosikulutukset soluihin **K7** (sähkö, kWh/v) ja **L7** (lämpö, kWh/v). Tämä skaalaa esimerkin kulutustasoa. Se ei muuta profiilin tuntijakaumaa vastaamaan tilan todellista toimintaa.

Jos käytössä on oma tuntidata, liitä sähkönkulutus välilehden **Oma kulutusdata** sarakkeeseen E ja lämmöntarve sarakkeeseen F riviltä 2 alkaen. Käytä **Liitä määräten → Arvot** ja valitse D4 = **Oma data**. Molemmat sarjat ovat tuntienergioita yksikössä kWh. Jos lähtötietona on polttoaineen määrä, muunna se ensin polttoaine-energiaksi ja edelleen hyötysuhteella toimitetuksi lämmöksi. Pelkkää polttoaineen massaa tai tilavuutta ei voi syöttää lämmöntarpeena.

Kaikissa sarjoissa on oltava **8 760 tuntia samassa kiinteässä EET-ajassa (UTC+2)**. Aikajärjestys alkaa 1.1. klo 00–01 ja päättyy 31.12. klo 23–24. Kesäaikasiirtymää ei käytetä ja karkausvuoden 29.2. poistetaan. Muunna paikalliseen kellonaikaan tallennettu data ennen liittämistä, jotta kesäajan puuttuva ja toistuva tunti eivät siirrä sarjoja. Varttien kulutusenergiat summataan tunneiksi; varttihinnat keskiarvoistetaan. Tarkista puuttuvat havainnot ja erottele todellinen nollakulutus puuttuvasta tiedosta.

### Sähkön ja lämmön hinnat

Kiinteällä hinnoittelulla syötä Ohjauspaneelin **C22–C23**-soluihin sähkön osto- ja myyntihinnat yksikössä c/kWh. Ostohinta sisältää energian, siirron ja sähköveron. Syötä mahdollinen tehomaksu erikseen soluun **K30** yksikössä €/kW/kk.

Pörssihinnoittelulla hanki Suomen alueen hintasarja ja muunna se laskurin aikakantaan. Suorat CSV- ja JSON-lataukset sekä käyttöehdot ovat ohjeessa [Pörssihintojen lataaminen](PORSSIHINNAT.md). Hintojen muunnosskriptin tuloksesta kopioidaan vain `hinta_eur_mwh`-sarakkeen 8 760 riviä välilehdelle **Hintahistoria** vuoden sarakkeeseen (C = 2023 … F = 2026) riviltä 2 alkaen. Yksikkö on **€/MWh, alv 0 %**. Valitse Ohjauspaneelin **K22 = Pörssihinta**, **K49** = vuosi tai keskiarvo ja syötä **K23**-soluun siirto, sähkövero ja myyjän marginaali yhteensä yksikössä c/kWh. Tarkista, ettet sisällytä samoja maksuja kahteen kertaan.

Syötä lämmön hinta ja kattilan hyötysuhde soluihin **C24–C26**. Valitse **K62**-solussa, kuvaako hinta polttoainetta vai toimitettua lämpöä. Toimitetun lämmön sopimushintaa ei jaeta uudelleen kattilan hyötysuhteella.

## Rakenna vertailtavat vaihtoehdot

Valitse tuotantosuunta **D4**-solussa ja nykyinen päälämmitys **D5**-solussa. Tarkista kattilan teho ja tilan huippulämmöntarve. Syötä laitteiden käytössäolovalinnat, koot ja hinnat riveillä **9–15** (rivi 15 = CHP). Korvaa esimerkkihinnat tarjoustiedoilla. Syötä korko ja tarkasteluaika soluihin **C27–C28**.

Tarkista myös **Vuosikassavirta**-välilehden laitekohtaiset tukikelpoiset kustannukset ja tukiosuudet **P3:Q8**. Laskurin tukioletus ei tarkoita, että kohde olisi tukikelpoinen tai että tuki myönnetään. Vertaa vaihtoehtoja tarvittaessa sekä tuen kanssa että ilman tukea.

| Vaihtoehto | Mitä sillä selvitetään? |
|---|---|
| Nykyinen järjestelmä | Lähtötilanteen energia, kustannukset ja lämmön riittävyys |
| Nykyinen järjestelmä + PV | Aurinkosähkön omakäytön ja myynnin arvo |
| Edellinen + akku | Akun lisähyöty suhteessa lisäinvestointiin |
| Edellinen + lämpöpumppu | Sähkön ja nykyisen lämmön hintasuhteen sekä COP:n vaikutus |
| Edellinen + sähkökattila/varaaja | Lämpövarastoinnin ja ylijäämäsähkön hyödyntäminen |
| Edellinen + CHP | Sähköntuotannon arvo lisäpolttoaineen, investoinnin ja ylläpidon jälkeen |

Taulukko on esimerkki vertailujärjestyksestä. Tee myös muita yhdistelmiä: laitteiden yhteiskäyttö voi muuttaa yksittäisen laitteen arvoa. Makroversion **Optimointi**-välilehti tekee saman järjestelmällisesti annetuilla ehdokasarvoilla (koordinaattihaku). Tarkista haun jälkeen hakuloki ja lähiarvot; haku ei takaa parasta mahdollista yhdistelmää.

CHP-tarkastelussa (rivi 15) sähkön osuus päälämmön tuotosta, €/kWe-hinta, ylläpito ja käyttöikä (**K65–K67**) ovat omia oletuksia. Korvaa ne laitetoimittajan tiedoilla ennen johtopäätöksiä.

Akun ohjaus valitaan **K26**-solussa. *Vain PV-ylijäämä* hyödyntää aurinkosähkön ylijäämää. *Pörssiohjattu* sallii lisäksi verkkolatauksen valittuina edullisina tunteina ja purun kalliina tunteina. Jälkimmäinen edellyttää pörssihintoja. Ohjaus on sääntöpohjainen, eikä se takaa pienintä mahdollista sähkölaskua.

Lämpöpumpun COP-parametrit, pakkasraja ja käytettävissä oleva teho ovat kalibroitavia lähtöarvoja (**K55–K60**). Sovita ne laitteen, lämmönjaon lämpötilan ja käyttöolosuhteiden tietoihin. Tarkista varaajan häviö ja purkuteho (**K51–K52**) sekä mahdollinen sähkökattilan verkkolataus (**K53**).

Reservimarkkinatarkastelu tehdään **Reservimarkkina**-välilehdellä. Akku tarjoaa purkutehonsa FCR-D ylös- ja lataustehonsa FCR-D alas -reserviin. Oletusskenaario *Viimeiset 12 kk* käyttää toteutuneita tuntihintoja; *Kyllästynyt markkina* käyttää Fingridin vuoden 2026 vuosimarkkinahintoja ja olettaa hintojen laskevan 10 % vuodessa. Tarkista aggregaattorin osuus (**C10**) ja vähimmäispalkkio (**C39**); pienellä akulla palkkio voi viedä tuoton. Tee vertailu myös ilman reservituloa. Historiallinen keskiarvo ei ennusta tulevaa tuottoa, koska vuodet 2021–2025 ovat ajalta ennen akkujen tuomaa kyllästymistä. FCR-N, aFRR, mFRR ja FFR on rajattu pois; perustelut ovat välilehden tuotetaulukossa. Käytännön osallistuminen edellyttää erillistä teknisten ja kaupallisten ehtojen selvittämistä.

Excelin rinnalla on selainversio [web/index.html](../web/index.html), jossa on sama laskenta ja kokoonpanon optimointi ilman makroja. Selainversiossa tilan oma kulutusprofiili tehdään Rakennushaulla (kohta 1, *Hae tila Rakennushaulla*): rakennukset kartalta, kulutus laskuilta tai mittareilta ja saman vuoden sää ja pörssihinnat siirtyvät laskentaan yhdellä painalluksella. Excelissä sama aineisto tuodaan Rakennushaun CSV-tiedostona.

## Lue tuloksia tässä järjestyksessä

1. **Tarkista datan ja lämmön riittävyys.** Ohjauspaneelin **K14** kertoo vertailun estävistä puutteista. Lämmitysvaje näkyy soluissa **K13/L13**. Täysi vuosikulutus ei yksin osoita, että tuntihuiput voidaan kattaa.
2. **Tarkista energiatase.** Katso verkko-ostot, PV:n omakäyttö, myynti, akun lataus/purku ja lämmöntuotanto. Selvitä poikkeavat kuukaudet Kuukausikoonti-välilehdeltä ja tarvittaessa Tuntitase_8760h-välilehdeltä.
3. **Tarkista kassavirta ja uusimiset.** Vuotuinen kassasäästö **E51** sisältää ylläpidon. **E54** on nettonykyarvo, jossa ovat mukana mallinnetut akun, invertterin ja CHP:n uusimiset. **E55** on erillinen vertailu ilman ylläpitoa ja uusimisia. Käytä varsinaisessa vertailussa oletuksiltaan samoja tuloksia.
4. **Arvioi laitteen lisäarvo.** Tallenna NPV ilman tarkasteltavaa laitetta ja sen kanssa. Laske erotus: `lisä-NPV = NPV laitteen kanssa − NPV ilman laitetta`. Positiivinen kokonais-NPV ei vielä osoita, että jokainen mukana oleva laite kannattaa.
5. **Testaa herkkyys.** Muuta sähkön ja lämmön hintoja, investointikustannusta, korkoa, käyttöikää, COP:ta ja reservituloa yksi kerrallaan. Käytä myös epäedullisia yhdistelmiä ja kirjaa, milloin johtopäätös muuttuu.
6. **Raportoi päästöt rajauksineen.** Pidä käyttövaiheen päästöt, valmistusarvio ja sähkön vaikutusskenaario erillään. Niiden summa ei ole laskurin tuottama elinkaaritulos.

Tallenna vertailun yhteyteen laskurin versio, lähtötietojen lähteet ja vuodet, käytetyt laitekoot ja hinnat, ohjaustavat, tuki, korko ja tarkasteluaika. Näin tulos on myöhemmin toistettavissa.

## Nykyisen version keskeiset rajat

- Laskenta käyttää yhden tunnin aika-askelta. Se ei kuvaa varttien sisäistä joustoa, sähkön laatua tai laitteiden nopeaa säätöä.
- Talouslaskenta toistaa yhden tuntivuoden toimintaa. Se ei ennusta tulevia hintoja tai säätä eikä sisällä aurinkopaneelien asteittaista ikääntymistä, täyttä veromallia tai rahoituslaskelmaa.
- Esimerkkikulutus on synteettistä. Sää- ja PV-referenssin täydellinen alkuperäketju ei ole tiedossa. Paikallisen tuotannon arvio edellyttää sijainnin, suuntauksen ja varjostuksen huomioimista.
- Lämpöpumpun ja kattilan toimintaa yksinkertaistetaan. Menoveden lämpötila, sulatukset, osakuorma ja käynnistykset eivät sisälly malliin yksityiskohtaisina laitemalleina.
- Akku ja reservi sisältävät käyttäjän oletuksia käyttöiästä, aktivointienergiasta ja saatavuudesta. Laskenta ei korvaa akun tai reservitoimittajan teknistä hyväksyntää.
- CHP on sähköosuusmalli: sähkö = osuus × päälämmön tuotto ja lisäpolttoaine kattilan hyötysuhteella. Laitekohtaisia hyötysuhteita, minimikuormaa tai käynnistyksiä ei mallinneta.
- Kokoonpanon optimointi on koordinaattihaku käyttäjän antamasta ruudukosta, ei globaali optimi. Ohjaussäännöt ja hinnat pysyvät haun aikana samoina.
- Pythonin MILP-optimointi käyttää horisontilla ennakkotietoa. Sen ohjaus ja varaajahäviömalli eroavat Excelin sääntöohjauksesta. Tulos ei ole suoraan käytännössä saavutettava tai koko vuoden globaali optimi.

Yhtälöt ja rajaukset: [MENETELMA.md](MENETELMA.md). Lähteiden ja oletusten tila: [LAHTEET.md](LAHTEET.md). Tehdyt tarkistukset ja niiden rajat: [TESTAUS.md](TESTAUS.md).

## Avoin lisenssi ja uudelleenkäyttö

Projektin nykyinen lisenssijako on seuraava:

| Aineisto | Lisenssi tai käyttöehdot |
|---|---|
| Excel-laskuri, dokumentaatio ja `data/esimerkkiprofiilit.csv` | [CC BY 4.0](../LICENSE) |
| Python-koodi kansioissa `malli/` ja `scripts/` | [MIT](../LICENSE-CODE) |
| `data/fingrid_*.csv` | Fingrid Oyj, CC BY 4.0; lähdeviite säilytetään |
| Käyttäjän hankkima pörssihinta-, sää- tai muu ulkoinen aineisto | Aineiston omat oikeudet ja käyttöehdot |

CC BY 4.0 sallii materiaalin kopioinnin, jakamisen ja muokkaamisen myös kaupallisesti. Mainitse tekijät ja lähde, linkitä lisenssi ja ilmoita tehdyistä muutoksista. Säilytä mukana toimitetut tarpeelliset tekijä-, lisenssi- ja muutosmerkinnät. Lisenssin sallimaa käyttöä ei saa rajoittaa lisäehdoilla tai teknisillä estoilla. Ehtojen ensisijainen lähde on [Creative Commonsin lisenssisivu](https://creativecommons.org/licenses/by/4.0/) ja sen varsinainen lisenssiteksti.

MIT sallii koodin käytön, muokkaamisen ja jakamisen myös kaupallisesti. Säilytä tekijänoikeus- ja lisenssiteksti koodin kopioissa tai olennaisissa osissa. Tarkat ehdot ovat [LICENSE-CODE](../LICENSE-CODE)-tiedostossa ja [MIT-lisenssin tekstissä](https://opensource.org/license/mit).

Laskurin avoin lisenssi ei muuta ulkoisen datan ehtoja. Esimerkiksi ladatun pörssihintasarjan käyttöön tai edelleenjakeluun voi liittyä rajoituksia. Älä sisällytä omaan julkiseen versioon aineistoa, jonka jakamisoikeutta ei ole varmistettu. Laskuri ja koodi toimitetaan ilman takuuta lisenssien mukaisesti.

Lähdeviitteen voi muodostaa näin:

> Karirinne, S. & Jääskeläinen, M. (2026). Maatilan hybridienergialaskuri, versio 0.11.0. EIP CHP Energiaälykäs eteläpohjalainen maatila -hanke, Seinäjoen ammattikorkeakoulu. https://github.com/joriim/EIP-CHP-Maatilan-hybridienergialaskuri. Laskuri ja dokumentaatio: CC BY 4.0. Python-koodi: MIT.

Lisää muokattuun versioon tieto omista muutoksistasi ja niiden päivämäärästä. Koneellisesti luettava viittaus on tiedostossa [CITATION.cff](../CITATION.cff).

## Miten laskuria voi kehittää edelleen?

Kehittämiseen voi osallistua raportoimalla virheen, selkeyttämällä ohjetta, ehdottamalla uutta toimintoa tai tekemällä koodin tai kaavojen muutosehdotuksen. Ensimmäiseksi kannattaa parantaa laskennan toistettavuutta ja lähtötietojen laatua. Uusien ominaisuuksien hyöty voidaan sen jälkeen osoittaa luotettavammin.

Seuraavat kohteet ovat ehdotettu kehitysjärjestys. Ne eivät ole nykyversion ominaisuuksia tai luvattu julkaisuaikataulu.

| Järjestys | Kehityskohde | Konkreettinen toteutus | Miten valmistuminen osoitetaan? |
|---|---|---|---|
| 1 | Datan alkuperä ja tuonti | Toistettava sää-/PV-aineiston muodostus, lähde-, vuosi-, sijainti- ja lisenssitiedot sekä puuttuvien/duplikaattituntien tarkistus | Sama aineisto voidaan tuottaa uudelleen; aikakanta, yksiköt ja jakamisoikeudet on dokumentoitu. |
| 2 | Excelin ja Pythonin vastaavuus | Pienet tunnetun tuloksen tapaukset ja vuositaseiden vertailu samoilla oletuksilla | Energia säilyy, teho-/varastorajat pitävät ja erot laskentaversioiden välillä on selitetty. |
| 3 | Oikeiden tilojen validointi | Anonymisoidut mittaussarjat ja kalibrointi tuotantosuunnittain | Virheet raportoidaan kuukausi- ja tuntitasolla myös erillisellä aineistolla, jota ei käytetty kalibrointiin. |
| 4 | Laitemallien tarkennus | Menovedestä ja ulkolämpötilasta riippuva COP, osakuormat, akun ikääntyminen ja varaajan lämpötilatasot | Tulokset verrataan laitetietoihin tai mittauksiin; jokaiselle lisäoletukselle on lähde ja herkkyystarkastelu. |
| 5 | Ohjauksen realistisuus | Ennustevirheet, hinnan saatavuus, reservin sopimuskulut ja hyväksymisrajat | Ennakkotiedolla saatava vertailu erotetaan käytännössä toteutettavasta ohjauksesta. |
| 6 | Varttitason malli | 15 minuutin kulutus, tuotanto, hinnat ja yhtenäinen tehon/energian käsittely | Energian ja maksujen laskenta testataan eri aika-askelilla; pelkkää tuntihinnan toistoa neljästi ei tulkita lisätiedoksi. |
| 7 | Monivuotisuus ja epävarmuus | Useita sää-/hintavuosia, ikääntyminen ja herkkyysajojen automatisointi | Yhden NPV-luvun rinnalla esitetään oletusten vaikutus ja vaihtoehtojen järjestyksen vaihtuminen. |
| 8 | Saavutettavuus ja uudet käyttötavat | Selkeämpi syöttönäkymä, tuontityökalu tai yhteiseen laskentaytimeen perustuva verkkosovellus | Uusi käyttöliittymä läpäisee samat laskentatapaukset; lähteet, versio ja oletukset näkyvät käyttäjälle. |

Päästölaskentaa voi kehittää yhtenäiseksi elinkaarivertailuksi, kun sähkölle, polttoaineille ja laitteille on yhteensopivat aineistot ja järjestelmärajat. Nykyistä CHP-sähköosuusmallia voi tarkentaa laitekohtaisella sähköhyötysuhteella, minimikuormalla ja käyntiajoilla. Biokaasuprosessin lisääminen vaatii oman sähkö-/lämpötaseensa, hyötysuhteensa, polttoainevirtansa ja käyttökustannuksensa. Näitä laajennuksia ei tule toteuttaa pelkkänä uutena käyttöliittymävalintana.

## Käytännön ohje kehittäjälle

1. Avaa ensin GitHub Issue, jos muutos vaikuttaa mallin rajaukseen, tiedostomuotoon tai tulosten tulkintaan. Kuvaa ongelma ja pieni esimerkki siitä.
2. Tee repositoriosta oma kopio (**fork**), kloonaa se ja luo muutokselle oma haara. Pidä muutos rajattuna yhteen kokonaisuuteen.
3. Päivitä laskentamuutos samassa muutoksessa Exceliin, selainversion malliin (web/malli.js) ja Python-sääntömalliin; versiot ovat tasavertaiset. Aja sen jälkeen `python malli/vie_vertailu.py laskuri/Maatilan_hybridienergialaskuri.xlsm` ja `node web/testi.js`. Tee kaavamuutos .xlsm-tiedostoon ja muodosta .xlsx siitä (`python scripts/tee_xlsx.py laskuri/Maatilan_hybridienergialaskuri.xlsm laskuri/Maatilan_hybridienergialaskuri.xlsx`), jotta tiedostot pysyvät samoina. Makron lähdekoodi on tiedostossa `laskuri/Optimointi.bas`; pidä se ja työkirjan moduuli samoina. Jos mallit tarkoituksella eroavat, dokumentoi ero. Excelin kaava on osa laskennan lähdettä, vaikka se tallentuu binääritiedostoon.
4. Lisää laskentalogiikan korjaukselle testi, joka epäonnistuu vanhalla toiminnalla ja läpäisee korjatun toiminnan. Esitä Excel-muutoksesta muuttuneet välilehdet, solualueet, kaavat ja tulosero, jotta muutos on katselmoitavissa.
5. Päivitä [muutosloki](../CHANGELOG.md), menetelmä, lähteet ja käyttöohje siltä osin kuin muutos niitä koskee. Merkitse lähteelle organisaatio/tekijä, nimi, vuosi, URL, tarkistuspäivä, yksikkö ja käyttötapa. Erota lähdetieto omasta oletuksesta.
6. Avaa pull request alkuperäiseen projektiin. Kerro ongelma, ratkaisu, testit ja mahdollinen muutos oletustuloksiin. Julkiseen muutosehdotukseen ei liitetä tunnistettavia tilatietoja tai käyttöehdoiltaan rajoitettua dataa.

Excelin peruskäyttö ei edellytä Pythonia. Python-mallin kehittämiseen riippuvuudet on lueteltu tiedostossa `malli/requirements.txt`. Luo halutessasi ensin virtuaaliympäristö. Suorita projektin juuresta:

```sh
python -m pip install -r malli/requirements.txt
python -m unittest discover -s malli -p test_regressiot.py -v
python -m unittest discover -s scripts -p test_hintadata.py -v
python -m unittest discover -s scripts -p test_reservidata.py -v
python scripts/tarkista_xlsx_rakenne.py laskuri/Maatilan_hybridienergialaskuri.xlsx
python scripts/tarkista_xlsx_rakenne.py laskuri/Maatilan_hybridienergialaskuri.xlsm
python malli/test_excel.py laskuri/Maatilan_hybridienergialaskuri.xlsm
python malli/vertaa.py
node web/testi.js
python scripts/rakenna_web.py
```

Kaavamuutoksen jälkeen avaa työkirja myös Excelissä ja LibreOfficessa, laske uudelleen ja tarkista tallennettu tulos. Merkitse testiraporttiin sovellusten versiot ja se, jos jompaakumpaa ei ole voitu testata. Pelkkä ehjä tiedostorakenne ei osoita laskennan oikeellisuutta. Tulosten vertailussa käytetään etukäteen perusteltuja toleransseja.

Ennen uutta julkaisua varmista, että versionumero, muutosloki, ohjeet ja `CITATION.cff` vastaavat julkaistavaa sisältöä. Säilytä lisenssit ja lähdeviitteet jakelupaketissa. Julkaisuun kannattaa liittää tiivistelmä korjauksista, testatuista sovellusversioista ja tunnetuista rajoista. Lisäohje osallistumiseen: [CONTRIBUTING.md](../CONTRIBUTING.md).
