# Oma polttopuu hakekattilan polttoaineena

Polttoainemoduuli (kevyt versio) arvioi, kuinka suuren osan hakekattilan polttoaineesta tila voi kattaa omalla polttopuulla (esim. harvennuspuu hakkeena), ja laskee oman puun ja ostohakkeen seokselle vuoden painotetun hinnan ja kattilan hyötysuhteen. Tulos syötetään laskurin kenttiin *Hakkeen hinta* (C24) ja *Kattilan hyötysuhde* (C26).

- Selainversio: kohta 4, painike **Laske oma polttopuu**. *Käytä laskurissa* vie arvot kenttiin.
- Excel: laske arvot selainversiossa tai Pythonilla ja kirjoita ne soluihin C24 ja C26.
- Python: `malli/polttoaine.py` (`laske(lampo, osto_hinta, osto_hyotysuhde, puu=…)`).

**Käyttäjän vastuu.** Käyttäjä vastaa puun määrästä ja kustannuksista.

## Laskenta

1. **Lämpöarvo saapumistilassa** (VTT Technology 258, kaava 2.5): q_ar = q_d × (1 − M/100) − 0,02443 × M [MJ/kg], missä q_d on tehollinen lämpöarvo kuiva-aineessa ja M kosteus painoprosentteina. MWh/t = q_ar / 3,6.
2. **Määrä.** Puu annetaan kiintokuutioina: 1 k-m³ painaa saapumistilassa kuivatuoretiheys / (1 − M/100) kiloa. Varastohävikki pienentää käytettävää määrää.
3. **Hinta.** Kustannus käyttöpaikalla (€/k-m³: korjuu, haketus, kuljetus ja puun oma arvo) jaetaan hävikin jälkeisellä energialla → €/MWh polttoainetta; jaettuna kattilan hyötysuhteella → €/MWh tuotettua lämpöä.
4. **Käyttö.** Oma puu käytetään, jos sen lämpö on ostohaketta halvempaa. Käyttöä rajoittaa saatavuus; loppu lämmöstä tuotetaan ostohakkeella.
5. **Tulos.** Seoksen hinta = kustannukset yhteensä / polttoaine-energia yhteensä (€/MWh). Seoksen hyötysuhde = tuotettu lämpö / polttoaine-energia. Näillä laskurin polttoainekustannus (lämpö / hyötysuhde × hinta) on sama kuin moduulin kokonaiskustannus.

Lämmöntarpeena käytetään laskurin tuntitaseen päälämmön tuotantoa (nykytila tai hybridi).

## Oletusarvot

| Suure | Oletus | Lähde |
|---|---|---|
| Lämpöarvo kuiva-aineessa | 19,2 MJ/kg | VTT T258 taul. 4.15: harvennusten kokopuuhake, mänty 19,6, kuusi 19,2, koivu 19,0 |
| Kosteus saapumistilassa | 50 p-% | VTT T258: tuore rankahake 50 |
| Kuivatuoretiheys | 400 kg/k-m³ | VTT T258 taul. 4.16: mänty 385, kuusi 400, koivu 475 |
| Kustannus käyttöpaikalla | 28 €/k-m³ | Oma oletus, ei lähdettä |
| Varastohävikki | 0 % | Oma oletus, ei lähdettä |
| Kattilan hyötysuhde omalla puulla | 0,85 | Oma oletus (= laskurin C26) |

Määrä on oletuksena nolla, jolloin tulos on pelkkä ostohake ja laskurin arvot eivät muutu. Oletuksilla puun energiasisältö on 1,86 MWh/k-m³ ja hinta 15,0 €/MWh polttoainetta.

## Rajaukset

- **Vuositase, ei varastomallia.** Moduuli ei tarkista kuukausittaista saatavuutta eikä varaston riittävyyttä.
- **Yksi hinta nykytilalle ja hybridille.** Laskuri käyttää samaa seoshintaa molemmissa. Hybridi vähentää ensin kalleinta polttoainetta (ostohake), joten keskihinnalla laskettu polttoainesäästö on todellista pienempi, kun oma puu ei kata koko tarvetta.
- **Hyötysuhde ei riipu kosteudesta.** Kosteus vaikuttaa lämpöarvoon, mutta hyötysuhde on käyttäjän antama vakio.
- **Päästökertoimet.** Moduuli ei muuta laskurin päästökertoimia.
- **Ei paikkatietohakua.** Metsäkuvioiden haku kartalta ei kuulu kevyeen versioon.
- **Vain puu.** Olki, vilja ja muut peltobiomassat eivät ole mukana.

## Testit

`python -m unittest discover -s malli -p test_polttoaine.py` ja `node web/testi_polttoaine.js`. Yhteiset tapaukset ovat tiedostossa `data/polttoaine_testitapaukset.json` (päivitys: `python malli/polttoaine.py --kirjoita-testit`); selain- ja Python-laskenta täsmäävät 7 tapauksessa.

## Lähde

Alakangas, E., Hurskainen, M., Laatikainen-Luntama, J. & Korhonen, J. 2016. Suomessa käytettävien polttoaineiden ominaisuuksia. VTT Technology 258. https://sarjaweb.vtt.fi/pdf/technology/2016/T258.pdf
