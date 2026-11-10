# Oman tilan rakennustiedot Rakennushaulla

Tämä ohje kertoo, miten tilan omista rakennuksista ja omista sähkö-, lämpö- ja polttoainetiedoista tuotetaan 8 760 tunnin kulutusprofiili Maatilan hybridienergialaskuriin. Rakennushaku avataan selainversion kohdasta 1 (*Hae tila Rakennushaulla*) tai erikseen osoitteesta https://joriim.github.io/EIP-CHP-Maatilan-hybridienergialaskuri/rakennushaku.html.

Menetelmät, oletukset ja lähteet: Rakennushaun ohjeen *Menetelmät, oletukset ja lähteet* -osio ja [MENETELMA.md](MENETELMA.md#rakennushaku).

**Käyttäjän vastuu.** Käyttäjä vastaa Rakennushakuun syöttämistään tiedoista: rakennusten aloista ja käytöstä, kulutustiedoista sekä polttoaineen määrästä, energiasisällöstä ja kattilan hyötysuhteesta. Laskurissa käyttäjä vastaa lisäksi investointi- ja käyttökustannuksista sekä siitä, mihin historialliseen tai skenaarioituun sähkön, lämmön tai polttoaineen hintaan tai hintaennusteeseen hän perustaa teknis-taloudellisen mallinnuksen tai ennusteen.

## Periaate lyhyesti

Rakennushaku tekee profiilin kahdesta osasta:

- **Muoto** tulee rakennusmallista: rakennusten ala, käyttötarkoitus ja tarkasteluvuoden ulkolämpötila tunneittain.
- **Taso** tulee tilan omista kulutustiedoista: sähkömittarit, lämmityslaskut ja polttoaineen käyttö.

Mitä tarkempi kulutustieto, sitä vähemmän tulos nojaa mallin oletuksiin. Ilman kulutustietoa tulos on mallin oletus eikä kuvaa tilaa.

| Kulutustieto | Mitä se ratkaisee |
|---|---|
| Tuntitiedosto (esim. Datahub) | Kaikki mitatut tunnit sellaisenaan. Paras vaihtoehto sähkölle. |
| Kuukausisummat (vähintään 3 kk) | Vuoden taso ja kesän ja talven suhde. Hyvä vaihtoehto lämmölle. |
| Vuosisumma | Vain vuoden taso. Kesän ja talven suhde ja huipputeho tulevat mallista. |
| Ei tietoa | Ei mitään. Käytä vain ensimmäiseen hahmotelmaan. |

## 1. Kerää tiedot ennen aloitusta

Valitse **tarkasteluvuosi** ensin: kaikkien tietojen pitää olla samalta kalenterivuodelta. Käytä päättynyttä vuotta, koska kuluvan vuoden säätiedot ovat vajaat.

| Tieto | Mistä | Huomio |
|---|---|---|
| Kiinteistötunnus tai osoite | Kiinteistörekisteriote, verotuspäätös | Esim. 743-401-5-12 |
| MML API-avain | Maanmittauslaitoksen ilmainen avain (rekisteröityminen MML:n sivulla) | Tallentuu vain omaan selaimeen |
| Rakennusten lämmitetty ala ja käyttö | Rakennuslupa, piirustukset, tilan oma arvio | Maastotietokannassa ei ole kerrosalaa; korjaa arvio |
| Sähkö tunneittain | Datahub (oma.datahub.fi) tai verkkoyhtiön palvelu | Yksi tiedosto per sähkömittari (käyttöpaikka) |
| Polttoaine | Hakkeen, pelletin tai öljyn kulutus kattiloittain | Kulutus, ei ostot (ks. kohta 4.3) |
| Kaukolämpö | Kaukolämpölaskut, MWh | Kuukausilukemat, jos saatavilla |
| Lämpöpumpun tai sähkölämmityksen sähkö | Alamittari tai lämpöpumpun oma mittari | Jos ei ole, sähköosuus erotetaan sovitteella |
| Kattilan tai lämpöpumpun nimellisteho | Laitekilpi, käyttöohje | Valinnainen, mutta paljastaa liian piikikkään profiilin |
| Broilerierien aikataulu | Kasvatuskirjanpito | Ensimmäinen sisäänotto, erän ja tyhjän jakson pituus |

## 2. Hae tila (Rakennushaun kohta 1)

1. Valitse **Tarkasteluvuosi** ja anna **MML API-avain**.
2. Hae tila **kiinteistötunnuksella tai osoitteella**, tai valitse piste kartalta ja paina *Hae pisteen ympäriltä*.
3. Tarkista kartalta, että kiinteistön raja ja rakennukset ovat oikein. Naapurikiinteistöjen rakennukset näkyvät harmaina. Rakennus lasketaan tilalle, jos sen pohjan keskipiste on kiinteistöllä tai enintään 5 m rajan ulkopuolella.

Jos tilalla on useita kiinteistöjä tai rakennus puuttuu aineistosta, lisää se painikkeella *Lisää rakennus kartalle* (kohta 2). Käsin lisätyn rakennuksen ala on oletuksena 100 m²; korjaa se.

## 3. Valitse ja kuvaa rakennukset (kohta 2)

Rakennushaku ehdottaa valmiiksi asuinrakennukset ja vähintään 600 m²:n maatalousrakennukset. Käy jokainen rakennus läpi:

1. **Mukana laskennassa.** Valitse rakennukset, joita lämmitetään tai jotka kuluttavat sähköä samasta liittymästä. Kylmät varastot ja naapurien rakennukset jätetään pois.
2. **Lämpö ja sähkö, vain sähkö tai vain lämpö.**
   - *Vain sähkö*: lämmittämätön rakennus samassa liittymässä, esim. konehalli tai viljankuivurin sähkölaitteet. Muuten liittymän sähkö jakautuisi lämmitettyjen rakennusten profiilille.
   - *Vain lämpö*: rakennus, jonka lämpö tulee tilan kattilasta mutta sähkö toisesta liittymästä.
3. **Käyttö.** Valitse lähin käyttötyyppi: broilerikasvattamo, lihasikala, emakko- tai porsastuotanto, navetta, asuinrakennus, toimisto tai sosiaalitila, konehalli tai korjaamo, viljankuivuri tai muu lämmitetty tila. Käyttötyyppi määrää vuorokausi- ja vuosirytmin. *Tuotantorakennusten käyttö* -valinta asettaa kaikkien tuotantorakennusten oletuksen kerralla.
4. **Lämmitetty ala, m².** Lähtöarvo on pohjan ala × kerrokset. Korjaa se todelliseksi lämmitetyksi alaksi; esim. kaksikerroksisessa kasvattamossa vain toinen kerros voi olla lämmitetty.
5. **Broilerikasvattamon rytmi.** Anna ensimmäinen sisäänotto, kasvatuserän ja tyhjän jakson pituus sekä esilämmitys. Jos halleilla on eri sisäänottopäivät, anna jokaiselle oma päivä; samalla päivällä kaikkien hallien huiput osuvat päällekkäin.
6. **Tunnettu lämpö tai sähkö, MWh/v (valinnainen).** Jos rakennuksella on oma kattila tai alamittari, anna sen vuosikulutus. Rakennuksen profiili skaalataan siihen ja loppu jaetaan muille rakennuksille.

## 4. Anna kulutustiedot (kohta 3)

Kulutus annetaan **lämmitysjärjestelmittäin** ja **sähkömittareittain**, koska tieto tulee laskuilta ja mittareilta eikä rakennuksittain. Lisää yksi lämmitysjärjestelmä jokaista kattilaa, kaukolämpöliittymää tai lämpöpumppua kohti ja yksi sähkömittari jokaista sähköliittymää kohti. Kytke rakennukset oikeaan järjestelmään ja mittariin; kortin yläreunassa näkyy, mitkä rakennukset kuuluvat siihen.

Valitse jokaiselle kortille kulutustiedon tyyppi: *Ei tietoa*, *Vuosi*, *Kuukaudet* tai *Tuntitiedosto*.

### 4.1 Sähkö

1. Kirjaudu Datahubiin (oma.datahub.fi) ja lataa tarkasteluvuoden kulutus tunneittain tai varteittain CSV-tiedostona. Jokaisella käyttöpaikalla on oma tiedosto.
2. Valitse sähkömittarin kortilla *Tuntitiedosto* ja lataa tiedosto. Rakennushaku tunnistaa erottimen, desimaalipilkun, aika-askeleen (5–60 min) ja yksikön (Wh, kWh, MWh) ja summaa vartit tunneiksi.
3. Tarkista yhteenveto: tuntien määrä 8 760 ja vuoden summa samaa suuruusluokkaa kuin sähkölaskuissa. Puuttuvat tunnit täydennetään mallilla.

Jos tuntitiedostoa ei saa, anna kuukausisummat sähkölaskuilta. Pelkkä vuosisumma ei kerro kesän ja talven eroa.

Jäsennin on testattu Datahub-muotoisilla esimerkkitiedostoilla, mutta ei vielä aidolla Datahub-latauksella. Jos tiedosto ei lataudu, ilmoita siitä (ks. lopun palautekohta).

### 4.2 Lämmitystapa

Valitse lämmitysjärjestelmän kortilla **Lämmitystapa**. Se määrää, missä yksiköissä kulutus annetaan.

| Lämmitystapa | Kulutus annetaan | Huomio |
|---|---|---|
| Kattila (hake, pelletti, öljy) | i-m³ haketta, t pellettiä, l kevyttä polttoöljyä, MWh polttoainetta tai suoraan MWh/kWh lämpöä | Polttoaine muunnetaan lämmöksi kattilan hyötysuhteella |
| Kaukolämpö | MWh tai kWh lämpöä laskulta | Laskun lukema on jo lämpöä |
| Sähkölämmitys | Lämmityssähkö (alamittari) tai lämpö | Valitse, minkä mittarin kautta sähkö kulkee |
| Lämpöpumppu | Lämmityssähkö (alamittari) tai lämpö (lämpömittari) | Anna SCOP: maalämpö tyypillisesti 3–3,5, ilma-vesi 2,5–3 |

### 4.3 Polttoaineen kulutus lämmöksi

Laskuri tarvitsee **toimitetun lämmön**, ei polttoaineen energiaa. Rakennushaku laskee:

    lämpö (MWh) = polttoaineen määrä × energiasisältö × kattilan hyötysuhde

| Polttoaine | Oletusenergiasisältö | Muokattava |
|---|---|---|
| Hake | 0,8 MWh/i-m³ | Kyllä (*Hake, MWh/i-m³*) |
| Pelletti | 4,7 MWh/t | Ei; anna tarvittaessa MWh polttoainetta |
| Kevyt polttoöljy | 10 kWh/l | Ei; anna tarvittaessa MWh polttoainetta |
| Kattilan hyötysuhde | 0,85 | Kyllä |

**Esimerkki.** Tila poltti vuoden aikana 250 i-m³ haketta. Hake oli kuivahkoa, joten energiasisällöksi valitaan 0,85 MWh/i-m³. Kattilan hyötysuhde 0,85: lämpö = 250 × 0,85 × 0,85 ≈ 181 MWh.

Polttoaineen määrässä kannattaa huomata:

- **Kulutus, ei ostot.** Vuoden ostot eivät ole sama kuin vuoden poltto, jos varasto vaihtelee. Laske: varasto alussa + ostot − varasto lopussa.
- **Hakkeen kosteus.** Märän hakkeen energiasisältö kuutiota kohti on pienempi. Jos toimittaja ilmoittaa hakkeen energiana (MWh), käytä sitä ja valitse *MWh polttoainetta*.
- **Kuukausitieto on parempi kuin vuosi.** Jos siiloon täytettyjä kuormia tai kattilan lämpömäärämittarin lukemia on kirjattu kuukausittain, anna ne *Kuukaudet*-valinnalla.
- **Kattilan lämpömäärämittari.** Jos kattilassa on lämpömittari, anna sen lukema suoraan lämpönä (MWh). Silloin hyötysuhdetta tai energiasisältöä ei tarvita.
- **Vuosisumma.** Anna *Säästä riippumaton osuus, %*, jos tiedät, paljonko lämpöä kuluu kesällä (käyttövesi, pesut, porsastuotannon lämpö). Kesäkuukausien kulutus × 12 / vuosikulutus on hyvä arvio.

### 4.4 Sähkölämmitys ja lämpöpumppu

Lämpöpumpun ja sähkölämmityksen sähkö kulkee tilan sähkömittarin kautta. Laskuri laskee lämpöpumppujen sähkön itse, joten nykyinen lämmityssähkö pitää erottaa muusta sähköstä, ettei sitä lasketa kahteen kertaan.

- **Alamittari on olemassa:** anna lämmityssähkö lämmitysjärjestelmän kortille. Lämpö = lämmityssähkö × SCOP, ja lämmityssähkö vähennetään sähkömittarin kulutuksesta.
- **Alamittaria ei ole:** valitse lämmitysjärjestelmälle *Ei tietoa* ja anna sähkömittarille koko kulutus. Lämmitysosuus erotetaan sovitteella talvipainotteisen muodon perusteella. Tämä toimii kuukausi- tai tuntitiedolla; pelkällä vuosisummalla osuus tulee mallin oletuksista eikä ole luotettava.

SCOP on mallissa vakio koko vuoden. Ilma-vesilämpöpumpulla talven lämmityssähkö jää siksi todellista pienemmäksi.

### 4.5 Nimellisteho

Anna kattilan, lämpöpumpun tai kaukolämpöliittymän teho kenttään *Kattilan teho*, *Lämpöpumpun teho* tai *Liittymäteho*. Tulosnäkymä kertoo, kuinka monena tuntina profiilin lämpöteho ylittää sen. Monta ylitystuntia tarkoittaa yleensä, että ala, käyttötyyppi tai broilerien vaiheistus on väärin, koska todellinen kattila on kattanut tarpeen.

## 5. Säätiedot ja pörssihinnat (kohdat 4 ja 5)

1. **Säätiedot.** Valitse lähin Ilmatieteen laitoksen asema. Jos asemaa ei ole lähellä tai sen sarjassa on aukkoja, Open-Meteo antaa arvion suoraan tilan kohdalle ja paikkaa aukot. Oman lämpötilatiedoston (CSV) voi myös ladata.
2. **Pörssihinnat.** *Hae vuoden hinnat* hakee tarkasteluvuoden tuntihinnat (€/MWh, alv 0). *Hae kaikki laskurin vuodet* hakee vuodet 2023 alkaen laskurin hintavertailua varten.

## 6. Laske ja tarkista (kohta 6)

Paina **Laske tuntiprofiili** ja tarkista ennen siirtoa:

- [ ] **Vuoden summat** vastaavat laskuja ja mittareita.
- [ ] **Sovitteen hyvyys (CV(RMSE))** on kuukausitiedolla alle 15 % ja tuntitiedolla alle 30 %. Suurempi arvo kertoo, ettei malli selitä kulutusta hyvin; tarkista rakennusten käyttö ja kytkennät.
- [ ] **Ominaiskulutus kWh/m²** on rakennuksittain uskottava. Alle 20 tai yli 800 kWh/m² merkitään poikkeavaksi; yleensä syy on väärä ala tai käyttötyyppi.
- [ ] **Pysyvyyskäyrä**: lämmön huipputeho ei ylitä kattilan tehoa kuin harvoin.
- [ ] **Kuukausiprofiili** on järkevä: kesällä lämpöä vain käyttöveteen ja prosesseihin, kuivurin kulutus elo–lokakuussa.

Tallenna projekti (*Tallenna projekti*), niin voit palata siihen myöhemmin. *Uusi projekti* tyhjentää edellisen tilan tiedot.

## 7. Siirrä laskuriin

- **Selainversio:** paina *Siirrä laskuriin*. Laskuri ottaa käyttöön Oma data -profiilin, ulkolämpötilan ja hinnat, ja kohdan 1 alle tulee luettelo siirretyistä tiedoista. Tarkista sen jälkeen päälämmitys, polttoaineen hinta ja hinnoittelu.
- **Excel:** lataa `oma_kulutusdata_<vuosi>.csv` ja liitä sarakkeet A–G *Oma kulutusdata* -välilehdelle ja valitse D4 = Oma data. Pörssihinnat: `hintahistoria_2023-2026.csv` → *Hintahistoria*-välilehti. Tarkemmin: [KAYTTOOHJE.md](KAYTTOOHJE.md).

Viennin sähkösarake on **muu sähkö kuin lämmitys**. Nykyinen lämmityssähkö raportoidaan erikseen, koska laskuri laskee lämpöpumppujen ja sähkökattiloiden sähkön itse.

## 8. Yleisimmät virheet

| Oire | Todennäköinen syy | Korjaus |
|---|---|---|
| Lämmön huippu ylittää kattilan tehon monena tuntina | Liian suuri ala tai kaikki broilerihallit samassa vaiheessa | Korjaa ala; anna halleille todelliset sisäänottopäivät |
| Kesän lämpö on nolla tai talven huippu liian jyrkkä | Vain vuosisumma ilman säästä riippumatonta osuutta | Anna kuukausitiedot tai säästä riippumaton osuus |
| Sähkö kasaantuu asuinrakennukseen | Konehalli tai kuivuri puuttuu laskennasta | Ota rakennus mukaan *Vain sähkö* -valinnalla |
| Lämmityssähkö lasketaan kahteen kertaan | Lämpöpumpun tai sähkölämmityksen kortilla on väärä sähkömittari | Valitse kortille se mittari, jonka kautta lämmityssähkö kulkee |
| Lämmöntarve on liian suuri | Hakkeen ostot annettu kulutuksena, tai hyötysuhde unohtunut | Korjaa varastomuutoksella; tarkista energiasisältö ja hyötysuhde |
| Tiedosto ei lataudu tai tunteja puuttuu paljon | Eri vuosi tai tuntematon tiedostomuoto | Tarkista vuosi; lähetä tiedostomuoto palautteena |

## Palaute

Virheet ja parannusehdotukset: GitHubin [Issues](https://github.com/joriim/EIP-CHP-Maatilan-hybridienergialaskuri/issues). Älä liitä palautteeseen omaa kulutustiedostoa, kiinteistötunnusta tai muita tilan tunnistetietoja.

Suvi Karirinne ja Miiro Jääskeläinen, Seinäjoen ammattikorkeakoulu (SEAMK), Maatalous ja energia -tutkimusryhmä. EIP CHP Energiaälykäs eteläpohjalainen maatila -hanke, Euroopan unionin osarahoittama.
