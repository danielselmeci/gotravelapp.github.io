#!/usr/bin/env python3
"""Builds the Go: TravelApp website.

  python3 _src/build.py

- Generates index.html, index-de.html, index-es.html, index-hu.html from
  _src/index.template.html and the copy in _src/strings.py.
- Gives every other page (support, privacy, terms, crew verification) the same
  header, footer, fonts and scripts, leaving the page content as it is.

The folder starts with an underscore, so GitHub Pages does not publish it.
"""
import re
from pathlib import Path

from strings import STRINGS

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
SITE = "https://gotravelapp.com/"
STORE = "https://apps.apple.com/us/app/go-travelapp/id6747101413"
LANGS = ["en", "de", "es", "hu"]
YEAR = 2026


def t(lang, key):
    return STRINGS[lang].get(key, STRINGS["en"][key])


def page_for(base, lang):
    """support + de -> support-de.html; index + en -> index.html"""
    return f"{base}.html" if lang == "en" else f"{base}-{lang}.html"


# ---------------------------------------------------------------- partials

SPRITE = """<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-plane" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" transform="rotate(90 12 12)" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></symbol>
<symbol id="i-plane-line" viewBox="0 0 24 24"><path transform="rotate(45 12 12)" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></symbol>
<symbol id="i-passport" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 17h6"/></symbol>
<symbol id="i-badge" viewBox="0 0 24 24"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></symbol>
<symbol id="i-list" viewBox="0 0 24 24"><path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/></symbol>
<symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/></symbol>
<symbol id="i-wallet" viewBox="0 0 24 24"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></symbol>
<symbol id="i-coins" viewBox="0 0 24 24"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4m8.71 3.88.7.71-2.82 2.82"/></symbol>
<symbol id="i-scan" viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></symbol>
<symbol id="i-building" viewBox="0 0 24 24"><path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/></symbol>
<symbol id="i-siren" viewBox="0 0 24 24"><path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1zM21 12h1M18.5 4.5 18 5M2 12h1M12 2v1M4.93 4.93l.71.71"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>
<symbol id="i-map" viewBox="0 0 24 24"><path d="M14.1 5.55a2 2 0 0 0 1.8 0l3.65-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.9l-4.55 2.27a2 2 0 0 1-1.8 0l-4.2-2.1a2 2 0 0 0-1.8 0l-3.65 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.9L8.1 3.45a2 2 0 0 1 1.8 0zM15 5.76v15M9 3.24v15"/></symbol>
<symbol id="i-sparkles" viewBox="0 0 24 24"><path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/></symbol>
<symbol id="i-widget" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></symbol>
<symbol id="i-bed" viewBox="0 0 24 24"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path d="M11.53 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .3-.91l5.16-.75a2.12 2.12 0 0 0 1.6-1.16z"/></symbol>
<symbol id="i-log" viewBox="0 0 24 24"><path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></symbol>
<symbol id="i-tools" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/></symbol>
<symbol id="i-infinity" viewBox="0 0 24 24"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>
<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="i-apple" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.1 8.79.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.51-.71 2.84-.71 1.33 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.15.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.3-.88-2.32-3.5zM14.2 6.15c.6-.73 1.01-1.75.9-2.76-.87.03-1.92.58-2.54 1.31-.56.64-1.05 1.67-.92 2.66.97.08 1.96-.49 2.56-1.21z"/></symbol>
<symbol id="i-instagram" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></symbol>
<symbol id="i-replay" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></symbol>
</svg>"""


def store_button(lang):
    return (f'<a class="btn btn-store" href="{STORE}">'
            f'<svg class="icon"><use href="#i-apple"/></svg>'
            f'<span><small>{t(lang, "store_small")}</small><b>{t(lang, "store_big")}</b></span></a>')


def lang_menu(lang, base):
    items = []
    for code in LANGS:
        href = page_for(base, code) if base != "crew-verification" else ("crew-verification.html" if code == "en" else page_for("index", code))
        cur = ' aria-current="true"' if code == lang else ""
        items.append(f'<li><a href="{href}" hreflang="{code}" lang="{code}" data-lang="{code}"{cur}>'
                     f'{STRINGS[code]["lang_name"]} <small>{code.upper()}</small></a></li>')
    return (f'<details class="lang"><summary aria-label="{t(lang, "language")}">'
            f'<svg class="icon"><use href="#i-globe"/></svg>{lang.upper()}</summary>'
            f'<ul>{"".join(items)}</ul></details>')


def header(lang, base):
    home = page_for("index", lang)
    on_home = base == "index"
    h = "" if on_home else home
    support = page_for("support", lang)
    cur = ' aria-current="page"' if base == "support" else ""
    return f"""<header class="site-header">
  <div class="wrap">
    <a class="brand" href="{home}"><img src="apple-touch-icon.png" alt="" width="30" height="30">Go: TravelApp</a>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <a href="{h}#features">{t(lang, "nav_features")}</a>
      <a href="{h}#crew">{t(lang, "nav_crew")}</a>
      <a href="{support}"{cur}>{t(lang, "nav_support")}</a>
      <a class="header-cta" href="{STORE}">{t(lang, "nav_cta")}</a>
    </nav>
    {lang_menu(lang, base)}
    <button class="menu-btn" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="{t(lang, "menu")}"><svg class="icon"><use href="#i-menu"/></svg></button>
  </div>
</header>"""


def footer(lang):
    home = page_for("index", lang)
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a class="brand" href="{home}"><img src="apple-touch-icon.png" alt="" width="30" height="30">Go: TravelApp</a>
        <p>{t(lang, "foot_tag")}</p>
        <div class="socials">
          <a href="https://instagram.com/go.travelapp" aria-label="Instagram"><svg class="icon"><use href="#i-instagram"/></svg></a>
          <a href="mailto:info@gotravelapp.com" aria-label="Email"><svg class="icon"><use href="#i-mail"/></svg></a>
        </div>
      </div>
      <div>
        <h4>{t(lang, "foot_app")}</h4>
        <ul>
          <li><a href="{home}#features">{t(lang, "nav_features")}</a></li>
          <li><a href="{home}#crew">Crew+</a></li>
          <li><a href="{STORE}">{t(lang, "foot_download")}</a></li>
        </ul>
      </div>
      <div>
        <h4>{t(lang, "foot_help")}</h4>
        <ul>
          <li><a href="{page_for("support", lang)}">{t(lang, "nav_support")}</a></li>
          <li><a href="crew-verification.html">{t(lang, "foot_verify")}</a></li>
          <li><a href="mailto:support@gotravelapp.com">{t(lang, "foot_contact")}</a></li>
        </ul>
      </div>
      <div>
        <h4>{t(lang, "foot_legal")}</h4>
        <ul>
          <li><a href="{page_for("privacy", lang)}">{t(lang, "foot_privacy")}</a></li>
          <li><a href="{page_for("terms", lang)}">{t(lang, "foot_terms")}</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>&copy; {YEAR} Go: TravelApp. {t(lang, "foot_rights")}</span>
      <span>{t(lang, "foot_by")}</span>
    </div>
  </div>
</footer>"""


SCRIPT = """<script>
(function () {
  var header = document.querySelector('.site-header');
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      btn.setAttribute('aria-expanded', nav.classList.toggle('open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.lang[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
    var pick = e.target.closest('.lang a[data-lang]');
    if (pick) { try { localStorage.setItem('gotravelapp-lang', pick.dataset.lang); } catch (err) {} }
  });

  document.querySelectorAll('.faq-item h3').forEach(function (q) {
    q.tabIndex = 0;
    q.setAttribute('role', 'button');
    function toggle() { q.parentNode.classList.toggle('open'); }
    q.addEventListener('click', toggle);
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });

  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }
})();
</script>"""

# On the English home page only: send first-time visitors whose browser asks
# for German, Spanish or Hungarian to their language. A language picked from
# the menu always wins.
REDIRECT = """<script>
(function () {
  try {
    var saved = localStorage.getItem('gotravelapp-lang');
    var want = saved || (navigator.language || 'en').slice(0, 2).toLowerCase();
    if (!saved) localStorage.setItem('gotravelapp-lang', want);
    if (want === 'de' || want === 'es' || want === 'hu') location.replace('index-' + want + '.html' + location.hash);
  } catch (e) {}
})();
</script>"""

TICKER = [
    ("LH 716", "FRA", "HND", "17:55", "t_ontime", "on"),
    ("AA 899", "XNA", "LGA", "16:36", "t_gate", "gate", "B12"),
    ("TP 1243", "LIS", "BUD", "19:05", "t_delayed", "late"),
    ("BA 117", "LHR", "JFK", "08:25", "t_boarding", ""),
    ("IB 6251", "MAD", "BOG", "11:40", "t_ontime", "on"),
    ("W6 2201", "BUD", "BCN", "06:10", "t_gate", "gate", "A4"),
    ("DL 405", "ATL", "CDG", "17:15", "t_ontime", "on"),
    ("EK 230", "DXB", "SEA", "02:50", "t_boarding", ""),
]


def ticker(lang):
    out = []
    for row in TICKER:
        num, a, b, time, key, cls = row[:6]
        label = t(lang, key) + (f" {row[6]}" if len(row) > 6 else "")
        out.append(f'<li><b>{num}</b>{a} → {b}<span>{time}</span><span class="tag {cls}">{label}</span></li>')
    return "<ul>" + "".join(out) + "</ul>"


def hreflangs():
    lines = [f'<link rel="alternate" hreflang="{c}" href="{SITE}{"" if c == "en" else page_for("index", c)}">' for c in LANGS]
    lines.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}">')
    return "\n".join(lines)


# ---------------------------------------------------------------- home pages

def build_home():
    tpl = (SRC / "index.template.html").read_text().replace("{{tour}}", (SRC / "tour.html").read_text())
    jsonld = (SRC / "jsonld.html").read_text().strip()
    for lang in LANGS:
        file = page_for("index", lang)
        values = dict(STRINGS["en"])
        values.update(STRINGS[lang])
        values.update({
            "lang": lang,
            "canonical": SITE if lang == "en" else SITE + file,
            "hreflangs": hreflangs(),
            "jsonld": jsonld,
            "sprite": SPRITE,
            "header": header(lang, "index"),
            "footer": footer(lang),
            "store_button": store_button(lang),
            "ticker": ticker(lang),
            "privacy_href": page_for("privacy", lang),
            "script": (REDIRECT + "\n" if lang == "en" else "") + SCRIPT,
        })
        html = re.sub(r"\{\{(\w+)\}\}", lambda m: values[m.group(1)], tpl)
        (ROOT / file).write_text(html)
        print("built", file)


# ---------------------------------------------------------------- inner pages

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700&family=JetBrains+Mono:wght@500;600&display=swap">\n')


def build_inner():
    for path in sorted(ROOT.glob("*.html")):
        name = path.stem
        if name.startswith("index"):
            continue
        m = re.match(r"(.+?)-(de|es|hu)$", name)
        base, lang = (m.group(1), m.group(2)) if m else (name, "en")
        s = path.read_text()

        # Brand name, always written in full.
        s = re.sub(r"\bGo ?TravelApp\b", "Go: TravelApp", s)
        s = s.replace("Go: Go: TravelApp", "Go: TravelApp")

        # Paths that pointed one folder up (crew-verification lives at the root).
        s = s.replace('href="../', 'href="')

        # Head: fonts, stylesheet, js class.
        if "fonts.googleapis.com" not in s:
            s = s.replace('<link rel="stylesheet" href="styles.css">', FONTS + '<link rel="stylesheet" href="styles.css">', 1)
        s = s.replace("<html lang=", '<html class="no-js" lang=', 1) if 'class="no-js"' not in s and "class=\"js\"" not in s else s
        if "classList.replace('no-js','js')" not in s:
            s = s.replace("</head>", "<script>document.documentElement.classList.replace('no-js','js')</script>\n</head>", 1)

        # Body: drop old scripts, then add the shared header, footer and script.
        head, body = s.split("<body>", 1)
        body = re.sub(r"\s*<script>.*?</script>", "", body, flags=re.S)
        body = re.sub(r"\s*<!--sprite-->.*?<!--/sprite-->", "", body, flags=re.S)
        body = re.sub(r'<nav class="navbar.*?</nav>|<header class="site-header">.*?</header>', lambda _: header(lang, base), body, count=1, flags=re.S)
        body = re.sub(r"<footer.*?</footer>", lambda _: footer(lang), body, count=1, flags=re.S)
        body = body.replace("</body>", SCRIPT + "\n</body>")
        s = head + "<body>\n<!--sprite-->" + SPRITE + "<!--/sprite-->" + body
        path.write_text(s)
        print("updated", path.name)


if __name__ == "__main__":
    build_home()
    build_inner()
