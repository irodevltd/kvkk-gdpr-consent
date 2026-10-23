/*!
 * kvkk-gdpr-consent 1.0.0 · MIT · © 2026 İRODEV LTD · https://github.com/irodevltd/kvkk-gdpr-consent
 *
 * A small cookie banner for analytics under KVKK and UK/EU GDPR:
 * - nothing from Google (or any script you mark) loads until the visitor clicks "Accept";
 * - "Reject" is a button of the same size, as easy as "Accept";
 * - the choice is kept in localStorage, and any [data-consent-open] element brings the banner back;
 * - withdrawing deletes the analytics cookies and reloads the page (cancel the event to handle it yourself).
 *
 * Load it as a classic script with data-ga="G-XXXXXXXXXX" and data-privacy="/privacy#cookies"; see the README.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script || window.KvkkConsent) return;
  var opts = script.dataset;
  var html = document.documentElement;

  var lang = String(opts.lang || html.lang || 'en').slice(0, 2).toLowerCase() === 'tr' ? 'tr' : 'en';
  var texts = {
    tr: {
      text: 'Sitemizin nasıl kullanıldığını ölçmek için analitik çerezler kullanmak istiyoruz. İzin vermezseniz site aynı şekilde çalışır.',
      more: 'Ayrıntılar', accept: 'Kabul et', reject: 'Reddet', label: 'Çerez tercihi'
    },
    en: {
      text: 'We would like to use analytics cookies to see how our site is used. If you say no, the site works just the same.',
      more: 'Details', accept: 'Accept', reject: 'Reject', label: 'Cookie choice'
    }
  }[lang];
  var T = {
    text: opts.text || texts.text,
    more: opts.moreLabel || texts.more,
    accept: opts.acceptLabel || texts.accept,
    reject: opts.rejectLabel || texts.reject,
    label: opts.label || texts.label
  };
  var gaId = /^G-[A-Z0-9]{4,16}$/i.test(opts.ga || '') ? String(opts.ga).toUpperCase() : '';
  var KEY = opts.storageKey || 'consent';
  var cookiePrefixes = String(opts.cookies || '_ga').split(/[\s,]+/).filter(Boolean);

  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try {
      if (value === null) window.localStorage.removeItem(KEY); else window.localStorage.setItem(KEY, value);
    } catch (e) { /* storage blocked (private mode): the banner simply asks again next time */ }
  }

  function announce(granted) {
    var event;
    try {
      event = new CustomEvent('consentchange', { detail: { analytics: granted }, cancelable: true });
    } catch (e) {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent('consentchange', false, true, { analytics: granted });
    }
    return document.dispatchEvent(event);   // false when a listener called preventDefault()
  }

  var loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    if (gaId) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', gaId);
      var ga = document.createElement('script');
      ga.async = true;
      ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
      document.head.appendChild(ga);
    }
    // any other script kept inert as <script type="text/plain" data-consent="analytics" …> runs now
    var inert = document.querySelectorAll('script[type="text/plain"][data-consent="analytics"]');
    for (var i = 0; i < inert.length; i++) {
      var old = inert[i];
      var s = document.createElement('script');
      for (var a = 0; a < old.attributes.length; a++) {
        var at = old.attributes[a];
        if (at.name !== 'type' && at.name !== 'data-consent') s.setAttribute(at.name, at.value);
      }
      if (!old.src) s.text = old.text;
      old.parentNode.replaceChild(s, old);
    }
    announce(true);
  }

  function forget() {
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      var match = cookiePrefixes.some(function (p) { return name.indexOf(p) === 0; });
      if (!name || !match) return;
      ['', host, '.' + host].forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
      });
    });
  }

  var box = null;
  function close() {
    if (box) { box.parentNode.removeChild(box); box = null; }
  }

  function choose(value) {
    var before = read();
    write(value);
    close();
    if (value === 'yes') { load(); return; }
    if (before === 'yes') {                      // analytics already ran on this page: delete its cookies, start clean
      forget();
      if (announce(false)) location.reload();
      return;
    }
    announce(false);
  }

  function open(focus) {
    if (box) return;
    box = document.createElement('section');
    box.className = 'consent-banner';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', T.label);
    var p = document.createElement('p');
    p.className = 'consent-banner__text';
    p.appendChild(document.createTextNode(T.text + (opts.privacy ? ' ' : '')));
    if (opts.privacy) {
      var more = document.createElement('a');
      more.href = opts.privacy;
      more.textContent = T.more;
      p.appendChild(more);
    }
    var row = document.createElement('div');
    row.className = 'consent-banner__actions';
    [['reject', 'no', T.reject, opts.rejectClass], ['accept', 'yes', T.accept, opts.acceptClass]].forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'consent-banner__btn consent-banner__btn--' + b[0] + (b[3] ? ' ' + b[3] : '');
      btn.textContent = b[2];
      btn.addEventListener('click', function () { choose(b[1]); });
      row.appendChild(btn);
    });
    box.appendChild(p);
    box.appendChild(row);
    document.body.appendChild(box);
    if (focus) row.firstChild.focus();
  }

  function start() {
    var choice = read();
    if (choice === 'yes') load();
    else if (choice !== 'no') open(false);
  }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-consent-open]') : null;
    if (!t) return;
    e.preventDefault();
    open(true);
  });

  window.KvkkConsent = {
    /** Show the banner again (for a "Cookie settings" link you build yourself). */
    open: function () { open(true); },
    /** 'yes', 'no', or null when the visitor hasn't chosen yet. */
    choice: read,
    /** Forget the choice and ask again. */
    reset: function () { write(null); close(); open(true); }
  };

  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
