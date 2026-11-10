# Lähteet, oletukset ja aineistojen alkuperä — 0.12.0

Tarkistuspäivä 21.10.2026; CHP- ja optimointioletukset lisätty 22.10.2026; reservimarkkinan lähteet 23.10.2026. Lähteen olemassaolo ja parametrin soveltuvuus ovat eri asioita. Alla erotetaan tarkistettu lähdetieto ja laskurin oma oletus.

| Tieto | Lähde ja paikannus | Käyttö ja rajoitus |
|---|---|---|
| FCR-D ylös tuntihinnat | [Fingrid avoin data 318](https://data.fingrid.fi/datasets/318), EUR/MW,h, 1 h | Oikea tuotteen hintasarja. Paketin CSV:tä ei ladattu uudelleen eikä jokaista havaintoa todennettu palvelusta. |
| FCR-D alas tuntihinnat | [Fingrid avoin data 283](https://data.fingrid.fi/datasets/283), EUR/MW,h, 1 h | Ladattu 31.10.2026 (21.4.2021–30.10.2026), muunnettu kiinteään EET-aikaan (`scripts/muunna_fingrid_reservi.py`). Vuoden 2021 hinnat ovat 0. Tallennettu `data/fingrid_fcr_d_alas_tuntihinnat.csv`, CC BY 4.0, lähde Fingrid Oyj. |
| FCR-vuosimarkkinan hinnat ja määrät 2024–2026 | [Fingrid: FCR-kaupat tunti- ja vuosimarkkinoilla](https://www.fingrid.fi/en/electricity-market-information/reserve-market-information/frequency-controlled-disturbance-reserve/) | 2026: FCR-D ylös 3,50 €/MW,h (237 MW), FCR-D alas 6,00 €/MW,h (163 MW), FCR-N ei hankintaa. Kyllästyneen markkinan skenaarion hintataso. Vuosisopimuksen hinta, ei tuntimarkkinan toteuma. |
| Reservimarkkinan muutokset 2026–2027 | [Fingrid: Tase- ja reservimarkkinapalvelun ajankohtaiswebinaari 9.3.2026](https://www.fingrid.fi/globalassets/dokumentit/fi/sahkomarkkinat/reservit/tase--ja-reservimarkkinapalvelun-ajankohtaiswebinaari-q1-26---fi.pdf) | Itsenäisen aggregoinnin ehdot aFRR/mFRR:lle käsittelyssä, MARI aikaisintaan 2027 Q1. Perustelee aFRR:n ja mFRR:n rajauksen. |
| Aggregaattorin palkkio ja kyllästyminen | [Enion, syksy 2026](https://www.enion.fi/artikkelit/tilannekatsaus-optimointeihin-ja-reservimarkkinoihin-syksyll-2026) | Esimerkki: vähimmäispalkkio 12 €/kk, asiakasosuus 20–55 %, noin 1 000 MW akkuja noin 400 MW:n tarpeeseen. Yhden yrityksen tiedote. |
| Kulutetun sähkön päästökerroin | [Fingrid avoin data 396](https://data.fingrid.fi/datasets/396), g CO2/kWh, 15 min | Suomessa kulutettu sähkö, tuonti/vienti mukana. Käyttövaiheen kerroin, ei koko elinkaaren CO2e. Paketin tuntikeskiarvoistus säilytetty. |
| Kotimaisen tuotannon kerroin 45 g/kWh | [Motiva: CO2-päästökertoimet](https://www.motiva.fi/tietopankki/energiankaytto-suomessa/co2-paastokertoimet/), sähkö, 2022–2024 keskiarvo | Kotimainen sähköntuotanto. Ei tuontia eikä elinkaaripäästöjä. Ei sama rajaus kuin Fingrid 396:ssa. |
| Sähkön vaikutusskenaarion vuosipisteet | [Sitowise/Motiva: Päästökerrointarkastelu, kesäkuu 2025](https://www.motiva.fi/wp-content/uploads/sites/2/2025/07/Vaikuttavuusarvioinnin-paastokerrointarkastelu-06-2025.pdf), PDF s. 37, taulukko 5 | 2023: 290; 2030: 155; 2035: 110; 2040: 80; 2045: 35; 2050: 0 g/kWh. Raportti koskee politiikkatoimien arviointia. Tilakohtainen soveltaminen on laskurin skenaario-oletus, ei havaittu marginaalivaikutus. |
| FCR-D:n energia ja energianhallintateho | [Fingrid: FCR-tuotekuvaus, 21.9.2023](https://www.fingrid.fi/globalassets/dokumentit/fi/sahkomarkkinat/reservit/tuotekuvaus-taajuuden-vakautusreservit-fcr.pdf), taulukko 1 | 1/3 h ylösenergia, 0,2 × kapasiteetin lataustehoreservi. Epävirallinen yleiskuva. Voimassa oleva sopimusliite ja aggregoidun kohteen hyväksyntä ratkaisevat osallistumiskelpoisuuden. |
| FCR-tuotteen vähimmäisaktivointi | [Fingrid: Sähköjärjestelmän reservit](https://www.fingrid.fi/sahkomarkkinat/reservit/sahkojarjestelman-reservit/) | FCR-D vähintään 20 minuuttia. Ei lähde oletetulle vuosittaiselle aktivointienergialle. |
| Investointituen menettelyt | [Ruokavirasto: Maatalouden investointituet](https://www.ruokavirasto.fi/tuet/maatalous/investoinnit/maatalouden-investointituet/) | Hyväksyttävät kustannukset ja tukiosuus tarkistettava laitekohtaisesti. 40 % ei ole laskurin takaama tukioikeus. Vanha toimittajablogi poistettu tukiehtojen perusteena. |
| PV:n elinkaaritutkimus | Louwen, A., van Sark, W.G.J.H.M., Faaij, A.P.C. & Schropp, R.E.I. (2016). [Nature Communications 7:13728](https://doi.org/10.1038/ncomms13728) | Vertaisarvioitu taustatutkimus. 700 kg/kWp säilytetään skenaario-oletuksena; nykyisen asennetun järjestelmän kerroin on varmennettava erikseen. |
| EPEAT 630 kg CO2e/kWp | [GEC: Photovoltaic modules and inverters — State of Sustainability Research, 5.3.2025](https://globalelectronicscouncil.org/wp-content/uploads/PVMI-SOSR-Draft-PC-2025.pdf), s. 28–29 ja liite | Julkisen kuulemisen luonnos. 630 on moduulin luokitteluraja, ei koko asennetun järjestelmän keskiarvo. |
| Metsäbiomassan toimitusketju | Metsäteho (2017), [CO2-eq-päästöt ja energiatehokkuus metsäbiomassojen toimitusketjuissa](https://www.metsateho.fi/wp-content/uploads/Tuloskalvosarja_2017_04a_Co2-eq-paastot_ja_energiatehokkuus_metsabiomassojen.pdf) | Taustalähde. Linkin sisältöä ei saatu tässä tarkistuksessa avattua. Laskurin kokonaiskerrointa 13 kg/MWh ei siten merkitä tämän raportin suoraksi tulokseksi. |
| ORC (40 kWe) | Valmistajan datasheet 2019 (40 kWe:n ORC-moduuli) | Lämmönlähde 70–120 °C, lämpöteho sisään 450–640 kWth, enintään 40 kWe brutto, jäähdytysvesi 0–60 °C. Ei nettotehoa, mitoitusolosuhteita eikä osakuormakäyriä. Rajat K70 ja K76 sekä D15 ovat datasheetista. |
| Päälämmityksen oletus | SEAMKin artikkeli [1000 sähköverkkoa turvaavaa CHP-tuorehakevoimalaa](https://lehti.seamk.fi/verkkolehti/1000-sahkoverkkoa-turvaavaa-chp-tuorehakevoimalaa/) (5.3.2025) | 500 kW:n tuorehakelämpölaitos (tuorehake, kosteus 35–40 %). Mallikohtaisia teknisiä tietoja ei käytetty; hyötysuhde 0,85 on laskurin oletus. |
| Rakennushaku | Jääskeläinen, M. & Karirinne, S. (2026). [Rakennushaku 0.6.0](https://github.com/joriim/eip-chp-rakennushaku), SEAMK, MIT. Menetelmät ja lähteet: docs/MENETELMAT_JA_LAHTEET.md | Selainversion kohta 1. Rakennukset (MML Maastotietokanta, CC BY 4.0), säätiedot (Ilmatieteen laitos, Open-Meteo, CC BY 4.0) ja pörssihinnat (Sähkötin; Nord Poolin data, ei-kaupallinen käyttö) haetaan käyttäjän selaimeen käytön aikana; niitä ei jaeta laskurin mukana. Rakennushaun oletusparametreja ei ole validoitu mitatuilla tiloilla. |
| Ratkaisija | Virtanen ym. (2020), [SciPy 1.0, Nature Methods 17, 261–272](https://doi.org/10.1038/s41592-019-0686-2); [SciPy milp](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.milp.html) | Ohjelmiston lähteet. Eivät validoi energiamallia tai oletuksia. |
| HiGHS | Huangfu & Hall (2018), [Mathematical Programming Computation 10, 119–142](https://doi.org/10.1007/s12532-017-0130-5) | Ratkaisijan algoritmitausta. |

## Laskurin omat oletukset

- COP = clip(3,2 + 0,07 × ulkolämpötila, 1,8, 4,8), pakkasraja −25 °C ja lämpötehon kerroin 1 ovat havainnollistavia oletuksia. Käyttäjän on kalibroitava ne menoveden lämpötilan, sulatusten ja laitteen tehotietojen mukaan. LTO tarvitsee oman kalibroinnin.
- Akun 15 vuoden kalenteri-ikä, 6 000 syklin kesto, 90 % hyötysuhde ja 0,5C ovat muokattavia oletuksia, eivät tietyn tuotteen takuuehtoja.
- Reservin odotettu aktivointi 0,01 h jokaista tarjontatuntia kohti, tavoite-SOC 50 %, saatavuus 95 %, tilan osuus 50 %, vähimmäispalkkio 12 €/kk ja kyllästyneen markkinan hintojen vuosimuutos −10 % ovat skenaarioita. Alas-aktivointienergian hinnoittelu ostohinnalla on varovainen oma oletus. Aktivointien todellinen ajallinen rakenne ja hinnoittelu eivät sisälly malliin.
- Varaajahäviö 100 W ja 300 kW purkuteho ovat oletuksia. Vesikapasiteetti 46,5 kWh/m³ = noin 1,163 kWh/(m³ K) × 40 K.
- Valmistuksen päästöt: PV 700 kg/kWp, akku 90 kg/kWh, LP 100 kg/kW ja varaaja 300 kg/m³ ovat skenaarioarvoja. Akun Forbes/Rapier-viitettä ei käytetä kertoimen varmennuksena. Korvaa arvot saman järjestelmärajauksen EPD/LCA-tiedoilla.
- Hake 13 ja biokaasu 15 kg CO2e/MWh polttoainetta ovat omia yhdistelmäarvioita. Biogeeninen CO2 esitetään erikseen; metsän hiilivaraston ja maankäytön muutoksia ei mallinneta.
- Sähkön vaikutuskertoimet interpoloidaan lineaarisesti lähdepisteiden välillä. Vuosien 2026–2045 keskiarvo on 116,642857 g/kWh. Vuodesta 2050 eteenpäin nolla on oma jatko-oletus.
- ORC: viiteolosuhde 110/25 °C, omakäyttö 10 %, höyrystimen 10 K ja lauhduttimen 12 K lämpötilaerot sekä Carnot-skaalaus ovat omia oletuksia. 3 000 €/kWe on SEAMKin artikkelin lisäinvestoinnin 3–5 €/W alaraja; ylläpito 15 €/MWh sähköä, käyttöikä 15 v ja uusiminen 80 % nykyhinnasta ovat omia oletuksia. Lisäpolttoaine lasketaan kattilan hyötysuhteella. Korvaa toimittajan tiedoilla.
- Kokoonpanon optimoinnin ehdokasarvot ovat esimerkkejä, eivät suositeltuja laitekokoja.
- Investointien hinnat, ylläpito 1 %, uusimiskerroin 60 %, korko ja tuki ovat käyttäjän syötteitä. Kaikki hinnat käsitellään samalla alv-perusteella; laskuri ei sisällä vero- tai rahoituskassavirtoja.

## Puuttuva alkuperätieto

Synteettisten kulutusprofiilien generaattoria tai validointiaineistoa ei toimitettu versiossa 0.9.0. Sää- ja PV-profiilien alkuperäinen lähtövuosi, havaintoasema, lähdepalvelu ja muunnoskoodi puuttuvat. Ilmoitettu alue Lapua/Kauhava ja 885 kWh/kWp vuosituotto eivät yksin riitä toistettavuuteen. Näitä ei ole korvattu keksityillä viitteillä.

Fingrid-CSV:t ja esimerkkiprofiilit on säilytetty muuttumattomina. Aikakanta on dokumentaation mukaan kiinteä EET (UTC+2), 8 760 tuntia; karkauspäivä poistetaan. Aineistojen täydellistä alkuperäketjua ei siten ole vielä validoitu. Eri vuoden sää, kulutus ja hinnat muodostavat herkkyysskenaarion, eivät toteutuneen vuoden jälkilaskentaa.

## Paketissa säilytettyjen aineistojen SHA-256

Tiivisteet todentavat toimitetun 0.9.0-aineiston säilymisen; ne eivät todenna lähdepalvelun havaintoja.

- `esimerkkiprofiilit.csv`: `450bc7168a73f663ef4bfb96bd6d994867cd1e773d087c397c4d9f79a78bb858`
- `fingrid_fcr_d_ylos_tuntihinnat.csv`: `f2a8c300a33382cfa103f1e7375ad7158261b3edfba170dbecca4119bc00d82a`
- `fingrid_paastokerroin_2025.csv`: `ee2b8f69b93677da447ead43f0ba825df076a410360911bee8b800b1f55997a3`

## Pörssisähkön latauslähteet

Suorat FI-aluehintojen CSV/JSON-lataukset, aikarajaukset ja lähdekohtaiset käyttöehdot: [PORSSIHINNAT.md](PORSSIHINNAT.md). Sähkötin, Elering ja Fraunhofer ISE Energy-Charts tarkistettu vuoden 2025 latauksilla 21.10.2026. Dataa ei jaeta paketin mukana: työkirjan Hintahistoria-välilehti on julkisessa versiossa tyhjä, ja käyttäjä liittää sinne itse hankkimansa hinnat.
