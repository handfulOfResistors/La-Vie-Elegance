# Zakazivanje preko Google Calendar-a — postavljanje

Backend je Google Apps Script Web App. Nema hostinga, nema API ključa, nema troška —
skripta se izvršava kao tvoj Google nalog i zato joj je pristup kalendaru urođen.

Ceo postupak traje oko 10 minuta.

---

## 1. Napravi kalendar

1. Otvori [Google Calendar](https://calendar.google.com) prijavljen kao **littlemozzart@gmail.com**
2. Levo, pored „Drugi kalendari", klikni **+** → **Napravi novi kalendar**
3. Naziv: `La Vie — TEST`, vremenska zona **(GMT+01:00) Beograd** → **Napravi kalendar**
4. Klikni na taj kalendar u listi → **Podešavanja** → skroluj do **Integracija kalendara**
5. Kopiraj **ID kalendara** — izgleda ovako:
   `c_a1b2c3...@group.calendar.google.com`

---

## 2. Napravi skriptu

1. Idi na [script.google.com](https://script.google.com) → **Novi projekat**
2. Preimenuj projekat u `La Vie Elegance — zakazivanje` (gore levo)
3. Obriši sav postojeći kod u `Code.gs` i nalepi sadržaj fajla **`Code.gs`** iz ovog foldera
4. Na vrhu, u bloku `CONFIG`, zameni:
   ```js
   CALENDAR_ID: 'OVDE_NALEPI_ID_KALENDARA',
   ```
   ID-jem koji si kopirao u koraku 1
5. **Sačuvaj** (Ctrl+S)

### Vremenska zona

Zupčanik **Podešavanja projekta** (levo) → **Vremenska zona** → `(GMT+01:00) Central European Time – Belgrade`.

Ovo je bitno: skripta računa termine u zoni projekta. Ako ostane na američkoj zoni,
termini će biti pomereni za nekoliko sati.

---

## 3. Autorizuj i testiraj

1. U padajućem meniju iznad koda izaberi funkciju **`dijagnostika`** → **Pokreni**
2. Google će tražiti dozvole — **Pregledaj dozvole** → izaberi nalog →
   „Google nije verifikovao ovu aplikaciju" → **Napredno** → **Idi na … (nebezbedno)** → **Dozvoli**

   > Ovo upozorenje je normalno za sopstvene skripte. Aplikacija si ti, a dozvolu daješ sam sebi.

3. Otvori **Dnevnik izvršavanja** (Ctrl+Enter). Dobićeš izveštaj u kome je bitno:

   ```json
   "nalogKojiIzvrsava": "littlemozzart@gmail.com",
   "vremenskaZonaSkripte": "Europe/Belgrade",
   "kalendarPronadjen": true,
   "nazivKalendara": "La Vie — TEST",
   "dijagnoza": ["Sve radi — za taj dan ima 17 slobodnih termina."]
   ```

   Polje **`dijagnoza`** na dnu ti u rečenici kaže šta ne valja ako nešto ne valja.
   Ako je `kalendarPronadjen: false`, u polju **`sviKalendariNaNalogu`** imaš spisak
   svih kalendara koje taj nalog vidi, sa tačnim ID-jevima — prekopiraj odatle.

---

## 4. Objavi kao Web App

1. Gore desno **Deploy** → **New deployment**
2. Zupčanik pored „Select type" → **Web app**
3. Popuni:
   - **Description:** `v1`
   - **Execute as:** `Me (littlemozzart@gmail.com)`
   - **Who has access:** `Anyone`

   > „Anyone" znači da sajt može da poziva skriptu bez prijave — to je neophodno.
   > Skripta ne otkriva ništa osim slobodnih termina, a upis je zaštićen tokenom,
   > proverom slota i ograničenjem broja pokušaja.

4. **Deploy** → kopiraj **Web app URL**. Izgleda ovako:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## 5. Poveži sa sajtom

U `index.html`, pri dnu, nađi:

```js
window.LVE_BOOKING = {
  url: "",
  token: "lve-test-2026",
  demo: true
};
```

Nalepi URL i ugasi demo režim:

```js
window.LVE_BOOKING = {
  url: "https://script.google.com/macros/s/AKfycb.../exec",
  token: "lve-test-2026",
  demo: false
};
```

`token` mora da bude identičan `SHARED_TOKEN` vrednosti u `Code.gs`.

Otvori sajt, klikni **Zakaži termin**, prođi kroz korake — termin treba da se pojavi
u kalendaru `La Vie — TEST` i da ti stigne email.

---

## Važno: kako se objavljuju izmene

Ovo zbuni skoro svakog ko prvi put radi sa Apps Script-om.

**Čuvanje koda (Ctrl+S) ne menja ono što sajt poziva.** Web App uvek izvršava
verziju koja je objavljena. Posle svake izmene u `Code.gs`:

**Deploy** → **Manage deployments** → olovka (Edit) → **Version: New version** → **Deploy**

URL ostaje isti. Ako napraviš „New deployment" umesto „New version", dobićeš **novi URL**
i moraćeš da ga menjaš u `index.html`.

---

## Šta menjaš u `CONFIG`

| Podešavanje | Šta radi |
|---|---|
| `CALENDAR_ID` | u koji kalendar se upisuje |
| `NOTIFY_EMAIL` | kome stiže obaveštenje o rezervaciji |
| `CONFIRM_CUSTOMER` | da li klijent dobija email potvrde |
| `SHARED_TOKEN` | mora se poklapati sa `token` na sajtu |
| `SLOT_STEP_MIN` | na koliko minuta počinju termini (15 → 11:00, 11:15…) |
| `BUFFER_MIN` | pauza između dva termina iste osobe |
| `MIN_NOTICE_HOURS` | najkraći rok za zakazivanje |
| `MAX_ADVANCE_DAYS` | koliko dana unapred se može zakazati |
| `HOURS` | radno vreme po danu; `null` = neradan dan |
| `BREAKS` | dnevne pauze, npr. ručak |
| `CLOSED_DATES` | praznici i slobodni dani |
| `STAFF` | zaposleni — `name` je ime koje piše na početku naslova u kalendaru |
| `CATEGORIES` | kategorije usluga (prvi korak u widgetu) |
| `SERVICES` | usluge: kategorija, trajanje u minutima i ko ih radi (`staff`) |

Radno vreme, trajanja i podela usluga su iz upitnika koji je salon popunio.

---

## Kako sistem zna ko je zauzet

Svi termini idu u **jedan** kalendar. Po **imenu na početku naslova** skripta zna čiji je termin:

| Naslov događaja | Koga zauzima |
|---|---|
| `Nikolina · Jelena — Manikir` (ovako upisuje sajt) | samo Nikolinu |
| `Kaća: Marija, trepavice` | samo Kaću |
| `Ivana - zubar` | samo Ivanu |
| `Ivana` (celodnevni) | Ivanu, ceo dan — tako se upisuje slobodan dan jedne osobe |
| `Sastanak`, `Jelena manikir`, bilo šta drugo | **ceo salon** |

Pravilo: ime, pa `·`, `:` ili `-` (ili samo ime). Velika slova i kvačice nisu bitne — `kaca:` važi isto kao `Kaća:`.
Kada neko **ručno** upisuje termin u kalendar, mora da počne naslov imenom osobe. U suprotnom taj termin
zatvara salon za sve tri. Tako se nikad ne desi da dve klijentkinje dobiju istu osobu u isto vreme,
ali se mogu izgubiti slobodni termini.

Kad klijent izabere „Svejedno", skripta dodeljuje onu osobu koja je slobodna u to vreme
i tog dana ima najmanje zakazanog.

Pauza (`BUFFER_MIN`) važi između termina **iste osobe**: 15 min pre i posle svakog njenog termina.

---

## Kako sprečava duple termine

Tri sloja:

1. Slobodni termini se računaju iz stvarnog sadržaja kalendara — sve što je upisano blokira
   tu osobu ili ceo salon (vidi „Kako sistem zna ko je zauzet“). Celodnevni događaj blokira ceo dan,
   pa je to najlakši način da se ručno zatvori dan.
2. Pre samog upisa skripta uzima `LockService` bravu, pa dva istovremena zahteva
   ne mogu da uzmu isti slot.
3. Posle uzimanja brave slot se **ponovo proverava**. Ako je u međuvremenu zauzet,
   korisnik dobija poruku i listu preostalih termina.

Ako salon nastavi da koristi i SrediMe, te rezervacije ovaj kalendar **ne vidi** —
neko mora ručno da ih upiše, inače će doći do preklapanja.

---

## Ograničenja besplatnog naloga

- **MailApp:** 100 emailova dnevno (obično po dva po rezervaciji → ~50 rezervacija)
- **Vreme izvršavanja:** 6 minuta po pozivu — ovde se koristi manje od sekunde
- **Hladan start:** prvi poziv posle duže pauze ume da traje 2–3 sekunde

Za salon ovog obima ovo su komotne granice.

---

## Bezbednost — šta jeste, a šta nije zaštićeno

`token` se vidi u izvornom kodu stranice. On odbija botove koji nasumično gađaju
URL-ove, ali ne i nekoga ko pogleda kod. Prava zaštita je u tome što skripta prima
**samo dve radnje** — čitanje slobodnih termina i upis jedne rezervacije uz validaciju.
Ne može se ništa obrisati, pročitati tuđi termin ni izmeniti kalendar.

Dodatno stoji: honeypot polje protiv botova i ograničenje od 3 rezervacije na sat
po broju telefona.

Ako se pojavi zloupotreba, sledeći korak je SMS ili email potvrda pre upisa.

---

## Ako nešto ne radi

**Prvo pokreni dijagnostiku.** Dva načina:

- iz editora: izaberi funkciju **`dijagnostika`** → **Pokreni** → Execution log
- iz browsera, bez ulaska u editor (ovo testira **objavljenu** verziju, što je tačnije):

  ```
  https://script.google.com/macros/s/.../exec?action=debug&token=lve-test-2026
  ```

  Dodaj `&date=2026-10-05` za konkretan dan, `&service=manikir` za uslugu i `&staff=kaca` za osobu.

Izveštaj sadrži nalog koji izvršava skriptu, vremensku zonu, da li je kalendar pronađen,
spisak svih kalendara sa ID-jevima, sve događaje tog dana (uz svaki piše koga zauzima)
i izračunate slotove — plus polje `dijagnoza` sa zaključkom.

### Česti uzroci

**„Nema slobodnih termina" za svaki datum, a kalendar je prazan.**
Skoro uvek znači da skripta ne vidi kalendar. Najčešći razlog nije pogrešno
prekopiran ID nego **pogrešan Google nalog**: ako si u browseru prijavljen na više
naloga, script.google.com ume da se otvori pod onim drugim, a taj nalog ne vidi
kalendar koji si napravio. Proveri `nalogKojiIzvrsava` u dijagnostici — mora da piše
`littlemozzart@gmail.com`. Ako piše nešto drugo, odjavi se sa ostalih naloga
(ili otvori script.google.com u anonimnom prozoru), napravi projekat ponovo
pod pravim nalogom i objavi novi deployment.

**Celodnevni događaj u kalendaru.** Blokira ceo dan po dizajnu — to je način da se
ručno zatvori dan. Dijagnostika ga prijavi poimence.

| Poruka / simptom | Uzrok |
|---|---|
| `BAD_TOKEN` | `token` u `index.html` ≠ `SHARED_TOKEN` u `Code.gs` |
| `NO_CALENDAR` | pogrešan `CALENDAR_ID`, ili skripta radi pod drugim Google nalogom |
| Widget kaže „Ne mogu da se povežem" | deployment nije `Anyone`, ili je URL pogrešan (mora da se završava sa `/exec`, ne `/dev`) |
| Termini pomereni za par sati | vremenska zona projekta nije Beograd |
| Izmene u kodu nemaju efekta | nije objavljena nova verzija (vidi „Kako se objavljuju izmene") |
| Widget se ne pojavljuje | `url` je prazan i `demo` je `false` — tada se namerno ne prikazuje |
