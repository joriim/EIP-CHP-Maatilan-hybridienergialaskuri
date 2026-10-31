# Pörssisähködatan lataaminen

Alla olevat linkit lataavat Suomen aluehinnat (FI), €/MWh ilman arvonlisäveroa. Rajaus vastaa laskurin kiinteää EET-vuotta (UTC+2). Hinnat eivät sisällä myyjän marginaalia, siirtoa tai sähköveroa. Vuosien 2023–2025 linkit ovat kokonaisille menneille vuosille.

| Suora lataus | Muoto ja muunnos |
|---|---|
| [Sähkötin 2023 – CSV](https://sahkotin.fi/prices.csv?start=2022-12-31T22:00:00.000Z&end=2023-12-31T21:59:59.999Z) | 2023, CSV → tuntisarja |
| [Sähkötin 2024 – CSV](https://sahkotin.fi/prices.csv?start=2023-12-31T22:00:00.000Z&end=2024-12-31T21:59:59.999Z) | 2024, CSV → tuntisarja; poista 29.2. muunnoksessa |
| [Sähkötin 2025 – CSV](https://sahkotin.fi/prices.csv?start=2024-12-31T22:00:00.000Z&end=2025-12-31T21:59:59.999Z) | 2025, CSV → tuntisarja |
| [Elering 2025 – CSV (FI)](https://dashboard.elering.ee/api/nps/price/csv?fields=fi&start=2024-12-31T22:00:00Z&end=2025-12-31T21:59:59Z) | 2025, CSV; UTC-aikaleima ja desimaalipilkku |
| [Energy-Charts 2025 – JSON (FI)](https://api.energy-charts.info/price?bzn=FI&start=2024-12-31T22:00Z&end=2025-12-31T21:59Z) | 2025, JSON; unix_seconds ja price |
| [Sähkötin 2026 – CSV](https://sahkotin.fi/prices.csv?start=2025-12-31T22:00:00.000Z&end=2026-12-31T21:59:59.999Z) | 2026, vuosi kesken; puuttuvat tunnit jäävät tyhjiksi |

## Muunna laskurin muotoon

Tallenna lataus esimerkiksi nimellä `hinnat.csv` tai `hinnat.json`. Jos selain näyttää aineiston tekstinä, tallenna sivu tiedostoksi. Suorita projektin juurikansiossa ladattua vuotta vastaava komento:

```sh
python scripts/hae_porssihinnat.py 2025 hinnat.csv
python scripts/hae_porssihinnat.py 2025 hinnat.json
```

Sähköttimen aineiston voi myös hakea suoraan:

```sh
python scripts/hae_porssihinnat.py 2025
```

Skripti tunnistaa Sähköttimen CSV:n, Eleringin Suomen CSV:n sekä Energy-Chartsin JSONin. Se käyttää UTC-aikaleimoja, muuntaa kiinteään EET-aikaan, keskiarvoistaa varttihinnat tunneiksi ja poistaa karkausvuoden 29.2. Eleringin paikallista päivämääräsaraketta ei käytetä kesäajan vuoksi. Vuoden 2024 raakalatauksessa on myös 29.2.

Tuloksessa `porssihinnat_2025.csv` on 8 760 riviä. Varmista, että skripti ilmoittaa **puuttuvia 0** (kesken olevalla vuodella puuttuvat tunnit jäävät tyhjiksi). Kopioi vain `hinta_eur_mwh`-sarakkeen 8 760 riviä ilman otsikkoa välilehdelle **Hintahistoria** vuoden sarakkeeseen riviltä 2 alkaen: **C2** = 2023, **D2** = 2024, **E2** = 2025, **F2** = 2026. Käytä Liitä määräten → Arvot. Valitse Ohjauspaneelin **K22** = Pörssihinta ja **K49** = vuosi tai Keskiarvo. Valitun vuoden puuttuvat tunnit korvataan syötettyjen vuosien tuntikeskiarvolla (sarake G); jos kaikilta vuosilta puuttuu hinta, kannattavuustulos estetään. Älä liitä *Pörssihinnat*-välilehden sarakkeeseen C: se on kaava. Jos Excel avaa koko CSV-rivin yhteen sarakkeeseen, tuo tiedosto Tiedot → Tekstistä/CSV: erotin puolipiste ja desimaalierotin piste.

## Lähteet ja käyttöehdot

- [Sähkötin API](https://sahkotin.fi/api): oletusyksikkö EUR/MWh, ilman arvonlisäveroa. Linkeissä ei käytetä `vat`- tai `fix`-muunnoksia. Palvelu rajaa ilmaisen API-käytön ei-kaupalliseen käyttöön ja ilmoittaa Nord Poolin datan oikeudenhaltijaksi.
- [Elering API:n dokumentaatio](https://dashboard.elering.ee/assets/swagger-ui/index.html): `fields=fi` valitsee Suomen aluehinnan. CSV:n ensimmäinen sarake on UTC:n Unix-aikaleima, viimeinen Suomen hinta. Tarkista palvelun ja alkuperäisen datan tarjoajan käyttöehdot ennen aineiston käyttöä tai jakamista.
- [Fraunhofer ISE Energy-Charts API](https://api.energy-charts.info/): `bzn=FI` valitsee Suomen. Hinta-aineiston vastauksen `license_info` sallii vain yksityisen ja sisäisen käytön ja kieltää ulkoisen tai kaupallisen käytön myös johdetuille tiedoille. API:n yleistä CC BY 4.0 -lisenssiä ei saa olettaa tämän hinta-aineiston lisenssiksi.

Tarkistettu 21.10.2026: kaikkien kolmen palvelun vuoden 2025 suorat lataukset vastasivat onnistuneesti. Linkkien saatavuus ja käyttöehdot voivat muuttua. Hintadataa ei sisällytetä jakelupakettiin. Maatilan kaupalliseen käyttöön varmista tarvittavat oikeudet palvelusta tai käytä omaa lisensoitua aineistoa.
