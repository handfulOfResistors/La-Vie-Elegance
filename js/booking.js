/* ==========================================================================
   La Vie Elegance — widget za zakazivanje
   Vodi korisnika kroz korake i razgovara sa Google Apps Script backendom.
   Nema AI — svaki korak je unapred definisan, pa ne može da pogreši.

   Podešavanje: window.LVE_BOOKING = { url: "...", token: "..." } u index.html
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.LVE_BOOKING || {};
  var API = CFG.url || "";
  var TOKEN = CFG.token || "";
  /* demo: true → widget radi bez backenda, sa izmišljenim terminima.
     Služi samo za pregled izgleda pre nego što se Apps Script postavi. */
  var DEMO = !!CFG.demo && !API;

  /* ======================================================================
     TEKSTOVI
     ====================================================================== */
  var T = {
    sr: {
      fab: "Zakaži termin",
      title: "Zakazivanje",
      subtitle: "Odgovorite na nekoliko pitanja",
      close: "Zatvori zakazivanje",
      greet: "Dobar dan! Pomoći ću vam da zakažete termin. Koja usluga vas zanima?",
      askCategory: "Koja usluga vas zanima?",
      askService: "Koju tačno?",
      askStaff: "Kod koga biste želeli da dođete?",
      anyStaff: "Svejedno",
      anyStaffMeta: "ko je slobodan",
      askDate: "Odlično. Kog dana biste došli?",
      askTime: "Evo slobodnih termina za {date}:",
      askName: "Na čije ime da zapišem termin?",
      askPhone: "Broj telefona, da vas pozovemo ako nešto iskrsne:",
      askEmail: "Email za potvrdu? (nije obavezno)",
      skip: "Preskoči",
      confirmTitle: "Da proverimo:",
      confirm: "Potvrdi termin",
      restart: "Počni ispočetka",
      sending: "Upisujem termin…",
      done: "Gotovo! Termin je zakazan. Vidimo se!",
      doneStaff: "Dočekaće vas {name}.",
      doneMail: "Potvrdu smo poslali na {email}.",
      again: "Zakaži još jedan termin",
      noSlots: "Tog dana nema slobodnih termina. Probajte drugi datum.",
      closed: "Tog dana ne radimo. Izaberite drugi datum.",
      moreDays: "Prikaži još dana",
      back: "Nazad",
      labelService: "Usluga",
      labelStaff: "Radi",
      labelWhen: "Termin",
      labelName: "Ime",
      labelPhone: "Telefon",
      labelEmail: "Email",
      errName: "Upišite ime, bar dva slova.",
      errPhone: "Broj telefona ne izgleda ispravno.",
      errEmail: "Email adresa ne izgleda ispravno.",
      errTaken: "Neko je upravo uzeo taj termin. Izaberite drugi:",
      errNet: "Ne mogu da se povežem sa kalendarom. Pozovite nas na 061/6611-269.",
      errOff: "Online zakazivanje još nije aktivirano. Pozovite nas na 061/6611-269.",
      errRate: "Previše pokušaja sa ovog broja. Pozovite nas na 061/6611-269.",
      minutes: "min",
      send: "Pošalji",
      days: ["nedelja", "ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota"],
      today: "danas",
      tomorrow: "sutra"
    },
    en: {
      fab: "Book now",
      title: "Booking",
      subtitle: "Answer a few questions",
      close: "Close booking",
      greet: "Hello! I'll help you book an appointment. Which service are you interested in?",
      askCategory: "Which service are you interested in?",
      askService: "Which one exactly?",
      askStaff: "Who would you like to book with?",
      anyStaff: "No preference",
      anyStaffMeta: "whoever is free",
      askDate: "Great. Which day would you like to come?",
      askTime: "Here are the free slots for {date}:",
      askName: "What name should I put the appointment under?",
      askPhone: "A phone number, so we can reach you if anything changes:",
      askEmail: "Email for confirmation? (optional)",
      skip: "Skip",
      confirmTitle: "Let's check:",
      confirm: "Confirm booking",
      restart: "Start over",
      sending: "Booking your slot…",
      done: "Done! Your appointment is booked. See you soon!",
      doneStaff: "{name} will be looking after you.",
      doneMail: "We've sent a confirmation to {email}.",
      again: "Book another appointment",
      noSlots: "No free slots that day. Try another date.",
      closed: "We're closed that day. Please pick another date.",
      moreDays: "Show more days",
      back: "Back",
      labelService: "Service",
      labelStaff: "With",
      labelWhen: "When",
      labelName: "Name",
      labelPhone: "Phone",
      labelEmail: "Email",
      errName: "Please enter a name, at least two letters.",
      errPhone: "That phone number doesn't look right.",
      errEmail: "That email address doesn't look right.",
      errTaken: "Someone just took that slot. Please pick another:",
      errNet: "I can't reach the calendar. Please call us on +381 61 6611 269.",
      errOff: "Online booking isn't live yet. Please call us on +381 61 6611 269.",
      errRate: "Too many attempts from this number. Please call us on +381 61 6611 269.",
      minutes: "min",
      send: "Send",
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      today: "today",
      tomorrow: "tomorrow"
    }
  };

  var lang = "sr";
  function t(key) { return (T[lang] && T[lang][key]) !== undefined ? T[lang][key] : T.sr[key]; }

  /* ======================================================================
     STANJE
     ====================================================================== */
  var remote = null;          // config sa servera
  var configPromise = null;   // zahtev za config koji je u toku ili završen
  var runId = 0;              // koji start() je poslednji — stariji ne crtaju ništa
  var daysShown = 7;
  /* staff: izabrana osoba, ili null = svejedno */
  var answers = { service: null, staff: null, date: null, time: null, name: "", phone: "", email: "" };

  var el = {};                // reference na DOM

  /* ======================================================================
     IZGRADNJA DOM-a
     ====================================================================== */
  function build() {
    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "bk-fab";
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>' +
      '<path d="M8.5 15.5l2 2 4.5-4.5"/></svg><span class="bk-fab__label"></span>';
    document.body.appendChild(fab);

    var panel = document.createElement("section");
    panel.className = "bk-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-labelledby", "bk-title");
    panel.hidden = true;
    panel.innerHTML =
      '<header class="bk-head">' +
        '<div><p class="bk-head__title" id="bk-title"></p>' +
        '<p class="bk-head__sub"></p></div>' +
        '<button type="button" class="bk-close">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<path d="M5 5l14 14M19 5L5 19"/></svg>' +
        '</button>' +
      '</header>' +
      '<div class="bk-log" aria-live="polite"></div>' +
      '<div class="bk-actions"></div>';
    document.body.appendChild(panel);

    el.fab = fab;
    el.fabLabel = fab.querySelector(".bk-fab__label");
    el.panel = panel;
    el.title = panel.querySelector(".bk-head__title");
    el.sub = panel.querySelector(".bk-head__sub");
    el.close = panel.querySelector(".bk-close");
    el.log = panel.querySelector(".bk-log");
    el.actions = panel.querySelector(".bk-actions");

    fab.addEventListener("click", open);
    el.close.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { close(); }
    });

    /* Dugmad "Zakaži termin" na stranici otvaraju widget umesto poziva */
    document.querySelectorAll('[data-booking-open]').forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); open(); });
    });

    paintStatic();
  }

  function paintStatic() {
    el.fabLabel.textContent = t("fab");
    el.fab.setAttribute("aria-label", t("fab"));
    el.title.textContent = t("title");
    el.sub.textContent = t("subtitle");
    el.close.setAttribute("aria-label", t("close"));
  }

  /* ======================================================================
     OTVARANJE / ZATVARANJE
     ====================================================================== */
  function open() {
    el.panel.hidden = false;
    el.fab.classList.add("is-hidden");
    if (!el.log.childNodes.length) { start(); }
    el.close.focus();
  }

  function close() {
    el.panel.hidden = true;
    el.fab.classList.remove("is-hidden");
    el.fab.focus();
  }

  function start() {
    var run = ++runId;
    answers = { service: null, staff: null, date: null, time: null, name: "", phone: "", email: "" };
    daysShown = 7;
    el.log.innerHTML = "";
    el.actions.innerHTML = "";

    if (!API && !DEMO) { say(t("errOff"), "bot"); return; }

    if (remote) { stepCategory(); return; }

    /* Config još nije stigao (klik odmah po učitavanju) — čeka se isti zahtev */
    busy(true);
    loadConfig().then(function () {
      if (run !== runId) { return; }
      busy(false);
      stepCategory();
    }).catch(function () {
      if (run !== runId) { return; }
      busy(false);
      say(t("errNet"), "bot");
      choices([{ label: t("restart"), ghost: true, onPick: start }]);
    });
  }

  /* ======================================================================
     KORACI
     ====================================================================== */
  function stepCategory(again) {
    say(t(again ? "askCategory" : "greet"), "bot");

    var cats = (remote.categories || []).filter(function (c) { return servicesIn(c.id).length; });
    /* Backend bez kategorija (stara verzija Code.gs) — sve usluge odjednom */
    if (!cats.length) { choices(serviceItems(remote.services)); return; }

    choices(cats.map(function (c) {
      var list = servicesIn(c.id);
      return {
        label: label(c),
        onPick: function () {
          if (list.length === 1) { pickService(list[0]); return; }
          say(label(c), "me");
          stepService(list);
        }
      };
    }));
  }

  function stepService(list) {
    say(t("askService"), "bot");
    var items = serviceItems(list);
    items.push({ label: t("back"), ghost: true, onPick: function () { stepCategory(true); } });
    choices(items);
  }

  function serviceItems(list) {
    return list.map(function (s) {
      return {
        label: label(s),
        meta: s.min + " " + t("minutes"),
        onPick: function () { pickService(s); }
      };
    });
  }

  function pickService(s) {
    answers.service = s;
    say(label(s), "me");
    var people = staffOf(s);
    if (people.length > 1) { stepStaff(people); return; }
    answers.staff = people[0] || null;
    stepDate();
  }

  function stepStaff(people) {
    say(t("askStaff"), "bot");
    var items = people.map(function (p) {
      return {
        label: p.name,
        onPick: function () { answers.staff = p; say(p.name, "me"); stepDate(); }
      };
    });
    items.push({
      label: t("anyStaff"),
      meta: t("anyStaffMeta"),
      onPick: function () { answers.staff = null; say(t("anyStaff"), "me"); stepDate(); }
    });
    items.push({ label: t("back"), ghost: true, onPick: function () { stepCategory(true); } });
    choices(items);
  }

  function stepDate() {
    say(t("askDate"), "bot");
    renderDays();
  }

  function renderDays() {
    var list = openDays(daysShown);
    var items = list.map(function (d) {
      return {
        label: dayLabel(d),
        meta: dayMeta(d),
        onPick: function () {
          answers.date = ymd(d);
          say(dayLabel(d) + ", " + dayMeta(d), "me");
          stepTime();
        }
      };
    });
    items.push({
      label: t("moreDays"),
      ghost: true,
      onPick: function () { daysShown += 7; el.actions.innerHTML = ""; renderDays(); }
    });
    items.push({ label: t("restart"), ghost: true, onPick: start });
    choices(items);
  }

  function stepTime() {
    busy(true);
    api("slots", { date: answers.date, service: answers.service.id, staff: staffParam() })
      .then(function (res) {
        busy(false);
        if (!res || !res.ok) {
          /* Kod greške sa servera ide u konzolu — korisniku ne znači ništa,
             ali pri postavljanju tačno kaže šta ne valja (npr. NO_CALENDAR). */
          if (res && res.error) { console.warn("[booking] backend:", res.error); }
          throw new Error("slots");
        }
        if (!res.slots.length) {
          say(res.reason === "CLOSED" ? t("closed") : t("noSlots"), "bot");
          renderDays();
          return;
        }
        say(t("askTime").replace("{date}", humanDate(answers.date)), "bot");
        var items = res.slots.map(function (s) {
          return {
            label: s,
            compact: true,
            onPick: function () {
              answers.time = s;
              say(s, "me");
              stepName();
            }
          };
        });
        items.push({ label: t("back"), ghost: true, onPick: function () { stepDate(); } });
        choices(items);
      })
      .catch(function () { busy(false); say(t("errNet"), "bot"); });
  }

  function stepName() {
    say(t("askName"), "bot");
    input({
      type: "text",
      autocomplete: "name",
      validate: function (v) { return v.trim().length >= 2 ? null : t("errName"); },
      onDone: function (v) {
        answers.name = v.trim();
        say(answers.name, "me");
        stepPhone();
      }
    });
  }

  function stepPhone() {
    say(t("askPhone"), "bot");
    input({
      type: "tel",
      autocomplete: "tel",
      validate: function (v) {
        return v.replace(/\D/g, "").length >= 6 ? null : t("errPhone");
      },
      onDone: function (v) {
        answers.phone = v.trim();
        say(answers.phone, "me");
        stepEmail();
      }
    });
  }

  function stepEmail() {
    say(t("askEmail"), "bot");
    input({
      type: "email",
      autocomplete: "email",
      optional: true,
      validate: function (v) {
        if (!v.trim()) { return null; }
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : t("errEmail");
      },
      onDone: function (v) {
        answers.email = v.trim();
        if (answers.email) { say(answers.email, "me"); }
        stepConfirm();
      }
    });
  }

  function stepConfirm() {
    var s = answers.service;
    var html =
      '<p class="bk-sum__title">' + esc(t("confirmTitle")) + '</p>' +
      '<dl class="bk-sum">' +
      dt(t("labelService"), label(s) + " · " + s.min + " " + t("minutes")) +
      (answers.staff ? dt(t("labelStaff"), answers.staff.name) : "") +
      dt(t("labelWhen"), humanDate(answers.date) + ", " + answers.time) +
      dt(t("labelName"), answers.name) +
      dt(t("labelPhone"), answers.phone) +
      (answers.email ? dt(t("labelEmail"), answers.email) : "") +
      '</dl>';
    say(html, "bot", true);

    choices([
      { label: t("confirm"), primary: true, onPick: submit },
      { label: t("restart"), ghost: true, onPick: start }
    ]);
  }

  function submit() {
    busy(true);
    say(t("sending"), "bot");

    post({
      action: "book",
      service: answers.service.id,
      staff: staffParam(),
      date: answers.date,
      time: answers.time,
      name: answers.name,
      phone: answers.phone,
      email: answers.email,
      hp: el.hp ? el.hp.value : ""
    }).then(function (res) {
      busy(false);
      if (res && res.ok) {
        say(t("done"), "bot");
        if (res.staff) { say(t("doneStaff").replace("{name}", res.staff), "bot"); }
        if (answers.email) { say(t("doneMail").replace("{email}", answers.email), "bot"); }
        choices([{ label: t("again"), ghost: true, onPick: start }]);
        return;
      }
      if (res && res.error === "SLOT_TAKEN") { say(t("errTaken"), "bot"); stepTime(); return; }
      if (res && res.error === "RATE_LIMIT") { say(t("errRate"), "bot"); return; }
      say(t("errNet"), "bot");
      choices([{ label: t("restart"), ghost: true, onPick: start }]);
    }).catch(function () {
      busy(false);
      say(t("errNet"), "bot");
      choices([{ label: t("restart"), ghost: true, onPick: start }]);
    });
  }

  /* ======================================================================
     USLUGE I ZAPOSLENI
     ====================================================================== */
  function label(x) { return lang === "en" ? x.en : x.sr; }

  function servicesIn(catId) {
    return remote.services.filter(function (s) { return s.cat === catId; });
  }

  /* Ko radi uslugu — prazno ako backend ne šalje zaposlene */
  function staffOf(s) {
    var all = remote.staff || [];
    return (s.staff || []).map(function (id) {
      return all.filter(function (p) { return p.id === id; })[0];
    }).filter(Boolean);
  }

  function staffParam() { return answers.staff ? answers.staff.id : "any"; }

  /* ======================================================================
     UI GRADIVNI ELEMENTI
     ====================================================================== */
  function say(text, who, isHtml) {
    var b = document.createElement("div");
    b.className = "bk-msg bk-msg--" + (who || "bot");
    if (isHtml) { b.innerHTML = text; } else { b.textContent = text; }
    el.log.appendChild(b);
    el.log.scrollTop = el.log.scrollHeight;
  }

  function choices(items) {
    el.actions.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "bk-choices";
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "bk-choice" +
        (it.primary ? " bk-choice--primary" : "") +
        (it.ghost ? " bk-choice--ghost" : "") +
        (it.compact ? " bk-choice--compact" : "");
      b.innerHTML = '<span>' + esc(it.label) + '</span>' +
        (it.meta ? '<em>' + esc(it.meta) + '</em>' : "");
      b.addEventListener("click", function () {
        el.actions.innerHTML = "";
        it.onPick();
      });
      wrap.appendChild(b);
    });
    el.actions.appendChild(wrap);
    el.log.scrollTop = el.log.scrollHeight;
  }

  function input(opts) {
    el.actions.innerHTML = "";
    var form = document.createElement("form");
    form.className = "bk-form";
    form.noValidate = true;

    var field = document.createElement("input");
    field.type = opts.type || "text";
    field.className = "bk-input";
    field.autocomplete = opts.autocomplete || "off";
    field.setAttribute("aria-label", t("title"));

    /* Honeypot — pravi korisnik ga ne vidi, bot ga popuni */
    var hp = document.createElement("input");
    hp.type = "text";
    hp.className = "bk-hp";
    hp.tabIndex = -1;
    hp.setAttribute("aria-hidden", "true");
    hp.autocomplete = "off";
    el.hp = hp;

    var send = document.createElement("button");
    send.type = "submit";
    send.className = "bk-send";
    send.textContent = t("send");

    form.appendChild(field);
    form.appendChild(hp);
    form.appendChild(send);

    var err = document.createElement("p");
    err.className = "bk-err";
    err.hidden = true;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = opts.validate ? opts.validate(field.value) : null;
      if (msg) { err.textContent = msg; err.hidden = false; field.focus(); return; }
      el.actions.innerHTML = "";
      opts.onDone(field.value);
    });

    el.actions.appendChild(form);
    el.actions.appendChild(err);

    if (opts.optional) {
      var skip = document.createElement("button");
      skip.type = "button";
      skip.className = "bk-choice bk-choice--ghost bk-skip";
      skip.textContent = t("skip");
      skip.addEventListener("click", function () {
        el.actions.innerHTML = "";
        opts.onDone("");
      });
      el.actions.appendChild(skip);
    }

    field.focus();
    el.log.scrollTop = el.log.scrollHeight;
  }

  function busy(on) {
    el.panel.classList.toggle("is-busy", !!on);
  }

  function dt(label, value) {
    return '<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ======================================================================
     DATUMI
     ====================================================================== */
  function openDays(count) {
    var out = [];
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var max = remote && remote.maxAdvanceDays ? remote.maxAdvanceDays : 60;
    for (var i = 0; i <= max && out.length < count; i++) {
      var day = new Date(d.getTime() + i * 86400000);
      var h = remote && remote.hours ? remote.hours[day.getDay()] : null;
      if (h) { out.push(day); }
    }
    return out;
  }

  function ymd(d) {
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
  }

  function p2(n) { return (n < 10 ? "0" : "") + n; }

  function dayLabel(d) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var diff = Math.round((d - today) / 86400000);
    if (diff === 0) { return cap(t("today")); }
    if (diff === 1) { return cap(t("tomorrow")); }
    return cap(t("days")[d.getDay()]);
  }

  function dayMeta(d) { return p2(d.getDate()) + "." + p2(d.getMonth() + 1) + "."; }

  function humanDate(s) {
    var p = s.split("-");
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return cap(t("days")[d.getDay()]) + " " + p2(d.getDate()) + "." + p2(d.getMonth() + 1) + ".";
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ======================================================================
     KOMUNIKACIJA SA APPS SCRIPT-om
     ====================================================================== */
  /* Lažni podaci za demo režim */
  var DEMO_DATA = {
    config: {
      maxAdvanceDays: 60,
      hours: { 0: ["11:00", "20:00"], 1: ["11:00", "20:00"], 2: ["11:00", "20:00"], 3: ["11:00", "20:00"],
               4: ["11:00", "20:00"], 5: ["11:00", "20:00"], 6: ["11:00", "20:00"] },
      staff: [
        { id: "ivana", name: "Ivana" },
        { id: "nikolina", name: "Nikolina" },
        { id: "kaca", name: "Kaća" }
      ],
      categories: [
        { id: "kosa", sr: "Kosa", en: "Hair" },
        { id: "nokti", sr: "Nokti", en: "Nails" },
        { id: "depilacija", sr: "Depilacija", en: "Waxing" },
        { id: "trepavice", sr: "Trepavice i obrve", en: "Lashes and brows" },
        { id: "sminka", sr: "Šminka", en: "Make-up" }
      ],
      services: [
        { id: "zensko-sisanje", cat: "kosa", sr: "Žensko šišanje", en: "Women's haircut", min: 30, staff: ["ivana"] },
        { id: "musko-sisanje", cat: "kosa", sr: "Muško šišanje", en: "Men's haircut", min: 30, staff: ["ivana"] },
        { id: "decje-sisanje", cat: "kosa", sr: "Dečje šišanje", en: "Children's haircut", min: 30, staff: ["ivana"] },
        { id: "feniranje", cat: "kosa", sr: "Pranje i feniranje", en: "Wash and blow-dry", min: 30, staff: ["ivana"] },
        { id: "farbanje", cat: "kosa", sr: "Farbanje", en: "Colour", min: 60, staff: ["ivana"] },
        { id: "pramenovi", cat: "kosa", sr: "Pramenovi / balayage / ombre", en: "Highlights / balayage / ombré", min: 180, staff: ["ivana"] },
        { id: "preliv", cat: "kosa", sr: "Preliv / toner", en: "Gloss / toner", min: 30, staff: ["ivana"] },
        { id: "svecana-frizura", cat: "kosa", sr: "Svečana frizura", en: "Occasion hair", min: 45, staff: ["ivana"] },
        { id: "svadbena-frizura", cat: "kosa", sr: "Svadbena frizura", en: "Bridal hair", min: 60, staff: ["ivana"] },
        { id: "tretman-kose", cat: "kosa", sr: "Tretman kose / maska", en: "Hair treatment / mask", min: 45, staff: ["ivana"] },
        { id: "keratin", cat: "kosa", sr: "Keratin / botoks za kosu", en: "Keratin / hair botox", min: 45, staff: ["ivana"] },
        { id: "brada", cat: "kosa", sr: "Uređivanje brade", en: "Beard grooming", min: 30, staff: ["ivana"] },
        { id: "manikir", cat: "nokti", sr: "Manikir", en: "Manicure", min: 90, staff: ["nikolina", "kaca"] },
        { id: "gel-lak", cat: "nokti", sr: "Gel lak", en: "Gel polish", min: 90, staff: ["nikolina", "kaca"] },
        { id: "nadogradnja-noktiju", cat: "nokti", sr: "Nadogradnja noktiju", en: "Nail extensions", min: 120, staff: ["nikolina", "kaca"] },
        { id: "korekcija-noktiju", cat: "nokti", sr: "Korekcija noktiju", en: "Nail infill", min: 60, staff: ["nikolina", "kaca"] },
        { id: "pedikir", cat: "nokti", sr: "Pedikir", en: "Pedicure", min: 60, staff: ["nikolina"] },
        { id: "depilacija-noge", cat: "depilacija", sr: "Depilacija — noge", en: "Waxing — legs", min: 30, staff: ["nikolina"] },
        { id: "depilacija-ruke", cat: "depilacija", sr: "Depilacija — ruke", en: "Waxing — arms", min: 30, staff: ["nikolina"] },
        { id: "depilacija-lice", cat: "depilacija", sr: "Depilacija — lice", en: "Waxing — face", min: 30, staff: ["nikolina"] },
        { id: "depilacija-intimna", cat: "depilacija", sr: "Depilacija — intimna zona", en: "Waxing — intimate area", min: 30, staff: ["nikolina"] },
        { id: "nadogradnja-trepavica", cat: "trepavice", sr: "Nadogradnja trepavica", en: "Lash extensions", min: 90, staff: ["kaca"] },
        { id: "korekcija-trepavica", cat: "trepavice", sr: "Korekcija trepavica", en: "Lash infill", min: 60, staff: ["kaca"] },
        { id: "lifting-trepavica", cat: "trepavice", sr: "Lifting trepavica", en: "Lash lift", min: 30, staff: ["kaca"] },
        { id: "obrve", cat: "trepavice", sr: "Regulacija obrva", en: "Brow shaping", min: 30, staff: ["ivana"] },
        { id: "sminka", cat: "sminka", sr: "Profesionalna šminka", en: "Professional make-up", min: 60, staff: ["nikolina"] }
      ]
    },
    slots: ["11:00", "11:45", "12:30", "13:15", "14:00", "15:30", "16:45", "18:00"]
  };

  function demo_(action) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (action === "config") { resolve({ ok: true, config: DEMO_DATA.config }); }
        else if (action === "slots") { resolve({ ok: true, slots: DEMO_DATA.slots }); }
        else { resolve({ ok: true, demo: true }); }
      }, 350);
    });
  }

  function api(action, params) {
    if (DEMO) { return demo_(action); }
    var q = "?action=" + encodeURIComponent(action) + "&token=" + encodeURIComponent(TOKEN);
    Object.keys(params || {}).forEach(function (k) {
      q += "&" + k + "=" + encodeURIComponent(params[k]);
    });
    return fetch(API + q, { method: "GET" }).then(function (r) { return r.json(); });
  }

  function post(payload) {
    if (DEMO) { return demo_("book"); }
    payload.token = TOKEN;
    return fetch(API, {
      method: "POST",
      /* text/plain namerno — izbegava CORS preflight koji Apps Script ne podržava */
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  /* Config se traži odmah pri učitavanju stranice, da chat ne čeka na klik.
     Svi dobijaju isti zahtev; posle greške sledeći poziv šalje novi. */
  function loadConfig() {
    if (configPromise) { return configPromise; }
    configPromise = api("config", {}).then(function (res) {
      if (!res || !res.ok) { throw new Error("config"); }
      remote = res.config;
      saveCachedConfig(res.config);
      return remote;
    });
    configPromise.catch(function () { configPromise = null; });
    return configPromise;
  }

  /* Poslednji config se čuva u browseru — pri ponovnoj poseti chat se
     otvara odmah, a sveža verzija stiže u pozadini (loadConfig). */
  var CACHE_KEY = "lve-booking-config";

  function readCachedConfig() {
    if (DEMO) { return null; }
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      return c && c.config && c.config.services ? c.config : null;
    } catch (e) { return null; }
  }

  function saveCachedConfig(config) {
    if (DEMO) { return; }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ config: config, at: Date.now() }));
    } catch (e) { }
  }

  /* ======================================================================
     JEZIK
     ====================================================================== */
  function setLang(next) {
    if (next === lang) { return; }
    lang = next;
    paintStatic();
    if (el.log && el.log.childNodes.length) { start(); }
  }

  document.addEventListener("lve:langchange", function (e) {
    setLang(e.detail && e.detail.lang === "en" ? "en" : "sr");
  });

  /* ---------------------------------------------------------------------- */
  function init() {
    /* Bez backenda i bez demo režima widget se uopšte ne pojavljuje —
       dugmad "Zakaži termin" tada rade kao obični tel: linkovi. */
    if (!API && !DEMO) { return; }
    try { lang = localStorage.getItem("lve-lang") === "en" ? "en" : "sr"; } catch (e) { }
    remote = readCachedConfig();
    build();
    loadConfig();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
