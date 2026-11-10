# Menetelmä 0.13.0

## Aika ja järjestelmäraja

8 760 yhden tunnin askelta kiinteällä EET-ajalla (UTC+2), ilman kesäaikasiirtymää. Tuntienergia kWh vastaa yhden tunnin keskitehoa kW. Karkauspäivä poistetaan. Varttihinnat aggregoidaan tunneiksi; varttien sisäinen jousto ei mallinnu. Sää, kulutus ja hinnat on kohdistettava samaan aikakantaan.

Laskuri arvioi olemassa olevan päälämmityksen rinnalle tehtäviä investointeja. Se ei mallinna biokaasun tuotantoprosessia. CHP on yksinkertaistettu lämpöohjattu ORC-malli (ks. CHP ja ORC), ei laitoksen prosessimalli. Lähteet ja oletusten tila: [LAHTEET.md](LAHTEET.md).

## Sähkö ja akku

PV-tuotanto = asennettu kWp × tuntireferenssi kWh/kWp. PV palvelee ensin kiinteistön perussähkökuormaa, sitten akkua, LP:tä, sähkökattilaa ja myyntiä. Akku purkaa vain perussähkökuormaan; LP:n ja vastuksen sähkölle ei ole erillistä akun ohjausta.

SOC on käytettävissä oleva AC-purkuenergia. Lataushyötysuhde on 0,9 ja purkuhyötysuhde 1, joten edestakainen hyötysuhde on 90 %. Teho on 0,5 kertaa kWh-kapasiteetti. Virrat rajataan tehoon ja varastoon ennen SOC-päivitystä:

`SOC_t = SOC_(t-1) + 0,9*(PV-lataus + verkkolataus + alas-aktivointi) − omakäyttöpurku − ylös-aktivointi`.

Pörssilataus edellyttää pörssihinnoittelua ja pörssiohjattua akkua. Tasahinnat järjestetään aikajärjestyksessä. Lataus sallitaan halvimmiksi valittuina tunteina, kun vähimmäishintaero ja ehto `0,9*(päivän maksimispot + ostolisä − kulumisarvio) > tunnin ostohinta` toteutuvat. Kulumisarvio ohjaa käyttöä; sitä ei vähennetä kassavirrasta uudelleen uusimiskulujen lisäksi.

Ohjaus on heuristiikka: maksimihintatunnin kulutusta tai tehomaksun tulevaa kasvua ei ennusteta. Lataus- ja purkutuntien summan tulee olla enintään 24. Tuntihinnat tulevat Hintahistoria-välilehdeltä K49-valinnan mukaan. Valitun vuoden puuttuva tunti korvataan syötettyjen vuosien saman tunnin keskiarvolla. Täyttö tasoittaa hintavaihtelua; kesken olevan vuoden tulos ei siksi ole toteutunut vuositulos. Jos tunnilta puuttuu hinta kaikilta vuosilta, kannattavuustulos estetään, vaikka tuntitaseessa käytetään kiinteää varahintaa.

## Lämpö

COP = min(COPmax, max(COPmin, a+b*T)). T on referenssivuoden ulkolämpötila tai, kun käytössä on oma data, Oma kulutusdata -välilehden sarakkeen G oma ulkolämpötila (puuttuvat tunnit referenssivuodesta). Aurinkosähkö käyttää aina referenssivuotta. Parametrit, pakkasraja ja lämpötehon kerroin ovat kalibroitavia oletuksia. IVLP ja LTO eivät ole samalla käyrällä validoituja. LP tuottaa lämpöä suoraan kuormaan, ei 85 °C varaajaan. Menoveden lämpötila ja sulatukset on sisällytettävä käyttäjän käyrään.

Taloudellinen ohjaus vertaa verkkosähkön hintaa/COP ja PV:n menetettyä nettomyyntihintaa/COP päälämmön muuttuvaan hintaan. Negatiivinen PV-nettomyyntihinta rajataan tässä vertailussa nollaan. Etusija-valinta käyttää LP:tä ensin hinnasta riippumatta. Koko vuoden tehomaksua tai kattilan käynnistyksiä ei optimoida.

Varaajan kapasiteetti = V × 46,5 kWh/m³ (vesi, ΔT 40 K). Häviö = min(edellinen varaus, K51 kWh/h). Purku rajataan jäljellä olevaan varaukseen, tarpeeseen ja K52-tehoon. Sähkökattila lataa PV-ylijäämällä. K53=Kyllä sallii lisäksi verkkolatauksen, kun sähkön muuttuva hinta alittaa päälämmön hinnan. Lataus rajataan kattilatehoon ja vapaaseen kapasiteettiin. Saman tunnin uutta latausta ei pureta kuormaan.

Päälämpö = min(kattilateho, jäljellä oleva lämmöntarve). Lähtötilanteessa on sama kattilateho. Molempien toimittamaton lämpö raportoidaan; vajaus estää kannattavuusvertailun. Osakuorma-, käynnistys- ja kattilan seisontahäviöitä ei mallinneta erikseen.

K62=Polttoaine: muuttuva lämpöhinta = polttoainehinta/(1000*hyötysuhde). K62=Toimitettu lämpö: lämpöhinta = sopimushinta/1000. Fyysisen polttoaineen ja päästöjen arvio käyttää kattilahyötysuhdetta; toimitetulle biokaasulämmölle se on erikseen varmistettava oletus.

## CHP ja ORC

Päälämmityksen oletus on tuorehakelämpökeskus, nimellislämpöteho 500 kW (D14). CHP kuvaa kattilan yhteyteen asennettavaa 40 kWe:n ORC-moduulia (valmistajan datasheet 2019, ks. LAHTEET.md): lämmönlähde 70–120 °C, lämpöteho sisään 450–640 kWth, enintään 40 kWe brutto, jäähdytysvesi 0–60 °C. Moduulikoko on valittu sopimaan 500 kW:n kattilaan.

Bruttosähköhyötysuhde viiteolosuhteessa (oletus menovesi 110 °C, paluu 25 °C) on D15 / K70 = 40 / 640 = 6,25 %. Muissa lämpötiloissa hyötysuhde skaalataan Carnot-kertoimella

    η = D15 / K70 × C(meno, paluu) / C(viitemeno, viitepaluu) × (1 − omakäyttö K75),   C = 1 − (paluu + 12 K) / (meno − 10 K)  [K]

jossa 10 K on höyrystimen ja 12 K lauhduttimen lämpötilaero (omat oletukset). Paluupiirin lämpötila K72 on tilan lämmitysverkon paluuvesi, joka jäähdyttää lauhduttimen: lattialämmitys noin 25–30 °C, patterit 40–50 °C. Oletuksilla (110/30 °C) nettohyötysuhde on 5,2 % ja nettoteho enintään 33,1 kWe. Datasheet ei kerro mitoitusolosuhteita eikä nettotehoa, joten viiteolosuhde ja omakäyttö ovat omia oletuksia.

ORC on lämpöohjattu: sähkö tunnilla t = K79 × Y_t, enintään K78, kun ORC:n lämpöteho Y_t × (1 + K79) on vähintään K76 (450 kWth, datasheetin alaraja) ja CHP ja päälämmitys ovat päällä eikä K62 = Toimitettu lämpö. Lauhdutusajoa (lämmön hukkaamista jäähdyttimeen) ei mallinneta. Siksi ORC ei käy tilalla, jonka lämmöntarve jää alle noin 430 kW (esim. esimerkkisikalan huippu 46 kW). Sähkö kattaa ensin tilan jäljellä olevan sähköntarpeen (perussähkö PV:n ja akun jälkeen sekä LP:n verkkosähkö); akun tai vastuksen verkkolataukseen sitä ei kohdisteta. Ylijäämä myydään tunnin myyntihinnalla; negatiivisella hinnalla myyntitulo on 0, jos K25 = Kyllä.

### Täystehoajo (K80–K97)

Kun K80 = Kyllä, ORC ajetaan valittuina kuukausina (K83:K94 = 1) täydellä teholla lämmöntarpeesta riippumatta. Tunnilla t kattila syöttää ORC:lle B = min(D14, K81) (oletus 500 kW); sähkö = min(K78, K77 × B) ja ORC:n lämpö ulos H = B − sähkö (Tuntitase BU). Lämpö jaetaan tunneittain:

1. tilan tarve L_t − lämpöpumppu S_t (lämpöpumppu kattaa vain osan max(0, L_t − H)),
2. varaajan lataus BV_t = min(ylijäämä, vapaa tila D12 × 46,5 − W_(t−1) + häviö) (varaajan purku X_t vain, jos tarve ylittää H:n),
3. jäähdytin BW_t = loput.

Päälämpö Y_t = H, joten polttoaine (D41) ja päästöt laskevat myös jäähdytetyn lämmön, joka on maksettu mutta hyödytön. Sähkökattila ei lataa varaajaa täystehotunteina. Täystehoajo edellyttää, että CHP ja päälämmitys ovat päällä, K62 ≠ Toimitettu lämpö, K77 > 0 ja B ≥ K76. Muina kuukausina ORC on lämpöohjattu.

Rajaukset: ORC:n hyötysuhde lasketaan samalla paluulämpötilalla K72 kuin lämpöohjatussa ajossa, vaikka jäähdyttimen lauhtumislämpötila voi poiketa siitä. Jäähdyttimen sähkönkulutusta, investointia tai tehorajaa ei mallinneta (omakäyttö K75 sisältää pumput ja jäähdytyksen), eikä varaajan latausteholle ole rajaa. Kattilan osakuorman hyötysuhde on vakio C26.

Lisäpolttoaine = CHP-sähkö / kattilan hyötysuhde C26. Malli olettaa siis, että sähkö syntyy samalla kokonaishyötysuhteella kuin lämpö eikä lämmöntuotanto muutu. Osakuorman hyötysuhteen muutos ja käynnistykset eivät mallinnu. Investointi = D15 × F15 (€/kWe brutto). Ylläpito = K65 €/MWh sähköä. Käyttöikä K66; jos se on lyhyempi kuin tarkasteluaika, laite uusitaan kerran hintaan K67 × investointi ja uusitun laitteen jäännösarvo hyvitetään (Vuosikassavirta T2:U7). Tukiosuus Vuosikassavirta rivi 8. Päästöissä lisäpolttoaine on mukana toimitusketjun ja biogeenisen CO2:n riveillä.

## Kokoonpanon optimointi

Optimointi-välilehden makro tekee koordinaattihaun: kukin laite (PV, LP, sähkökattila, varaaja, akku, CHP) käydään vuorollaan läpi käyttäjän ehdokasarvoilla muiden pysyessä paikallaan, ja paras arvo jätetään voimaan. Kierroksia tehdään, kunnes mikään vaihto ei paranna mittaria, enintään neljä. Jokainen kokoonpano lasketaan koko laskurilla, joten tulos on sama kuin käsin syötettynä. Lasketut kokoonpanot tallennetaan välimuistiin eikä niitä lasketa uudelleen. Vain tila K14 = OK hyväksytään. Haku löytää paikallisen parhaan annetusta ruudukosta; se ei takaa globaalia optimia, eikä se muuta ohjaussääntöjä tai hintoja.

## FCR-D ylös ja alas

Molemmat käyttötavat tarvitsevat energiakatteen. Reservi ensin lataa PV:stä ja verkosta tavoitevaraukseen; lataus on ostokuluissa. Rinnakkaiskäyttö käyttää omakäyttöpurun jälkeen jäävää varastoa. Tämän tunnin latausta ei lueta alkutunnin energiakatteeseen.

Ylös-tarjonta = saatavuus × max(0, min(Pmax − omakäyttöpurku, (alku-SOC − omakäyttöpurku)/(energiavaatimus + aktivointiaika), (Pmax − latausteho)/energianhallintakerroin)).

Alas-tarjonta = saatavuus × max(0, min(Pmax − latausteho, vapaa tila/(0,9 × (energiavaatimus + aktivointiaika)), (Pmax − omakäyttöpurku)/energianhallintakerroin)), jossa vapaa tila = kapasiteetti − alku-SOC − 0,9 × tämän tunnin lataus. Molemmat suunnat voidaan kytkeä erikseen pois (C36–C37). Sama teho tarjotaan kumpaankin suuntaan, koska suunnat aktivoituvat vastakkaisissa taajuustilanteissa; energianhallinnan tehoreservi lasketaan kummallekin erikseen. Tämä vastaa aggregaattorien kuvaamaa käytäntöä, mutta tarkista sopimuksen ehdot.

Odotettu aktivointienergia = tarjonta × C33. Ylös-aktivointi vähentää varausta ja myydään tunnin nettohinnalla. Alas-aktivointi ostetaan verkosta tunnin ostohinnalla ja lisää varausta hyötysuhteella 0,9 (varovainen oletus; todellinen energian tilitys riippuu aggregaattorin ja taseselvityksen ehdoista). Korvaava lataus, häviöt ja aktivointisyklit sisältyvät taseeseen.

Bruttotulo = Σ (ylös-tarjonta kW × ylös-hinta + alas-tarjonta kW × alas-hinta)/1000 €/MW,h. Tilan tuotto = max(0, brutto − max(brutto × (1 − tilan osuus C10), 12 × kiinteä kuukausipalkkio C39)). Palkkio lasketaan vuositasolla, vaikka aggregaattori laskuttaa kuukausittain.

Skenaariot: historialliset vuodet (ylös: Fingrid 318, mukana; alas: Fingrid 283, mukana 21.4.2021–30.10.2026), viimeiset 12 kk (24.9.2025 klo 23 – 24.9.2026 klo 22), kyllästynyt markkina (Fingridin vuosimarkkina 2026, vuosimuutos C42; alas-hinta 6,00 €/MW,h on yli kaksinkertainen tuntimarkkinan 2026 toteumaan 2,8 €/MW,h nähden), oma hinta ja keskiarvo 2021–2025. Jos valitulle skenaariolle puuttuu alas-hinta, kannattavuustulos estetään. Vuosimarkkinan hinta on sopimushinta koko vuodelle, ei tuntimarkkinan toteuma; sitä käytetään kyllästyneen markkinan tasona, koska vuoden 2026 tuntihinnat ovat olleet lähellä akkujen käyttökustannuksia. NPV:n vuosimuutos on valitun skenaarion mukainen (C43).

C33=0,01 h/h on oma herkkyysoletus, ei havaittu aktivointi. FCR-N, aFRR, mFRR ja FFR on rajattu pois: perustelut ovat Reservimarkkina-välilehden riveillä 48–55. Taajuushäiriöitä, hyväksymiskokeita, tasekuluja tai aggregaattorin energiasopimusta ei toisteta. Historiallisten skenaarioiden kapasiteettihinnat vaihdetaan saman ohjaustaseen päälle; aktivointienergian arvo käyttää käyttäjän sähkösopimusta. Vuoden 2026 osavuosi skaalattuna ei ole toteutunut vuosituotto eikä tulevan hinnan alaraja.

## Rakennushaku

Oman tilan tuntiprofiilit voi tuottaa Rakennushaulla (selainversion kohta 1). Rakennushaku mallintaa valittujen rakennusten lämmön ja sähkön tunneittain ulkolämpötilan mukaan ja kalibroi tason tilan vuosi-, kuukausi- tai tuntikulutukseen. Sen menetelmät, oletukset ja lähteet on kuvattu Rakennushaun dokumentissa *Menetelmät ja lähteet* (github.com/joriim/eip-chp-rakennushaku, docs/MENETELMAT_JA_LAHTEET.md).

Siirrossa laskuriin sähkösarja on muu sähkö kuin nykyinen lämmityssähkö, koska laskuri tuottaa lämmön omista lähteistään; lämmöntarve on toimitettua lämpöä. Ulkolämpötila korvaa esimerkkivuoden lämpöpumpun COP:ssa ja pakkasrajassa. Aurinkosähkön tuotto tulee edelleen esimerkkivuodesta. Lämmitysjärjestelmien tehojen summa asetetaan päälämmityksen tehoksi. Kattilan hyötysuhde ja hakkeen energiatiheys siirretään, kun tilalla on yksi kattila tai hakekattila. Pelletti-, öljy-, kaukolämpö-, sähkö- ja lämpöpumppulämmitystä laskuri ei mallinna lähtötilanteena; niistä annetaan huomautus.

## Kaksi toteutusta

Sama malli on toteutettu Excel-kaavoina, JavaScriptinä (web/malli.js) ja Pythonina (malli/sim.py, talous.py). Excel ja JavaScript ovat käyttäjän versioita; Python on riippumaton vertailumalli. Testit vertaavat tuntisarjoja (Excel–Python) sekä energia-, talous-, kuukausi-, vuosi- ja päästötuloksia (Excel–JavaScript). Muutos tehdään kaikkiin kolmeen samassa muutoksessa.

## Talous

Laitekohtaiset tukikelpoiset kustannukset ja tukiosuudet ovat Vuosikassavirta P3:Q8. Avustus rajataan laitteen bruttoinvestointiin. Oletus ei vahvista tuen myöntämistä.

Vuotuinen kassasäästö = energiasäästö + reservikapasiteettitulo − ylläpito. Sähkön myyntitulot sisältävät PV-myynnin ja reserviaktivointienergian. Yksinkertainen takaisinmaksu käyttää ylläpidon jälkeistä säästöä, mutta ei tulevien korvausten ajankohtia; NPV sisältää ne.

NPV = −nettoinvestointi − invertterivaihdon nykyarvo − akkuvaihtojen nykyarvo + uusitun akun jäännösarvon nykyarvo − CHP:n uusimisen nettonykyarvo + vuosikassavirtojen nykyarvo.

Ylläpito = (bruttoinvestointi − CHP-investointi) × K34 + CHP-sähkö MWh × K65.

Akun tekninen käyttöikä = min(kalenteri-ikä, syklikesto/vuosittaiset täydet purkusyklit), reserviaktivointi mukana. Vaihdot tehdään käyttöiän monikerroilla ennen tarkastelun loppua; myös murto-osavuodet käyvät. Uusitun akun jäännösarvo perustuu jäljellä olevaan käyttöikäosuuteen. Alkuperäisen akun ja muiden laitteiden jäännösarvoa ei huomioida. Invertterin vaihto vuonna 12 huomioidaan vain, jos vuosi kuuluu tarkasteluun.

Aikataulu kattaa 1–100 vuoden tarkastelun ja vähintään yhden vuoden akkukäyttöiän. Alle vuoden käyttöikä vaatii tiheämmän mallin. Vuosienergia toistaa yhden tuntivuoden; PV:n ikääntyminen, tuleva sää ja sähkön hinnat eivät ole ennusteessa. Korko ja kustannukset on asetettava johdonmukaisesti reaalisiksi tai nimellisiksi.

Lisäinvestointi arvioidaan saman mallin kahden ajon NPV-erona. `python malli/vertaa.py` toistaa oletusvertailun. Hyvä kokonais-NPV ei osoita jokaista laitetta kannattavaksi.

## Päästöt

- Ostosähkön käytönaikainen CO2 kotimaisen tuotannon kertoimella, ei tuontia.
- Ostosähkön käytönaikainen CO2 Fingridin kulutuksen tuntikertoimella, tuonti mukana.
- Lämmön toimitusketjun ja CH4/N2O:n oma arvio, biogeeninen CO2 erikseen.
- Laitteiden valmistuksen vuosiosuus erikseen. Akun hankintakerrat vastaavat teknistä käyttöikää.
- Vain sähkön vaikutusskenaario = netto-ostosähkö × vuosittaisten vaikutuskertoimien keskiarvo. PV- ja reserviaktivointienergian myynti hyvitetään. Kerroin on Motiva-taulukon oma sovellus, ei havaittu marginaalikerroin.

Valmistusta ei lisätä käytönaikaisiin kertoimiin yhteiseksi elinkaaritulokseksi. Täydellinen vertailu vaatii yhtenäiset elinkaariaineistot verkkosähkölle, polttoaineille ja laitteille. Käyttövaiheen päästölukuja ei ole ennustettu vuosittain aleneviksi.

## Optimointivertailu

lp2.py on rullaavan horisontin MILP. Suunnittelu oletetaan klo 15 kiinteää EET:tä. Hinnat, sää, kulutus ja reservihinnat tunnetaan horisontilla. Reservihintojen ennakkotieto on optimistinen vertailuoletus, ei tarjousstrategia. Kellonaika ja hintojen saatavuus on tarkistettava myös kesäajassa.

Osto/myynti ja lataus/purku suljetaan toisensa pois binäärirajoitteilla. PV-leikkaus ei ylitä PV-tuotantoa. Tehomaksu käyttää yhtä huippumuuttujaa kutakin horisontin kuukautta kohti, aiempi huippu huomioiden. Tulevaa loppukuuta ei ennusteta: tämä ei ole koko vuoden globaali optimi.

MILP:n varaajahäviö on suhteellinen, sama täyden varaajan häviö kuin sääntömallissa. Excel/sim käyttää vakiohäviötä niin kauan kuin energiaa on. MILP:n ohjaus ja lämpövaraston toiminta eroavat sääntömallista. Lämmitysvaje estää taloustuloksen käytön. Kulumisproksi raportoidaan kassakustannuksesta erillään. Vanhaa 55 % väitettä ei käytetä ilman yhteismitallista uudelleentestiä.
