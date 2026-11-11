# Oma polttoaine: harvennuspuu, olki ja pilaantunut vilja

Polttoainemoduuli (kevyt versio) arvioi, kuinka suuren osan hakekattilan polttoaineesta tila voi kattaa omalla harvennuspuulla, oljella ja pilaantuneella viljalla, ja laskee seokselle vuoden painotetun hinnan ja kattilan hyötysuhteen. Tulos syötetään laskurin kenttiin *Hakkeen hinta* (C24) ja *Kattilan hyötysuhde* (C26).

- Selainversio: kohta 4, painike **Laske oma polttoaine**. *Käytä laskurissa* vie arvot kenttiin.
- Excel: laske arvot selainversiossa tai Pythonilla ja kirjoita ne soluihin C24 ja C26.
- Python: `malli/polttoaine.py` (`laske(lampo, osto_hinta, osto_hyotysuhde, puu=…, olki=…, vilja=…)`).

**Käyttäjän vastuu.** Käyttäjä vastaa määristä ja kustannuksista sekä siitä, soveltuuko kattila oljen tai viljan polttoon ja täyttyvätkö päästö- ja lupavaatimukset. Moduuli ei arvioi kumpaakaan.

## Laskenta

1. **Lämpöarvo saapumistilassa** (VTT Technology 258, kaava 2.5): q_ar = q_d × (1 − M/100) − 0,02443 × M [MJ/kg], missä q_d on tehollinen lämpöarvo kuiva-aineessa ja M kosteus painoprosentteina. MWh/t = q_ar / 3,6.
2. **Määrä.** Harvennuspuu annetaan kiintokuutioina: 1 k-m³ painaa saapumistilassa kuivatuoretiheys / (1 − M/100) kiloa. Olki = korjuuala × korjattava olkisato. Vilja annetaan tonneina. Varastohävikki pienentää käytettävää määrää.
3. **Hinta.** Jakeen kustannus käyttöpaikalla (€/k-m³ tai €/t) jaetaan hävikin jälkeisellä energialla → €/MWh polttoainetta; jaettuna jakeen kattilahyötysuhteella → €/MWh tuotettua lämpöä.
4. **Käyttöjärjestys.** Jakeet käytetään halvimmasta alkaen lämmön hinnan mukaan. Kunkin jakeen käyttöä rajoittaa saatavuus ja enimmäisosuus kattilan tuottamasta lämmöstä. Ostohaketta kalliimpaa omaa jaetta ei käytetä. Loppu lämmöstä tuotetaan ostohakkeella.
5. **Tulos.** Seoksen hinta = kustannukset yhteensä / polttoaine-energia yhteensä (€/MWh). Seoksen hyötysuhde = tuotettu lämpö / polttoaine-energia. Näillä laskurin polttoainekustannus (lämpö / hyötysuhde × hinta) on sama kuin moduulin kokonaiskustannus.

Lämmöntarpeena käytetään laskurin tuntitaseen päälämmön tuotantoa (nykytila tai hybridi).

## Oletusarvot

| Suure | Harvennuspuu | Olki | Pilaantunut vilja | Lähde |
|---|---|---|---|---|
| Lämpöarvo kuiva-aineessa, MJ/kg | 19,2 | 17,4 | 17,5 | VTT T258: harvennusten kokopuuhake 19,0–19,6 (taul. 4.15); olki 16,7–17,8, keskiarvo 17,4 (taul. 7.3); viljatähteet 17,1–18,0 (taul. 7.10) |
| Kosteus saapumistilassa, p-% | 50 | 20 | 20 | VTT T258: tuore rankahake 50; oljen polttokosteus yleensä alle 20, korjuussa enintään 25. Viljan arvo on oma oletus. |
| Kuivatuoretiheys, kg/k-m³ | 400 | – | – | VTT T258 taul. 4.16: mänty 385, kuusi 400, koivu 475 |
| Kustannus käyttöpaikalla | 28 €/k-m³ | 45 €/t | 10 €/t | Oma oletus, ei lähdettä |
| Varastohävikki, % | 0 | 5 | 5 | Oma oletus, ei lähdettä |
| Korjattava olkisato, t/ha | – | 2 | – | Oma oletus, ei lähdettä |
| Enimmäisosuus lämmöstä, % | 100 | 20 | 10 | Oma oletus; oikea raja on kattilavalmistajan tieto |
| Kattilan hyötysuhde | 0,85 | 0,80 | 0,80 | Oma oletus (puu = laskurin C26) |

Määrät ovat oletuksena nolla, jolloin tulos on pelkkä ostohake ja laskurin arvot eivät muutu. Oletuksilla harvennuspuun energiasisältö on 1,86 MWh/k-m³ (15,0 €/MWh polttoainetta) ja oljen 3,73 MWh/t (12,7 €/MWh).

## Rajaukset

- **Vuositase, ei varastomallia.** Moduuli ei tarkista, riittääkö varasto olkea ja viljaa syksystä kevääseen, eikä kuukausittaista saatavuutta.
- **Yksi hinta nykytilalle ja hybridille.** Laskuri käyttää samaa seoshintaa molemmissa. Hybridi vähentää ensin kalleinta jaetta (ostohake), joten keskihinnalla laskettu polttoainesäästö on todellista pienempi, kun oma polttoaine ei kata koko tarvetta.
- **Kattilan soveltuvuus.** Oljen ja viljan tuhka sulaa puuta alemmassa lämpötilassa ja niissä on enemmän klooria ja kaliumia (VTT T258: oljen kloori keskimäärin 0,31 % ja kalium 0,99 % kuiva-aineessa; ohran ja kauran oljen tuhkan muodonmuutoslämpötila 735–765 °C). Kuonaantumista, korroosiota tai päästöjä ei mallinneta; enimmäisosuus on käyttäjän antama raja.
- **Hyötysuhde ei riipu kosteudesta.** Kosteus vaikuttaa lämpöarvoon, mutta jaekohtainen hyötysuhde on käyttäjän antama vakio.
- **Päästökertoimet.** Moduuli ei muuta laskurin päästökertoimia.
- **Ei paikkatietohakua.** Metsäkuvioiden ja peltolohkojen haku kartalta ei kuulu kevyeen versioon.

## Testit

`python -m unittest discover -s malli -p test_polttoaine.py` ja `node web/testi_polttoaine.js`. Yhteiset tapaukset ovat tiedostossa `data/polttoaine_testitapaukset.json` (päivitys: `python malli/polttoaine.py --kirjoita-testit`); selain- ja Python-laskenta täsmäävät 8 tapauksessa.

## Lähde

Alakangas, E., Hurskainen, M., Laatikainen-Luntama, J. & Korhonen, J. 2016. Suomessa käytettävien polttoaineiden ominaisuuksia. VTT Technology 258. https://sarjaweb.vtt.fi/pdf/technology/2016/T258.pdf
