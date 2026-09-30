# La Vie Elegance — website

Statički jednostranični sajt za frizersko-kozmetički salon **La Vie Elegance**, Cara Dušana 128A, Niš.

Čist HTML5, CSS3 i vanilla JavaScript — **bez frameworka, bez build koraka, bez npm-a**.

---

## Pokretanje

Dvoklik na `index.html`. Radi direktno iz fajl sistema (`file://`), bez servera.

Ako želiš lokalni server (preporučeno zbog mape i keširanja):

```bash
python -m http.server 8000
# pa otvori http://localhost:8000
```

---

## Struktura projekta

```
index.html          Ceo sadržaj sajta + SEO meta tagovi + JSON-LD
css/style.css       Svi stilovi (CSS varijable na vrhu)
js/main.js          Prevod SR/EN, mobilni meni, scroll animacije
js/booking.js       Widget za zakazivanje
apps-script/        Backend za zakazivanje (Google Apps Script)
  Code.gs           Kod koji ide u script.google.com
  appsscript.json   Manifest (vremenska zona, dozvole)
  UPUTSTVO.md       Korak po korak postavljanje
assets/img/         Slike i favicon
  favicon.svg       Monogram "LV"
  hero.svg          Pozadina hero sekcije
  about.svg         Slika u sekciji "O nama"
  og-image.svg      Slika za deljenje na društvenim mrežama
  team-1..4.svg     Fotografije članova tima
robots.txt          Dozvoljava indeksiranje
sitemap.xml         Mapa sajta za Google
```

---

## Zamena slika

Sve slike su privremeni SVG placeholderi. Zameni ih pravim fotografijama i **ispravi ekstenziju u `index.html`** (npr. `hero.svg` → `hero.jpg`):

| Fajl | Gde se vidi | Preporučene dimenzije | Napomena |
|---|---|---|---|
| `assets/img/hero.svg` | pozadina hero sekcije | 2000 × 1200 px | pejzažna, tamnija; preko nje ide crni gradijent |
| `assets/img/about.svg` | sekcija "O nama" | 1000 × 750 px | enterijer salona |
| `assets/img/team-1.svg` | Ivana Pešić | 600 × 600 px | kvadratna, seče se u krug |
| `assets/img/team-2.svg` | Nikolina | 600 × 600 px | kvadratna |
| `assets/img/team-4.svg` | Kaća | 600 × 600 px | kvadratna |
| `assets/img/og-image.svg` | pregled pri deljenju linka | 1200 × 630 px | **mora biti .jpg ili .png** — društvene mreže ne prikazuju SVG |
| `assets/img/favicon.svg` | ikonica u tabu | — | zameni ako salon dobije logo |

Kompresuj slike pre postavljanja (npr. [squoosh.app](https://squoosh.app)) — cilj je ispod 300 KB za hero, ispod 100 KB za ostale.

U `index.html` mesta za zamenu fotografija tima obeležena su komentarom `<!-- ZAMENITI: ... -->`.

---

## Izmena kontakt podataka i radnog vremena

Sve je na jednom mestu u `index.html`:

- **Radno vreme** — sekcija `#contact`, tabela `hours__table`.
  Ako menjaš sate, izmeni ih i u `openingHoursSpecification` unutar JSON-LD bloka u `<head>` (to je ono što Google prikazuje u pretrazi),
  i u `HOURS` u `apps-script/Code.gs` (to određuje koje termine zakazivanje nudi).
- **Telefon** — pretraži `+381616611269` (tel linkovi) i `061/6611-269` (prikazani tekst). Prikazani tekst na engleskom je u `js/main.js` (`hero.ctaCall`, `contact.bookNote`), a u widgetu u porukama o grešci na vrhu `js/booking.js`. Broj u emailovima je `SALON_PHONE` u `Code.gs`.
- **Adresa, email, Instagram** — sekcija `#contact` i JSON-LD u `<head>`.
- **Geo koordinate** — u JSON-LD bloku su **približne**; otvori Google Maps, desni klik na tačnu lokaciju salona, kopiraj koordinate i zameni `latitude` / `longitude`.

---

## Zakazivanje termina

Widget dole desno vodi korisnika kroz korake (kategorija → usluga → osoba → dan → slobodan termin → ime i telefon)
i upisuje rezervaciju direktno u Google Calendar. Korak „osoba" se pojavljuje samo kad uslugu radi više njih
(npr. manikir: Nikolina, Kaća ili „Svejedno"). Nema AI — svaki korak je unapred
definisan, pa ne može da pogreši ni da košta.

Backend je Google Apps Script. **Postavljanje: [`apps-script/UPUTSTVO.md`](apps-script/UPUTSTVO.md).**

Podešavanje je pri dnu `index.html`:

```js
window.LVE_BOOKING = {
  url: "",                 // Web App URL iz Apps Script-a
  token: "lve-test-2026",  // mora = SHARED_TOKEN u Code.gs
  demo: true               // true = izmišljeni termini, bez upisa
};
```

Tri stanja:

- `demo: true`, `url` prazan → widget radi sa lažnim terminima, ništa se ne upisuje (za pregled izgleda)
- `url` popunjen, `demo: false` → pravo zakazivanje u kalendar
- oba prazna/false → widget se **ne prikazuje**, a dugmad „Zakaži termin" rade kao obični `tel:` linkovi

Usluge, trajanja, ko šta radi i radno vreme su u `CONFIG` bloku na vrhu `apps-script/Code.gs`.
Tekstovi widgeta (SR i EN) su na vrhu `js/booking.js`. Demo režim ima svoju kopiju usluga
(`DEMO_DATA` u `js/booking.js`) — ako menjaš usluge, izmeni i nju.

---

## Potpis autora

U dnu futera stoji diskretan red `Izrada sajta: MaximusAI LLC · adjustrategy@gmail.com`
(`<p class="site-footer__credit">` u `index.html`). Tekst „Izrada sajta:" / „Website by"
je u `js/main.js` pod ključem `footer.credit`. Za uklanjanje obriši taj `<p>` element.

---

## Dvojezičnost (SR / EN)

Prevod radi preko `data-i18n` atributa u HTML-u i rečnika `translations` na vrhu `js/main.js`.

- Podrazumevani jezik: **srpski (latinica)**. Izbor se pamti u `localStorage` (ključ `lve-lang`).
- Prekidač menja tekst, `<html lang>`, `<title>` i `meta description`.

**Izmena teksta:** ako menjaš tekst koji ima `data-i18n` atribut, izmeni ga i u `js/main.js` — JavaScript prepisuje sadržaj pri učitavanju.

**Dodavanje novog jezika:**

1. U `js/main.js` kopiraj ceo `sr` objekat, preimenuj u npr. `de` i prevedi vrednosti.
2. U `index.html`, unutar `<div class="lang">`, dodaj:
   ```html
   <span class="lang__sep" aria-hidden="true">/</span>
   <button type="button" class="lang__btn" data-lang="de" aria-pressed="false">DE</button>
   ```

---

## Deploy

**Netlify** — prevuci folder na [app.netlify.com/drop](https://app.netlify.com/drop). Gotovo.

**Vercel** — `npx vercel` u folderu projekta, ili poveži GitHub repo (bez build komande, output je root folder).

**GitHub Pages** — push na GitHub → Settings → Pages → Source: `main` / `(root)`.

**Shared hosting (cPanel)** — kopiraj sve fajlove u `public_html/` preko FTP-a.

Posle deploya zameni `https://lavieelegance.rs/` pravim domenom u: `<link rel="canonical">`, `og:url`, JSON-LD (`url`, `@id`, `image`, `logo`) i u `sitemap.xml`.

---

## Šta još treba dostaviti

- [ ] **Prave fotografije** — enterijer salona, radovi, portreti članova tima
- [ ] **Logo**, ako postoji — trenutno je u upotrebi tekstualni wordmark i monogram "LV"
- [ ] **Tačne geo koordinate** salona
- [ ] **Domen** — sajt je pisan za `lavieelegance.rs`, zameni ako je drugi
- [ ] **Prezimena članova tima** (Nikolina, Kaća), ako žele da stoje na sajtu
