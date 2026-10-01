/* ==========================================================================
   La Vie Elegance — main.js
   1. Rečnik prevoda (SR / EN)   2. Prebacivanje jezika
   3. Mobilni meni               4. Header na skrol + aktivna sekcija
   5. Scroll animacije           6. Godina u footeru
   ========================================================================== */
(function () {
  "use strict";

  /* ======================================================================
     1. REČNIK PREVODA
     Dodavanje novog jezika: kopiraj ceo `sr` objekat, prevedi vrednosti,
     dodaj ga ispod kao npr. `de: { ... }` i dodaj dugme u header-u
     (<button class="lang__btn" data-lang="de">DE</button>).
     ====================================================================== */
  var translations = {
    sr: {
      meta: {
        title: "La Vie Elegance — frizersko-kozmetički salon u Nišu",
        description: "Frizersko-kozmetički salon La Vie Elegance, Cara Dušana 128A, Niš. Šišanje, farbanje, balayage, svečane frizure, nokti, depilacija, trepavice i šminka. Zakažite termin: 061/6611-269."
      },
      a11y: {
        skip: "Preskoči na sadržaj",
        mainNav: "Glavna navigacija",
        openMenu: "Otvori meni",
        closeMenu: "Zatvori meni",
        langGroup: "Izbor jezika",
        scrollDown: "Skroluj naniže"
      },
      nav: {
        home: "Početna", about: "O nama", services: "Usluge",
        team: "Tim", contact: "Kontakt", cta: "Zakaži termin"
      },
      hero: {
        eyebrow: "Frizersko-kozmetički salon · Niš",
        title: "La Vie Elegance",
        tagline: "Stil, nega i umetnost u savršenom skladu",
        ctaCall: "Pozovi 061/6611-269",
        ctaServices: "Pogledaj usluge",
        address: "Cara Dušana 128A, Niš",
        imgAlt: "Enterijer salona La Vie Elegance"
      },
      about: {
        eyebrow: "O nama",
        title: "Salon u kome se stil i nega sreću",
        p1: "La Vie Elegance je frizersko-kozmetički salon u Nišu, u Cara Dušana 128A. Pod vođstvom Ivane Pešić, salon od 2025. godine okuplja tim koji pokriva sve — od svakodnevnog šišanja i feniranja, preko farbanja i svečanih frizura, do nege noktiju, depilacije, trepavica i šminke.",
        p2: "Svaki termin počinje razgovorom. Pre nego što uzmemo makaze ili četkicu, saslušamo šta želite, pogledamo strukturu kose i predložimo ono što će vam zaista stajati i što ćete moći sami da održavate.",
        p3: "Radimo u prijatnom prostoru, sa proverenim profesionalnim preparatima i bez žurbe. Termini se zakazuju unapred, telefonom ili online.",
        h1: "Iskusan tim",
        h2: "Profesionalni preparati",
        h3: "Individualni pristup",
        imgAlt: "Radni prostor salona La Vie Elegance",
        rating: "prosečna ocena, 16 recenzija na SrediMe"
      },
      services: {
        eyebrow: "Usluge",
        title: "Šta radimo",
        lead: "Za cene i dostupne termine pozovite nas — rado ćemo posavetovati šta vam najviše odgovara.",
        s1: {
          title: "Frizerske usluge",
          i1: "Žensko, muško i dečje šišanje", i2: "Pranje i feniranje",
          i3: "Farbanje, preliv i toner", i4: "Pramenovi, balayage i ombre",
          i5: "Svečane i svadbene frizure", i6: "Tretmani kose, keratin i botoks",
          i7: "Uređivanje brade"
        },
        s2: { title: "Nokti", i1: "Manikir", i2: "Pedikir", i3: "Gel lak", i4: "Nadogradnja i korekcija noktiju" },
        s3: { title: "Depilacija voskom", i1: "Noge", i2: "Ruke", i3: "Lice", i4: "Intimna zona" },
        s4: {
          title: "Trepavice i obrve",
          i1: "Nadogradnja trepavica", i2: "Korekcija trepavica",
          i3: "Lifting trepavica", i4: "Regulacija obrva"
        },
        s5: { title: "Šminka", i1: "Profesionalna šminka za svečane prilike" }
      },
      team: {
        eyebrow: "Tim",
        title: "Ljudi koji rade sa vama",
        m1: "Vlasnica i frizer — sve frizerske usluge, obrve",
        m2: "Nokti, pedikir, depilacija, šminka",
        m3: "Trepavice, nokti"
      },
      contact: {
        eyebrow: "Kontakt",
        title: "Gde smo i kada radimo",
        addressLabel: "Adresa",
        phoneLabel: "Telefon",
        hoursTitle: "Radno vreme",
        everyDay: "Svakog dana",
        hoursNote: "Radimo isključivo po zakazanim terminima.",
        mapTitle: "Mapa — Cara Dušana 128A, Niš",
        bookOnline: "Zakaži online",
        bookNote: "Ili nas jednostavno pozovite na 061/6611-269."
      },
      footer: {
        legal: "Ivana Pešić PR Frizersko kozmetički salon La Vie Elegance Niš · PIB 115286286",
        top: "Nazad na vrh ↑",
        rights: "Sva prava zadržana.",
        credit: "Izrada sajta:"
      }
    },

    en: {
      meta: {
        title: "La Vie Elegance — Hair & Beauty Salon in Niš",
        description: "La Vie Elegance hair and beauty salon at Cara Dušana 128A, Niš. Cuts, colour, balayage, occasion hair, nails, waxing, lash extensions and make-up. Book on +381 61 6611 269."
      },
      a11y: {
        skip: "Skip to content",
        mainNav: "Main navigation",
        openMenu: "Open menu",
        closeMenu: "Close menu",
        langGroup: "Language selection",
        scrollDown: "Scroll down"
      },
      nav: {
        home: "Home", about: "About", services: "Services",
        team: "Team", contact: "Contact", cta: "Book now"
      },
      hero: {
        eyebrow: "Hair & beauty salon · Niš",
        title: "La Vie Elegance",
        tagline: "Style, care and artistry in perfect harmony",
        ctaCall: "Call +381 61 6611 269",
        ctaServices: "See our services",
        address: "Cara Dušana 128A, Niš",
        imgAlt: "Interior of La Vie Elegance salon"
      },
      about: {
        eyebrow: "About us",
        title: "Where style and care come together",
        p1: "La Vie Elegance is a hair and beauty salon in Niš, at Cara Dušana 128A. Led by Ivana Pešić, the salon has brought together a full team since 2025 — from everyday cuts and blow-dries, through colour and occasion hair, to nails, waxing, lashes and make-up.",
        p2: "Every appointment starts with a conversation. Before we pick up the scissors or the brush, we listen to what you want, look at the condition of your hair, and suggest something that will genuinely suit you and that you can maintain yourself.",
        p3: "We work in a calm space, with trusted professional products and without rushing. Appointments are booked in advance, by phone or online.",
        h1: "Experienced team",
        h2: "Professional products",
        h3: "Personal approach",
        imgAlt: "The working area of La Vie Elegance salon",
        rating: "average rating from 16 reviews on SrediMe"
      },
      services: {
        eyebrow: "Services",
        title: "What we do",
        lead: "Call us for prices and available slots — we are happy to advise on what suits you best.",
        s1: {
          title: "Hair",
          i1: "Women's, men's and children's cuts", i2: "Wash and blow-dry",
          i3: "Colour, gloss and toner", i4: "Highlights, balayage and ombré",
          i5: "Occasion and bridal hair", i6: "Hair treatments, keratin and botox",
          i7: "Beard grooming"
        },
        s2: { title: "Nails", i1: "Manicure", i2: "Pedicure", i3: "Gel polish", i4: "Nail extensions and fill-ins" },
        s3: { title: "Waxing", i1: "Legs", i2: "Arms", i3: "Face", i4: "Intimate area" },
        s4: {
          title: "Lashes and brows",
          i1: "Lash extensions", i2: "Lash infills",
          i3: "Lash lift", i4: "Brow shaping"
        },
        s5: { title: "Make-up", i1: "Professional make-up for special occasions" }
      },
      team: {
        eyebrow: "Team",
        title: "The people who look after you",
        m1: "Owner and hairstylist — all hair services, brows",
        m2: "Nails, pedicure, waxing, make-up",
        m3: "Lashes, nails"
      },
      contact: {
        eyebrow: "Contact",
        title: "Where to find us and when",
        addressLabel: "Address",
        phoneLabel: "Phone",
        hoursTitle: "Opening hours",
        everyDay: "Every day",
        hoursNote: "We work by appointment only.",
        mapTitle: "Map — Cara Dušana 128A, Niš",
        bookOnline: "Book online",
        bookNote: "Or simply call us on +381 61 6611 269."
      },
      footer: {
        legal: "Ivana Pešić PR Hair and Beauty Salon La Vie Elegance Niš · VAT 115286286",
        top: "Back to top ↑",
        rights: "All rights reserved.",
        credit: "Website by"
      }
    }
  };

  var STORAGE_KEY = "lve-lang";
  var DEFAULT_LANG = "sr";

  /* Vraća vrednost po putanji tipa "services.s1.i2" */
  function lookup(dict, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : null;
    }, dict);
  }

  /* ======================================================================
     2. PREBACIVANJE JEZIKA
     ====================================================================== */
  function applyLanguage(lang) {
    var dict = translations[lang] || translations[DEFAULT_LANG];

    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "sr");

    /* Tekstualni sadržaj */
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = lookup(dict, el.getAttribute("data-i18n"));
      if (typeof value === "string") { el.textContent = value; }
    });

    /* Atributi: data-i18n-attr="alt:hero.imgAlt;title:contact.mapTitle" */
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var parts = pair.split(":");
        if (parts.length !== 2) { return; }
        var value = lookup(dict, parts[1].trim());
        if (typeof value === "string") { el.setAttribute(parts[0].trim(), value); }
      });
    });

    /* Title + meta description */
    if (lookup(dict, "meta.title")) { document.title = lookup(dict, "meta.title"); }

    /* Stanje dugmadi */
    document.querySelectorAll(".lang__btn").forEach(function (btn) {
      var active = btn.dataset.lang === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }

    /* Obaveštenje za ostale skripte (npr. widget za zakazivanje) */
    document.dispatchEvent(new CustomEvent("lve:langchange", { detail: { lang: lang } }));
  }

  function initLanguage() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    applyLanguage(translations[saved] ? saved : DEFAULT_LANG);

    document.querySelectorAll(".lang__btn").forEach(function (btn) {
      btn.addEventListener("click", function () { applyLanguage(btn.dataset.lang); });
    });
  }

  /* ======================================================================
     3. MOBILNI MENI
     ====================================================================== */
  function initMenu() {
    var burger = document.getElementById("burger");
    var nav = document.getElementById("nav");
    var closeBtn = document.getElementById("nav-close");
    var backdrop = document.getElementById("nav-backdrop");
    if (!burger || !nav) { return; }

    function openMenu() {
      nav.classList.add("is-open");
      burger.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
      if (backdrop) { backdrop.hidden = false; }
      var first = nav.querySelector("a, button");
      if (first) { first.focus(); }
    }

    function closeMenu(returnFocus) {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");
      if (backdrop) { backdrop.hidden = true; }
      if (returnFocus) { burger.focus(); }
    }

    function isOpen() { return nav.classList.contains("is-open"); }

    burger.addEventListener("click", function () { isOpen() ? closeMenu(true) : openMenu(); });
    if (closeBtn) { closeBtn.addEventListener("click", function () { closeMenu(true); }); }
    if (backdrop) { backdrop.addEventListener("click", function () { closeMenu(false); }); }

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { if (isOpen()) { closeMenu(false); } });
    });

    document.addEventListener("keydown", function (e) {
      if (!isOpen()) { return; }

      if (e.key === "Escape") { closeMenu(true); return; }

      /* Zadrži fokus unutar otvorenog menija */
      if (e.key === "Tab") {
        var items = nav.querySelectorAll("a, button");
        if (!items.length) { return; }
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* Zatvori meni ako se prozor raširi do desktop breakpointa */
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900 && isOpen()) { closeMenu(false); }
    });
  }

  /* ======================================================================
     4. HEADER NA SKROL + AKTIVNA SEKCIJA U NAVIGACIJI
     ====================================================================== */
  function initHeader() {
    var header = document.getElementById("site-header");
    if (!header) { return; }

    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 60);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!("IntersectionObserver" in window)) { return; }

    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__list a[href^="#"]'));
    var sections = links
      .map(function (link) { return document.querySelector(link.getAttribute("href")); })
      .filter(Boolean);

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        links.forEach(function (link) {
          link.classList.toggle("is-current", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ======================================================================
     5. SCROLL ANIMACIJE
     ====================================================================== */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry, index) {
        if (!entry.isIntersecting) { return; }
        var delay = Math.min(index, 4) * 90;
        setTimeout(function () { entry.target.classList.add("is-visible"); }, delay);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ======================================================================
     6. GODINA U FOOTERU
     ====================================================================== */
  function initYear() {
    var el = document.getElementById("year");
    if (el) { el.textContent = String(new Date().getFullYear()); }
  }

  /* ---------------------------------------------------------------------- */
  function init() {
    initLanguage();
    initMenu();
    initHeader();
    initReveal();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
