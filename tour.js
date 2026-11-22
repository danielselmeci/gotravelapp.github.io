/* Go: TravelApp — interactive phone tour on the home page.
   The phone stays pinned while the steps scroll past; the step nearest the
   reading line decides which screen the phone shows. Everything inside the
   phone can also be tapped like the real app. */
(function () {
  var app = document.getElementById('app');
  if (!app) return;

  var lang = document.documentElement.lang || 'en';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var screens = {};
  app.querySelectorAll('.scr').forEach(function (s) { screens[s.dataset.name] = s; });
  var tabFor = { trips: 'trips', trip: 'trips', flight: 'trips', checklist: 'trips', ground: 'ground', crew: 'crew', visa: 'visa' };
  var current = 'trips';
  var timers = [];

  function later(fn, ms) { timers.push(setTimeout(fn, reduce ? Math.min(ms, 150) : ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- Fit the 390 x 844 app into whatever size the phone is ---------- */
  var screenEl = app.parentElement;
  function fit() { app.style.setProperty('--s', screenEl.clientWidth / 390); }
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(screenEl);
  else window.addEventListener('resize', fit);

  /* ---------- Localised dates, ranges and country names ---------- */
  function utc(iso) { var p = iso.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2], 12)); }
  try {
    var day = new Intl.DateTimeFormat(lang, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    app.querySelectorAll('[data-date]').forEach(function (el) { el.textContent = day.format(utc(el.dataset.date)); });
    var range = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    app.querySelectorAll('[data-range]').forEach(function (el) {
      var r = el.dataset.range.split('/');
      el.textContent = range.formatRange ? range.formatRange(utc(r[0]), utc(r[1])) : range.format(utc(r[0])) + ' – ' + range.format(utc(r[1]));
    });
  } catch (e) {}
  var regionName = function (c) { return c; };
  try { var dn = new Intl.DisplayNames([lang], { type: 'region' }); regionName = function (c) { return dn.of(c); }; } catch (e) {}
  app.querySelectorAll('[data-region]').forEach(function (el) { el.textContent = regionName(el.dataset.region); });

  /* ---------- Navigation ---------- */
  function go(name) {
    if (!screens[name] || name === current) return;
    clearTimers();
    notif.classList.remove('show');
    screens[current].classList.remove('on');
    current = name;
    var s = screens[name];
    s.scrollTop = 0;
    s.classList.add('on');
    app.dataset.screen = name;
    app.classList.toggle('dark-top', s.hasAttribute('data-dark-top'));
    app.querySelectorAll('.a-tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tabFor[name]); });
    if (enter[name]) enter[name]();
  }
  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]');
    if (t && app.contains(t)) { e.preventDefault(); go(t.dataset.go); }
  });

  var enter = {};

  /* ---------- Live flight: gate assigned, then a delay ---------- */
  var flStatus = document.getElementById('flStatus');
  var flEvents = document.getElementById('flEvents');
  var notif = document.getElementById('notif');
  var evText = {};
  var evTpl = document.getElementById('flEv');
  if (evTpl) evTpl.content.querySelectorAll('i').forEach(function (i) { evText[i.dataset.k] = i.textContent; });
  function cell(id) { return document.getElementById(id).querySelector('b'); }
  function live(k) { return app.querySelector('[data-live="' + k + '"]'); }
  function flash(id) { var el = document.getElementById(id); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  function addEvent(time, text) {
    var li = document.createElement('li');
    li.innerHTML = '<time></time><span></span>';
    li.firstChild.textContent = time; li.lastChild.textContent = text;
    flEvents.insertBefore(li, flEvents.firstChild);
  }
  function resetFlight() {
    var label = flStatus.querySelector('span');
    flStatus.classList.remove('late'); label.textContent = label.dataset.on;
    cell('flGate').textContent = '—';
    cell('flDep').textContent = '18:40';
    cell('flArr').textContent = '23:55';
    while (flEvents.children.length > 1) flEvents.removeChild(flEvents.firstChild);
    live('w-time').textContent = '18:40';
    live('w-gate').style.visibility = 'hidden';
    live('w-status').textContent = label.dataset.on;
    notif.classList.remove('show');
  }
  enter.flight = function () {
    resetFlight();
    later(function () {
      cell('flGate').textContent = '14'; flash('flGate');
      live('w-gate').style.visibility = 'visible';
      addEvent('15:20', evText.gate || 'Gate 14');
    }, 1100);
    later(function () {
      var label = flStatus.querySelector('span');
      flStatus.classList.add('late'); label.textContent = label.dataset.late;
      cell('flDep').innerHTML = '<s>18:40</s>19:05'; flash('flDep');
      cell('flArr').innerHTML = '<s>23:55</s>00:15'; flash('flArr');
      live('w-time').textContent = '19:05';
      live('w-status').textContent = label.dataset.late;
      addEvent('15:41', evText.delay || '+25 min');
      notif.classList.add('show');
    }, 2600);
    later(function () { notif.classList.remove('show'); }, 6800);
  };
  document.getElementById('flReplay').addEventListener('click', function () { clearTimers(); enter.flight(); });

  /* ---------- Passports and visa check ---------- */
  var labels = {};
  var vsTpl = document.getElementById('vsLabels');
  if (vsTpl) vsTpl.content.querySelectorAll('i').forEach(function (i) { labels[i.dataset.k] = i.textContent; });
  // Demo data for the four destinations shown. Not a source of truth.
  var visa = {
    HU: { JP: 'free', GB: 'eta', AU: 'evisitor', IN: 'evisa' },
    US: { JP: 'free', GB: 'eta', AU: 'eta', IN: 'evisa' },
    BR: { JP: 'free', GB: 'eta', AU: 'req', IN: 'evisa' }
  };
  var cls = { free: 'free', eta: 'online', evisitor: 'online', evisa: 'online', req: 'req' };
  var pass = { HU: ['🇭🇺', '•••• 4821', '03/2031'], US: ['🇺🇸', '•••• 7730', '08/2033'], BR: ['🇧🇷', '•••• 1945', '11/2029'] };
  var pp = document.getElementById('pp');
  function pickPassport(code) {
    pp.dataset.p = code;
    pp.querySelector('[data-pp-flag]').textContent = pass[code][0];
    pp.querySelector('[data-pp-num]').textContent = pass[code][1];
    pp.querySelector('[data-pp-exp]').textContent = pass[code][2];
    pp.querySelector('[data-pp-name]').textContent = regionName(code);
    app.querySelectorAll('.chip').forEach(function (c) {
      var on = c.dataset.pp === code;
      c.classList.toggle('on', on); c.setAttribute('aria-checked', on);
    });
    document.querySelectorAll('#dest li').forEach(function (li) {
      var k = visa[code][li.dataset.d];
      var b = li.querySelector('.vs');
      b.className = 'vs ' + cls[k]; b.textContent = labels[k] || k;
    });
  }
  app.querySelectorAll('.chip').forEach(function (c) { c.addEventListener('click', function () { pickPassport(c.dataset.pp); }); });
  pickPassport('HU');

  /* ---------- Checklist ---------- */
  var items = Array.prototype.slice.call(app.querySelectorAll('.check-item'));
  var leftPill = live('left');
  var leftWord = leftPill.textContent.replace(/^\d+\s*/, '');
  function syncChecklist() {
    var done = items.filter(function (i) { return i.classList.contains('done'); }).length;
    var total = items.length;
    live('count').textContent = done;
    live('todo').textContent = done + '/' + total;
    live('bar').style.width = (done / total * 100) + '%';
    leftPill.textContent = (total - done) + ' ' + leftWord;
    document.getElementById('ready').classList.toggle('show', done === total);
    var mini = live('mini');
    mini.innerHTML = '';
    items.filter(function (i) { return !i.classList.contains('done'); }).concat(items.filter(function (i) { return i.classList.contains('done'); }))
      .slice(0, 4).forEach(function (i) {
        var li = document.createElement('li');
        li.textContent = i.querySelector('.txt').textContent;
        if (i.classList.contains('done')) li.className = 'done';
        mini.appendChild(li);
      });
  }
  items.forEach(function (i) {
    i.setAttribute('aria-pressed', i.classList.contains('done'));
    i.addEventListener('click', function () {
      var on = i.classList.toggle('done');
      i.setAttribute('aria-pressed', on);
      syncChecklist();
    });
  });
  syncChecklist();

  /* ---------- On the ground ---------- */
  var tTime = document.getElementById('tokyoTime');
  var tDiff = document.getElementById('tokyoDiff');
  function clock() {
    try {
      tTime.textContent = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }).format(new Date());
    } catch (e) {}
    var diff = 9 + new Date().getTimezoneOffset() / 60;
    var txt = (diff >= 0 ? '+' : '−') + Math.abs(diff) + 'h';
    tDiff.textContent = (tDiff.dataset.tpl || '%s').replace('%s', txt);
  }
  clock(); setInterval(clock, 20000);

  var cIn = document.getElementById('convIn');
  var cCur = document.getElementById('convCur');
  var cOut = document.getElementById('convOut');
  var yen;
  try { yen = new Intl.NumberFormat(lang, { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }); } catch (e) {}
  function convert() {
    var v = parseFloat(String(cIn.value).replace(/\s/g, '').replace(',', '.')) || 0;
    var r = Math.round(v * parseFloat(cCur.value));
    cOut.textContent = yen ? yen.format(r) : '¥' + r;
  }
  cIn.addEventListener('input', convert);
  cCur.addEventListener('change', convert);
  convert();

  app.querySelectorAll('.phrase').forEach(function (p) {
    var em = p.querySelector('em');
    var hint = em.textContent;
    p.addEventListener('click', function () {
      var open = p.classList.toggle('open');
      em.textContent = open ? p.dataset.say : hint;
    });
  });

  /* ---------- Crew+ lounge ---------- */
  var chat = document.getElementById('chat');
  var typing = chat.querySelector('.typing');
  var played = false;
  function scrollChat() { var s = screens.crew; s.scrollTop = s.scrollHeight; }
  function say(node) { typing.hidden = true; node.hidden = false; chat.insertBefore(typing, null); scrollChat(); }
  enter.crew = function () {
    if (played) return;
    played = true;
    var msgs = chat.querySelectorAll('.msg[hidden]');
    msgs.forEach(function (m, i) {
      later(function () { typing.hidden = false; chat.appendChild(typing); scrollChat(); }, 500 + i * 1500);
      later(function () { say(m); }, 1300 + i * 1500);
    });
  };
  document.getElementById('quick').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    b.disabled = true;
    var me = document.createElement('div');
    me.className = 'msg me';
    me.innerHTML = '<p></p>';
    me.firstChild.textContent = b.textContent;
    chat.insertBefore(me, typing);
    scrollChat();
    var reply = chat.querySelector('.msg:not(.me)').cloneNode(true);
    reply.hidden = true;
    reply.querySelector('p').textContent = b.dataset.reply;
    chat.insertBefore(reply, typing);
    later(function () { typing.hidden = false; chat.appendChild(typing); scrollChat(); }, 500);
    later(function () { say(reply); }, 1600);
  });

  /* ---------- Scroll sync between steps and the phone ---------- */
  var steps = Array.prototype.slice.call(document.querySelectorAll('.tour-steps .step'));
  var dotsBox = document.getElementById('tourDots');
  var dots = steps.map(function (st, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('aria-label', (i + 1) + ' / ' + steps.length + ' · ' + st.querySelector('h3').textContent);
    d.addEventListener('click', function () { st.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
    dotsBox.appendChild(d);
    return d;
  });
  var activeStep = -1;
  var mobile = window.matchMedia('(max-width: 900px)');
  function sync() {
    var line = window.innerHeight * (mobile.matches ? 0.8 : 0.5);
    var idx = 0;
    steps.forEach(function (st, i) { if (st.getBoundingClientRect().top <= line) idx = i; });
    if (idx === activeStep) return;
    activeStep = idx;
    steps.forEach(function (st, i) { st.classList.toggle('is-active', i === idx); });
    dots.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
    go(steps[idx].dataset.screen);
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; sync(); });
  }, { passive: true });
  window.addEventListener('resize', sync);
  sync();
})();
