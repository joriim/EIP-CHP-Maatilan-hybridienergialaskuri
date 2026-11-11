# Oma polttopuu ja ostopolttoaine hakekattilalle

Polttoainemoduuli (kevyt versio) käsittelee hakekattilan kaksi polttoainetta erikseen: tilan **oman polttopuun** (esim. harvennuspuu hakkeena) ja **ostopolttoaineen** (ostohake). Kummallekin annetaan oma hinta ja omat ominaisuudet. Moduuli laskee, kuinka suuren osan lämmöstä oma puu kattaa, ja tuottaa seokselle vuoden painotetun hinnan, kattilan hyötysuhteen ja energiatiheyden. Tulos syötetään laskurin kenttiin *Hakkeen hinta* (C24), *Kattilan hyötysuhde* (C26) ja *Hakkeen energiatiheys* (K35).

- Selainversio: kohta 4, painike **Oma polttopuu ja ostopolttoaine**. *Käytä laskurissa* vie arvot kenttiin.
- Excel: laske arvot selainversiossa tai Pythonilla ja kirjoita ne soluihin C24, C26 ja K35.
- Python: `malli/polttoaine.py` (`laske(lampo, oma={…}, osto={…})`).

**Käyttäjän vastuu.** Käyttäjä vastaa määristä, hinnoista ja polttoaineiden ominaisuuksista.

## Lähtötiedot polttoaineittain

| Lähtötieto | Oma polttopuu | Ostopolttoaine |
|---|---|---|
| Saatavilla vuodessa | k-m³ | tarpeen mukaan |
| Hinta käyttöpaikalla | €/MWh, €/k-m³ tai €/i-m³ | €/MWh, €/k-m³ tai €/i-m³ |
| Kosteus saapumistilassa, p-% | kyllä | kyllä |
| Lämpöarvo kuiva-aineessa, MJ/kg | kyllä | kyllä |
| Kuivatuoretiheys, kg/k-m³ | kyllä | kyllä |
| Hakkeen tiiviys, k-m³/i-m³ | kyllä | kyllä |
| Varastohävikki, % | kyllä | kyllä |
| Kattilan hyötysuhde tällä polttoaineella | kyllä | kyllä |

Oman puun hinta on sen kustannus käyttöpaikalla: korjuu, haketus, kuljetus ja puun oma arvo.

## Laskenta

1. **Lämpöarvo saapumistilassa** (VTT Technology 258, kaava 2.5): q_ar = q_d × (1 − M/100) − 0,02443 × M [MJ/kg], missä q_d on tehollinen lämpöarvo kuiva-aineessa ja M kosteus painoprosentteina. MWh/t = q_ar / 3,6.
2. **Energiatiheys.** 1 k-m³ painaa saapumistilassa kuivatuoretiheys / (1 − M/100) kiloa, joten MWh/k-m³ = MWh/t × t/k-m³ ja MWh/i-m³ = MWh/k-m³ × tiiviys.
3. **Hinta.** Annettu hinta muunnetaan energiatiheydellä muotoon €/MWh polttoainetta ja jaetaan tekijällä (1 − hävikki), koska hävinnyt osa on maksettu mutta ei pala. Moduuli näyttää hinnan kaikissa kolmessa yksikössä. Tuotetun lämmön hinta = €/MWh polttoainetta / kattilan hyötysuhde.
4. **Käyttö.** Oma puu käytetään saatavuuden rajoissa, jos sen tuottama lämpö on ostopolttoainetta halvempaa. Loppu lämmöstä tuotetaan ostopolttoaineella.
5. **Seos.** Hinta = kustannukset yhteensä / polttoaine-energia (€/MWh). Hyötysuhde = tuotettu lämpö / polttoaine-energia. Energiatiheys = polttoaine-energia / poltettu tilavuus (MWh/i-m³). Näillä laskurin polttoainekustannus (lämpö / hyötysuhde × hinta) ja haketilavuus (polttoaine / energiatiheys) ovat samat kuin moduulin summat.

Lämmöntarpeena käytetään laskurin tuntitaseen päälämmön tuotantoa (nykytila tai hybridi).

## Oletusarvot

| Suure | Oma polttopuu | Ostopolttoaine | Lähde |
|---|---|---|---|
| Lämpöarvo kuiva-aineessa, MJ/kg | 19,2 | 19,2 | VTT T258 taul. 4.15: harvennusten kokopuuhake, mänty 19,6, kuusi 19,2, koivu 19,0 |
| Kosteus saapumistilassa, p-% | 50 | 40 | Oma puu: VTT T258, tuore rankahake 50. Ostohake: oma oletus, jolla energiatiheys vastaa laskurin oletusta 0,8 MWh/i-m³ |
| Kuivatuoretiheys, kg/k-m³ | 400 | 400 | VTT T258 taul. 4.16: mänty 385, kuusi 400, koivu 475 |
| Hakkeen tiiviys, k-m³/i-m³ | 0,40 | 0,40 | Oma oletus (yleinen muuntokerroin), tarkista toimittajalta |
| Hinta | 28 €/k-m³ | laskurin hakkeen hinta (16 €/MWh) | Oma oletus, ei lähdettä |
| Varastohävikki, % | 0 | 0 | Oma oletus, ei lähdettä |
| Kattilan hyötysuhde | 0,85 | laskurin C26 (0,85) | Oma oletus |

Oman puun määrä on oletuksena nolla, jolloin tulos on pelkkä ostopolttoaine. Oletuksilla oman puun energiasisältö on 1,86 MWh/k-m³ (0,74 MWh/i-m³) ja hinta 15,0 €/MWh; ostohakkeen energiasisältö on 1,95 MWh/k-m³ (0,78 MWh/i-m³).

## Rajaukset

- **Vuositase, ei varastomallia.** Moduuli ei tarkista kuukausittaista saatavuutta eikä varaston riittävyyttä.
- **Yksi hinta nykytilalle ja hybridille.** Laskuri käyttää samaa seoshintaa molemmissa. Hybridi vähentää ensin kalleinta polttoainetta (ostopolttoaine), joten keskihinnalla laskettu polttoainesäästö on todellista pienempi, kun oma puu ei kata koko tarvetta.
- **Hyötysuhde ei riipu kosteudesta.** Kosteus vaikuttaa lämpöarvoon, mutta hyötysuhde on käyttäjän antama vakio polttoaineittain.
- **Päästökertoimet.** Moduuli ei muuta laskurin päästökertoimia.
- **Ei paikkatietohakua.** Metsäkuvioiden haku kartalta ei kuulu kevyeen versioon.
- **Vain puu.** Olki, vilja ja muut peltobiomassat eivät ole mukana.

## Testit

`python -m unittest discover -s malli -p test_polttoaine.py` ja `node web/testi_polttoaine.js`. Yhteiset tapaukset ovat tiedostossa `data/polttoaine_testitapaukset.json` (päivitys: `python malli/polttoaine.py --kirjoita-testit`); selain- ja Python-laskenta täsmäävät 8 tapauksessa.

## Lähde

Alakangas, E., Hurskainen, M., Laatikainen-Luntama, J. & Korhonen, J. 2016. Suomessa käytettävien polttoaineiden ominaisuuksia. VTT Technology 258. https://sarjaweb.vtt.fi/pdf/technology/2016/T258.pdf
