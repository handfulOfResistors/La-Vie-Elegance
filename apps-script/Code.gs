/**
 * La Vie Elegance — backend za online zakazivanje
 * Google Apps Script Web App + Google Calendar
 *
 * Dva endpoint-a:
 *   GET  ?action=config                          → usluge, zaposleni, radno vreme, ograničenja
 *   GET  ?action=slots&date=2026-10-01&service=manikir&staff=kaca → slobodni termini za taj dan
 *        (staff=any ili bez staff = bilo ko ko radi tu uslugu)
 *   POST {action:"book", ...}                    → upisuje termin u kalendar
 *
 * Uputstvo za postavljanje: vidi UPUTSTVO.md
 */

/* ==========================================================================
   PODEŠAVANJA — jedino ovo menjaš
   ========================================================================== */
var CONFIG = {

  /* ID kalendara u koji se upisuju termini.
     Google Calendar → podešavanja kalendara → "Integracija kalendara" → ID kalendara.
     Izgleda otprilike ovako: abc123...@group.calendar.google.com            */
  CALENDAR_ID: 'f1ae56f1348a64c4fb731705f9af96adb1a21674e04888de8ec2c1f417c09c93@group.calendar.google.com',

  /* Na koju adresu stiže obaveštenje o novoj rezervaciji */
  NOTIFY_EMAIL: 'littlemozzart@gmail.com',

  /* Da li klijentu ide email potvrde (samo ako je ostavio adresu) */
  CONFIRM_CUSTOMER: true,

  /* Naziv salona u emailovima i u naslovu događaja */
  SALON_NAME: 'La Vie Elegance',
  SALON_PHONE: '061/6611-269',
  SALON_ADDRESS: 'Cara Dušana 128A, 18000 Niš',

  /* Mora da se poklapa sa window.LVE_BOOKING.token na sajtu.
     Nije prava zaštita (vidi se u kodu stranice), ali odbija najprostije botove. */
  SHARED_TOKEN: 'lve-test-2026',

  /* Na koliko minuta počinju termini (15 = 11:00, 11:15, 11:30...) */
  SLOT_STEP_MIN: 15,

  /* Pauza između termina iste osobe, u minutima (spremanje, čišćenje) */
  BUFFER_MIN: 15,

  /* Najkraći rok za zakazivanje — ne može "za 5 minuta" */
  MIN_NOTICE_HOURS: 2,

  /* Koliko dana unapred se može zakazati */
  MAX_ADVANCE_DAYS: 60,

  /* Radno vreme po danu u nedelji (0 = nedelja ... 6 = subota).
     null = neradan dan. Format: ['HH:MM', 'HH:MM']
     Usluga mora da se završi do zatvaranja.                                  */
  HOURS: {
    0: ['11:00', '20:00'],    // nedelja
    1: ['11:00', '20:00'],    // ponedeljak
    2: ['11:00', '20:00'],
    3: ['11:00', '20:00'],
    4: ['11:00', '20:00'],
    5: ['11:00', '20:00'],
    6: ['11:00', '20:00']     // subota
  },

  /* Dnevne pauze kada se ne zakazuje (npr. ručak). Prazno = nema pauze. */
  BREAKS: [
    // ['13:00', '13:30']
  ],

  /* Datumi kada je salon zatvoren, format 'YYYY-MM-DD' */
  CLOSED_DATES: [
    // '2027-01-01', '2027-01-07'
  ],

  /* Zaposleni. `name` se prikazuje klijentu i stoji na početku naslova u kalendaru.
     Kalendar je zajednički. Događaj čiji naslov počinje imenom i znakom
     · : - ili samo imenom (npr. "Nikolina: Jelena — manikir") zauzima samo tu
     osobu. Događaj bez imena na početku zauzima ceo salon.                   */
  STAFF: [
    { id: 'ivana',    name: 'Ivana' },
    { id: 'nikolina', name: 'Nikolina' },
    { id: 'kaca',     name: 'Kaća' }
  ],

  /* Kategorije — prvi korak u widgetu */
  CATEGORIES: [
    { id: 'kosa',       sr: 'Kosa',              en: 'Hair' },
    { id: 'nokti',      sr: 'Nokti',             en: 'Nails' },
    { id: 'depilacija', sr: 'Depilacija',        en: 'Waxing' },
    { id: 'trepavice',  sr: 'Trepavice i obrve', en: 'Lashes and brows' },
    { id: 'sminka',     sr: 'Šminka',            en: 'Make-up' }
  ],

  /* Usluge. `min` je trajanje u minutima, `cat` kategorija, `staff` ko je radi.
     `id` mora biti bez razmaka. Trajanja i podela su iz upitnika salona.     */
  SERVICES: [
    { id: 'zensko-sisanje',        cat: 'kosa', sr: 'Žensko šišanje',               en: "Women's haircut",               min: 30,  staff: ['ivana'] },
    { id: 'musko-sisanje',         cat: 'kosa', sr: 'Muško šišanje',                en: "Men's haircut",                 min: 30,  staff: ['ivana'] },
    { id: 'decje-sisanje',         cat: 'kosa', sr: 'Dečje šišanje',                en: "Children's haircut",            min: 30,  staff: ['ivana'] },
    { id: 'feniranje',             cat: 'kosa', sr: 'Pranje i feniranje',           en: 'Wash and blow-dry',             min: 30,  staff: ['ivana'] },
    { id: 'farbanje',              cat: 'kosa', sr: 'Farbanje',                     en: 'Colour',                        min: 60,  staff: ['ivana'] },
    { id: 'pramenovi',             cat: 'kosa', sr: 'Pramenovi / balayage / ombre', en: 'Highlights / balayage / ombré', min: 180, staff: ['ivana'] },
    { id: 'preliv',                cat: 'kosa', sr: 'Preliv / toner',               en: 'Gloss / toner',                 min: 30,  staff: ['ivana'] },
    { id: 'svecana-frizura',       cat: 'kosa', sr: 'Svečana frizura',              en: 'Occasion hair',                 min: 45,  staff: ['ivana'] },
    { id: 'svadbena-frizura',      cat: 'kosa', sr: 'Svadbena frizura',             en: 'Bridal hair',                   min: 60,  staff: ['ivana'] },
    { id: 'tretman-kose',          cat: 'kosa', sr: 'Tretman kose / maska',         en: 'Hair treatment / mask',         min: 45,  staff: ['ivana'] },
    { id: 'keratin',               cat: 'kosa', sr: 'Keratin / botoks za kosu',     en: 'Keratin / hair botox',          min: 45,  staff: ['ivana'] },
    { id: 'brada',                 cat: 'kosa', sr: 'Uređivanje brade',             en: 'Beard grooming',                min: 30,  staff: ['ivana'] },

    { id: 'manikir',               cat: 'nokti', sr: 'Manikir',                     en: 'Manicure',                      min: 90,  staff: ['nikolina', 'kaca'] },
    { id: 'gel-lak',               cat: 'nokti', sr: 'Gel lak',                     en: 'Gel polish',                    min: 90,  staff: ['nikolina', 'kaca'] },
    { id: 'nadogradnja-noktiju',   cat: 'nokti', sr: 'Nadogradnja noktiju',         en: 'Nail extensions',               min: 120, staff: ['nikolina', 'kaca'] },
    { id: 'korekcija-noktiju',     cat: 'nokti', sr: 'Korekcija noktiju',           en: 'Nail infill',                   min: 60,  staff: ['nikolina', 'kaca'] },
    { id: 'pedikir',               cat: 'nokti', sr: 'Pedikir',                     en: 'Pedicure',                      min: 60,  staff: ['nikolina'] },

    { id: 'depilacija-noge',       cat: 'depilacija', sr: 'Depilacija — noge',          en: 'Waxing — legs',          min: 30, staff: ['nikolina'] },
    { id: 'depilacija-ruke',       cat: 'depilacija', sr: 'Depilacija — ruke',          en: 'Waxing — arms',          min: 30, staff: ['nikolina'] },
    { id: 'depilacija-lice',       cat: 'depilacija', sr: 'Depilacija — lice',          en: 'Waxing — face',          min: 30, staff: ['nikolina'] },
    { id: 'depilacija-intimna',    cat: 'depilacija', sr: 'Depilacija — intimna zona',  en: 'Waxing — intimate area', min: 30, staff: ['nikolina'] },

    { id: 'nadogradnja-trepavica', cat: 'trepavice', sr: 'Nadogradnja trepavica',   en: 'Lash extensions',               min: 90,  staff: ['kaca'] },
    { id: 'korekcija-trepavica',   cat: 'trepavice', sr: 'Korekcija trepavica',     en: 'Lash infill',                   min: 60,  staff: ['kaca'] },
    { id: 'lifting-trepavica',     cat: 'trepavice', sr: 'Lifting trepavica',       en: 'Lash lift',                     min: 30,  staff: ['kaca'] },
    { id: 'obrve',                 cat: 'trepavice', sr: 'Regulacija obrva',        en: 'Brow shaping',                  min: 30,  staff: ['ivana'] },

    { id: 'sminka',                cat: 'sminka', sr: 'Profesionalna šminka',       en: 'Professional make-up',          min: 60,  staff: ['nikolina'] }
  ]
};

/* ==========================================================================
   ULAZNE TAČKE
   ========================================================================== */

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.token !== CONFIG.SHARED_TOKEN) { return json_({ ok: false, error: 'BAD_TOKEN' }); }

    if (p.action === 'config') { return json_({ ok: true, config: publicConfig_() }); }

    if (p.action === 'slots') {
      return json_(slots_(String(p.date || ''), String(p.service || ''), String(p.staff || '')));
    }

    if (p.action === 'debug') {
      return json_(debug_(String(p.date || ''), String(p.service || 'zensko-sisanje'), String(p.staff || '')));
    }

    return json_({ ok: false, error: 'UNKNOWN_ACTION' });
  } catch (err) {
    return json_({ ok: false, error: 'SERVER', detail: String(err) });
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) { body = JSON.parse(e.postData.contents); }
    if (body.token !== CONFIG.SHARED_TOKEN) { return json_({ ok: false, error: 'BAD_TOKEN' }); }
    if (body.action !== 'book') { return json_({ ok: false, error: 'UNKNOWN_ACTION' }); }
    return json_(book_(body));
  } catch (err) {
    return json_({ ok: false, error: 'SERVER', detail: String(err) });
  }
}

/* ==========================================================================
   LOGIKA
   ========================================================================== */

function publicConfig_() {
  return {
    categories: CONFIG.CATEGORIES,
    staff: CONFIG.STAFF.map(function (p) {
      return { id: p.id, name: p.name };
    }),
    services: CONFIG.SERVICES.map(function (s) {
      return { id: s.id, cat: s.cat, sr: s.sr, en: s.en, min: s.min, staff: s.staff };
    }),
    hours: CONFIG.HOURS,
    maxAdvanceDays: CONFIG.MAX_ADVANCE_DAYS,
    minNoticeHours: CONFIG.MIN_NOTICE_HOURS,
    salon: {
      name: CONFIG.SALON_NAME,
      phone: CONFIG.SALON_PHONE,
      address: CONFIG.SALON_ADDRESS
    }
  };
}

/**
 * Vraća listu slobodnih početaka termina za dati dan, uslugu i osobu.
 * Za staff "any" (ili prazno) termin je slobodan ako je slobodna bar jedna
 * osoba koja radi tu uslugu.
 */
function slots_(dateStr, serviceId, staffId) {
  var service = findService_(serviceId);
  if (!service) { return { ok: false, error: 'BAD_SERVICE' }; }

  var people = staffFor_(service, staffId);
  if (!people) { return { ok: false, error: 'BAD_STAFF' }; }

  var free = freeByStaff_(dateStr, service, people);
  if (!free.byStaff) { return free; }

  var seen = {};
  people.forEach(function (p) {
    free.byStaff[p.id].forEach(function (s) { seen[s] = true; });
  });

  return {
    ok: true,
    date: dateStr,
    service: service.id,
    staff: people.length === 1 ? people[0].id : 'any',
    duration: service.min,
    slots: Object.keys(seen).sort()
  };
}

/**
 * Slobodni počeci termina za svaku od navedenih osoba, plus koliko je
 * svaka od njih već zauzeta tog dana (za raspodelu kod "svejedno").
 * Ako dan otpada (neradan, predaleko, greška), vraća gotov odgovor bez `byStaff`.
 */
function freeByStaff_(dateStr, service, people) {
  var parts = parseDate_(dateStr);
  if (!parts) { return { ok: false, error: 'BAD_DATE' }; }

  /* Ako kalendar ne može da se otvori, to je greška — a ne "sve zauzeto" */
  var cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  if (!cal) { return { ok: false, error: 'NO_CALENDAR' }; }

  if (CONFIG.CLOSED_DATES.indexOf(dateStr) !== -1) {
    return { ok: true, date: dateStr, slots: [], reason: 'CLOSED' };
  }

  var dayStart = new Date(parts.y, parts.m - 1, parts.d, 0, 0, 0);
  var hours = CONFIG.HOURS[dayStart.getDay()];
  if (!hours) { return { ok: true, date: dateStr, slots: [], reason: 'CLOSED' }; }

  var now = new Date();
  var maxDate = new Date(now.getTime() + CONFIG.MAX_ADVANCE_DAYS * 86400000);
  if (dayStart > maxDate) { return { ok: true, date: dateStr, slots: [], reason: 'TOO_FAR' }; }

  var earliest = new Date(now.getTime() + CONFIG.MIN_NOTICE_HOURS * 3600000);

  var openMin = toMinutes_(hours[0]);
  var closeMin = toMinutes_(hours[1]);
  var buffer = CONFIG.BUFFER_MIN * 60000;

  var busy = busyRanges_(cal, dayStart);

  var byStaff = {};
  var load = {};
  people.forEach(function (p) {
    /* Njeni termini + sve što nema ime na početku (zauzima ceo salon) */
    var mine = busy.filter(function (r) { return !r.staff || r.staff === p.id; });
    load[p.id] = mine.reduce(function (sum, r) { return sum + (r.end - r.start); }, 0);

    var list = [];
    for (var m = openMin; m + service.min <= closeMin; m += CONFIG.SLOT_STEP_MIN) {
      var start = new Date(parts.y, parts.m - 1, parts.d, 0, m, 0);
      var end = new Date(start.getTime() + service.min * 60000);

      if (start < earliest) { continue; }
      if (inBreak_(m, m + service.min)) { continue; }
      if (isBusy_(mine, start, end, buffer)) { continue; }

      list.push(pad_(Math.floor(m / 60)) + ':' + pad_(m % 60));
    }
    byStaff[p.id] = list;
  });

  return { ok: true, cal: cal, byStaff: byStaff, load: load };
}

/**
 * Upisuje termin. Zaključava skriptu da dva istovremena zahteva
 * ne bi uzela isti slot.
 */
function book_(b) {
  if (b.hp) { return { ok: false, error: 'SPAM' }; }              // honeypot polje

  var service = findService_(b.service);
  if (!service) { return { ok: false, error: 'BAD_SERVICE' }; }

  var people = staffFor_(service, String(b.staff || ''));
  if (!people) { return { ok: false, error: 'BAD_STAFF' }; }

  var parts = parseDate_(String(b.date || ''));
  if (!parts) { return { ok: false, error: 'BAD_DATE' }; }

  var timeMin = toMinutes_(String(b.time || ''));
  if (timeMin === null) { return { ok: false, error: 'BAD_TIME' }; }

  var name = String(b.name || '').trim();
  var phone = String(b.phone || '').trim();
  var email = String(b.email || '').trim();
  var note = String(b.note || '').trim().slice(0, 500);

  if (name.length < 2) { return { ok: false, error: 'BAD_NAME' }; }
  if (phone.replace(/\D/g, '').length < 6) { return { ok: false, error: 'BAD_PHONE' }; }
  if (email && email.indexOf('@') === -1) { return { ok: false, error: 'BAD_EMAIL' }; }

  /* Gruba zaštita: najviše 3 rezervacije po broju telefona na sat vremena */
  var cache = CacheService.getScriptCache();
  var rlKey = 'rl_' + phone.replace(/\D/g, '');
  var count = Number(cache.get(rlKey) || 0);
  if (count >= 3) { return { ok: false, error: 'RATE_LIMIT' }; }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { ok: false, error: 'BUSY_TRY_AGAIN' };
  }

  try {
    /* Ponovo proveri da je slot i dalje slobodan */
    var free = freeByStaff_(String(b.date), service, people);
    if (!free.byStaff) {
      return free.ok ? { ok: false, error: 'SLOT_TAKEN' } : free;
    }

    /* Od slobodnih u to vreme uzmi onu koja je tog dana najmanje zauzeta */
    var person = null;
    people.forEach(function (p) {
      if (free.byStaff[p.id].indexOf(String(b.time)) === -1) { return; }
      if (!person || free.load[p.id] < free.load[person.id]) { person = p; }
    });
    if (!person) { return { ok: false, error: 'SLOT_TAKEN' }; }

    var start = new Date(parts.y, parts.m - 1, parts.d, 0, timeMin, 0);
    var end = new Date(start.getTime() + service.min * 60000);

    var cal = free.cal;

    /* Ime osobe na početku naslova — po tome se zna ko je zauzet (vidi STAFF) */
    var title = person.name + ' · ' + name + ' — ' + service.sr;
    var description =
      'Usluga: ' + service.sr + ' (' + service.min + ' min)\n' +
      'Radi: ' + person.name + '\n' +
      'Ime: ' + name + '\n' +
      'Telefon: ' + phone + '\n' +
      (email ? 'Email: ' + email + '\n' : '') +
      (note ? 'Napomena: ' + note + '\n' : '') +
      '\nZakazano preko sajta ' + Utilities.formatDate(new Date(), tz_(), 'dd.MM.yyyy. HH:mm');

    var event = cal.createEvent(title, start, end, {
      description: description,
      location: CONFIG.SALON_ADDRESS
    });

    cache.put(rlKey, String(count + 1), 3600);

    notify_(event, service, person, { name: name, phone: phone, email: email, note: note }, start, end);

    return {
      ok: true,
      id: event.getId(),
      date: b.date,
      time: b.time,
      service: service.sr,
      staff: person.name,
      duration: service.min
    };
  } finally {
    lock.releaseLock();
  }
}

/* ==========================================================================
   EMAIL
   ========================================================================== */

function notify_(event, service, person, who, start, end) {
  var when = Utilities.formatDate(start, tz_(), 'EEEE, dd.MM.yyyy.') + ' u ' +
             Utilities.formatDate(start, tz_(), 'HH:mm') + '–' +
             Utilities.formatDate(end, tz_(), 'HH:mm');

  /* Salonu */
  try {
    MailApp.sendEmail({
      to: CONFIG.NOTIFY_EMAIL,
      subject: 'Nova rezervacija — ' + person.name + ' · ' + who.name + ', ' +
               Utilities.formatDate(start, tz_(), 'dd.MM. HH:mm'),
      htmlBody:
        '<h2 style="font-family:Georgia,serif;margin:0 0 12px">Nova rezervacija — ' + person.name + '</h2>' +
        '<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
        row_('Kada', when) +
        row_('Usluga', service.sr + ' (' + service.min + ' min)') +
        row_('Radi', person.name) +
        row_('Ime', who.name) +
        row_('Telefon', '<a href="tel:' + who.phone.replace(/\s/g, '') + '">' + who.phone + '</a>') +
        (who.email ? row_('Email', '<a href="mailto:' + who.email + '">' + who.email + '</a>') : '') +
        (who.note ? row_('Napomena', who.note) : '') +
        '</table>' +
        '<p style="font-family:Arial,sans-serif;font-size:13px;color:#666">' +
        'Termin je već upisan u kalendar.</p>'
    });
  } catch (e) { /* email ne sme da obori rezervaciju */ }

  /* Klijentu */
  if (CONFIG.CONFIRM_CUSTOMER && who.email) {
    try {
      MailApp.sendEmail({
        to: who.email,
        subject: CONFIG.SALON_NAME + ' — potvrda termina',
        htmlBody:
          '<h2 style="font-family:Georgia,serif;margin:0 0 12px">Vaš termin je zakazan</h2>' +
          '<p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 12px">' +
          'Dočekaće vas <strong>' + person.name + '</strong>.</p>' +
          '<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
          row_('Kada', when) +
          row_('Usluga', service.sr) +
          row_('Radi', person.name) +
          row_('Gde', CONFIG.SALON_ADDRESS) +
          '</table>' +
          '<p style="font-family:Arial,sans-serif;font-size:14px">' +
          'Ako ne možete da dođete, javite nam na <a href="tel:' +
          CONFIG.SALON_PHONE.replace(/\D/g, '') + '">' + CONFIG.SALON_PHONE + '</a>.</p>' +
          '<p style="font-family:Arial,sans-serif;font-size:13px;color:#666">' +
          CONFIG.SALON_NAME + ' · ' + CONFIG.SALON_ADDRESS + '</p>'
      });
    } catch (e) { /* isto */ }
  }
}

function row_(label, value) {
  return '<tr><td style="padding:4px 16px 4px 0;color:#777">' + label +
         '</td><td style="padding:4px 0"><strong>' + value + '</strong></td></tr>';
}

/* ==========================================================================
   POMOĆNE FUNKCIJE
   ========================================================================== */

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function tz_() {
  return Session.getScriptTimeZone();
}

function findService_(id) {
  for (var i = 0; i < CONFIG.SERVICES.length; i++) {
    if (CONFIG.SERVICES[i].id === id) { return CONFIG.SERVICES[i]; }
  }
  return null;
}

function findStaff_(id) {
  for (var i = 0; i < CONFIG.STAFF.length; i++) {
    if (CONFIG.STAFF[i].id === id) { return CONFIG.STAFF[i]; }
  }
  return null;
}

/** Osobe koje dolaze u obzir: tražena (ako radi tu uslugu) ili svi koji je rade.
    null ako tražena osoba ne radi tu uslugu. */
function staffFor_(service, staffId) {
  var ids = (!staffId || staffId === 'any') ? service.staff : [staffId];
  var out = [];
  for (var i = 0; i < ids.length; i++) {
    if (service.staff.indexOf(ids[i]) === -1) { return null; }
    var p = findStaff_(ids[i]);
    if (p) { out.push(p); }
  }
  return out.length ? out : null;
}

/** Id osobe iz naslova događaja ("Nikolina: ...", "Kaća · ...", "Ivana - ...", "Ivana"),
    ili null — tada događaj zauzima ceo salon. */
function staffFromTitle_(title) {
  var t = fold_(title).replace(/^\s+/, '');
  for (var i = 0; i < CONFIG.STAFF.length; i++) {
    var n = fold_(CONFIG.STAFF[i].name);
    if (t.indexOf(n) === 0 && /^\s*([·:|\-–—]|$)/.test(t.slice(n.length))) {
      return CONFIG.STAFF[i].id;
    }
  }
  return null;
}

/** Mala slova, bez kvačica — "KACA" i "Kaca" su isto što i "Kaća". */
function fold_(s) {
  return String(s || '').toLowerCase()
    .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'dj');
}

function parseDate_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) { return null; }
  var y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) { return null; }
  var test = new Date(y, mo - 1, d);
  if (test.getFullYear() !== y || test.getMonth() !== mo - 1 || test.getDate() !== d) { return null; }
  return { y: y, m: mo, d: d };
}

function toMinutes_(hhmm) {
  var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm));
  if (!m) { return null; }
  var h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) { return null; }
  return h * 60 + mi;
}

function pad_(n) { return (n < 10 ? '0' : '') + n; }

function inBreak_(startMin, endMin) {
  for (var i = 0; i < CONFIG.BREAKS.length; i++) {
    var b0 = toMinutes_(CONFIG.BREAKS[i][0]);
    var b1 = toMinutes_(CONFIG.BREAKS[i][1]);
    if (startMin < b1 && endMin > b0) { return true; }
  }
  return false;
}

/** Zauzeti intervali tog dana iz kalendara, sa osobom iz naslova (null = ceo salon).
    Celodnevni događaj blokira ceo dan — toj osobi, ili svima ako nema imena. */
function busyRanges_(cal, dayStart) {
  var dayEnd = new Date(dayStart.getTime() + 86400000);
  var events = cal.getEvents(dayStart, dayEnd);
  var out = [];
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    var staff = staffFromTitle_(ev.getTitle());
    if (ev.isAllDayEvent()) {
      out.push({ start: dayStart, end: dayEnd, staff: staff });
    } else {
      out.push({ start: ev.getStartTime(), end: ev.getEndTime(), staff: staff });
    }
  }
  return out;
}

/** Preklapanje, s tim da između dva termina mora da ostane `buffer` ms
    — i posle zauzetog termina i posle novog. */
function isBusy_(ranges, start, end, buffer) {
  for (var i = 0; i < ranges.length; i++) {
    if (start.getTime() < ranges[i].end.getTime() + buffer &&
        end.getTime() + buffer > ranges[i].start.getTime()) { return true; }
  }
  return false;
}

/* ==========================================================================
   DIJAGNOSTIKA
   Pokreni funkciju `dijagnostika` iz editora (Run), pa otvori Execution log.
   Isto se dobija i u browseru: .../exec?action=debug&token=TVOJ_TOKEN
   ========================================================================== */

function debug_(dateStr, serviceId, staffId) {
  var out = {
    ok: true,
    nalogKojiIzvrsava: null,
    vremenskaZonaSkripte: tz_(),
    sadaPoSkripti: null,
    calendarIdIzConfig: CONFIG.CALENDAR_ID,
    kalendarPronadjen: false,
    nazivKalendara: null,
    sviKalendariNaNalogu: [],
    datum: dateStr,
    danUNedelji: null,
    radnoVremeTogDana: null,
    dogadjajiTogDana: [],
    slotovi: null,
    dijagnoza: []
  };

  try { out.nalogKojiIzvrsava = Session.getEffectiveUser().getEmail(); } catch (e) { }
  out.sadaPoSkripti = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm:ss');

  /* Ako datum nije prosleđen, uzmi sutra */
  if (!parseDate_(dateStr)) {
    dateStr = Utilities.formatDate(new Date(Date.now() + 86400000), tz_(), 'yyyy-MM-dd');
    out.datum = dateStr;
  }

  /* Koji sve kalendari postoje na nalogu koji izvršava skriptu */
  try {
    var all = CalendarApp.getAllCalendars();
    for (var i = 0; i < all.length; i++) {
      out.sviKalendariNaNalogu.push({ naziv: all[i].getName(), id: all[i].getId() });
    }
  } catch (e) {
    out.dijagnoza.push('Ne mogu da pročitam listu kalendara: ' + e);
  }

  var cal = null;
  try { cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID); } catch (e) { }

  if (!cal) {
    out.dijagnoza.push(
      'KALENDAR NIJE PRONAĐEN. Nalog koji izvršava skriptu (' + out.nalogKojiIzvrsava +
      ') ne vidi kalendar sa tim ID-jem. Uporedi CALENDAR_ID sa listom u ' +
      '"sviKalendariNaNalogu" i prekopiraj tačan id.');
    return out;
  }

  out.kalendarPronadjen = true;
  out.nazivKalendara = cal.getName();

  var parts = parseDate_(dateStr);
  var dayStart = new Date(parts.y, parts.m - 1, parts.d, 0, 0, 0);
  var dow = dayStart.getDay();
  out.danUNedelji = dow + ' (' + ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub'][dow] + ')';
  out.radnoVremeTogDana = CONFIG.HOURS[dow] || 'NERADAN DAN';

  var events = cal.getEvents(dayStart, new Date(dayStart.getTime() + 86400000));
  for (var j = 0; j < events.length; j++) {
    var owner = findStaff_(staffFromTitle_(events[j].getTitle()));
    out.dogadjajiTogDana.push({
      naslov: events[j].getTitle(),
      zauzima: owner ? owner.name : 'ceo salon (nema imena na početku naslova)',
      celodnevni: events[j].isAllDayEvent(),
      od: Utilities.formatDate(events[j].getStartTime(), tz_(), 'yyyy-MM-dd HH:mm'),
      do: Utilities.formatDate(events[j].getEndTime(), tz_(), 'yyyy-MM-dd HH:mm')
    });
  }

  out.slotovi = slots_(dateStr, serviceId, staffId);

  /* Zaključci */
  if (!CONFIG.HOURS[dow]) {
    out.dijagnoza.push('Taj dan je u CONFIG.HOURS označen kao neradan.');
  }
  for (var k = 0; k < out.dogadjajiTogDana.length; k++) {
    if (out.dogadjajiTogDana[k].celodnevni) {
      out.dijagnoza.push('Celodnevni događaj "' + out.dogadjajiTogDana[k].naslov +
        '" blokira ceo dan (' + out.dogadjajiTogDana[k].zauzima + '). ' +
        'Obriši ga ili ga pretvori u događaj sa vremenom.');
    }
  }
  if (out.slotovi && out.slotovi.ok && out.slotovi.slots && !out.slotovi.slots.length &&
      !out.dogadjajiTogDana.length && CONFIG.HOURS[dow]) {
    out.dijagnoza.push('Dan je radni, kalendar je prazan, a nema slotova — ' +
      'proveri da li se vremenska zona skripte (' + tz_() + ') poklapa sa Europe/Belgrade.');
  }
  if (out.slotovi && out.slotovi.ok && out.slotovi.slots && out.slotovi.slots.length) {
    out.dijagnoza.push('Sve radi — za taj dan ima ' + out.slotovi.slots.length + ' slobodnih termina.');
  }

  return out;
}

/** Pokreni ovo iz editora i pogledaj Execution log. */
function dijagnostika() {
  var res = debug_('', 'zensko-sisanje', '');
  Logger.log(JSON.stringify(res, null, 2));
  return res;
}
