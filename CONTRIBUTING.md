# Palautteen antaminen

Laskurin toimintaperiaate, käyttö ja ehdotettu kehitysjärjestys on koottu [esittely-, käyttö- ja kehitysoppaaseen](docs/OPAS.md).

Kiitos, että autat parantamaan laskuria. Kaikki palaute auttaa: virheet, epäselvät kohdat, puuttuvat laitteet tai tilatyypit ja kokemukset oikeista investoinneista.

## Miten?

Palaute annetaan GitHubin Issues-osiossa. Tarvitset ilmaisen GitHub-tunnuksen (github.com → *Sign up*).

1. Avaa välilehti **Issues** ja paina **New issue**.
2. Valitse lomake:
   - **Virhe laskurissa:** laskuri antaa väärän tai epäloogisen tuloksen tai virheilmoituksen.
   - **Parannusehdotus:** uusi ominaisuus, laite, tilatyyppi tai selkeämpi ohje.
   - **Käyttökokemus:** kerro, miten käytit laskuria ja mitä opit.
3. Täytä lomake. Liitä tarvittaessa kuvakaappaus.

## Tietosuoja

Issues-osion viestit ovat **julkisia**. Älä liitä tilasi nimeä, osoitetta tai muita tunnistetietoja äläkä tunnistettavaa kulutusdataa. Jos haluat jakaa oman datasi kehitystyöhön, kerro siitä Issuessa ilman dataa, niin sovimme toimitustavasta ja käytöstä erikseen.

## Kehittäjille

Muutosehdotukset (pull request) ovat tervetulleita. Kerro kuvauksessa, mitä muutit ja miten testasit. Laskurin kaavamuutoksista pyydämme:

- Tee muutos .xlsm-tiedostoon ja muodosta makroton .xlsx komennolla `python scripts/tee_xlsx.py laskuri/Maatilan_hybridienergialaskuri.xlsm laskuri/Maatilan_hybridienergialaskuri.xlsx`.
- Makromuutokset tehdään myös tiedostoon `laskuri/Optimointi.bas`, jotta koodi on luettavissa ilman Exceliä.
- Älä tallenna työkirjaan pörssihintoja, omaa kulutusdataa, kommentteja, lisäosia tai luottamuksellisuusmerkintöjä.
- Tarkista, että Excel ja LibreOffice laskevat ilman virheitä.
- Tarkista, että oletusasetuksilla tulokset eivät muutu, ellei muutos ole tarkoituksellinen. Kirjaa muutos tiedostoon `CHANGELOG.md`.

## Muutosehdotuksen tekeminen

1. Keskustele laajoista laskentamuutoksista ensin Issuessa. Kuvaa nykyinen tulos, odotettu tulos ja toistettava esimerkkitapaus.
2. Tee fork ja oma kehityshaara. Rajaa pull request yhteen asiaan.
3. Kuvaa Excel-muutoksessa välilehdet, solualueet ja kaavamuutokset tekstinä. Päivitä vastaava Python-sääntömalli tai dokumentoi mallien tarkoituksellinen ero.
4. Lisää laskentakorjaukselle regressiotesti ja ilmoita käytetyt aineistot, aikakanta ja testitulokset. Tarkista energia- ja kustannustaseet sekä teho- ja varastorajat muutoksen vaikutusalueella.
5. Päivitä lähteet, oletukset, käyttöohje ja muutosloki. Kirjaa natiivisovelluksen versio ja mahdollisesti testaamatta jäänyt sovellus.

Testikomennot ja julkaisuohje: [kehittäjän käytännön ohje](docs/OPAS.md#käytännön-ohje-kehittäjälle). Tunnetut validoinnin rajat: [TESTAUS.md](docs/TESTAUS.md).

## Lisenssit ja aineistot

Säilytä [CC BY 4.0](LICENSE)- ja [MIT](LICENSE-CODE)-merkinnät soveltuvissa tiedostoissa, alkuperäiset lähdeviitteet sekä tiedot aiemmista muutoksista. Merkitse omat muutoksesi. Älä sisällytä muutosehdotukseen henkilötietoja, tunnistettavaa tiladataa tai aineistoa, jonka julkiseen jakamiseen ei ole oikeutta. Ulkoisen datan lisenssi ei muutu laskurin lisenssin perusteella.
