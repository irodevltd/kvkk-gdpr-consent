import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const code = readFileSync(new URL('../src/consent.js', import.meta.url), 'utf8');

/** A page with the banner script at the end of <body>; `stored` is the choice already in localStorage. */
function page({ lang = 'en', attrs = 'data-ga="G-TEST12345" data-privacy="/privacy#cookies"', stored = null, head = '' } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html lang="${lang}"><head>${head}</head><body>
       <a href="#" data-consent-open>Cookie settings</a>
       <script ${attrs}>${code}</script>
     </body></html>`,
    {
      url: 'https://www.example.com/',
      runScripts: 'dangerously',
      beforeParse(window) {
        if (stored !== null) window.localStorage.setItem('consent', stored);
      },
    },
  );
  const { window } = dom;
  const doc = window.document;
  return {
    window,
    doc,
    banner: () => doc.querySelector('.consent-banner'),
    button: (kind) => doc.querySelector(`.consent-banner__btn--${kind}`),
    gaScript: () => doc.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]'),
    stored: () => window.localStorage.getItem('consent'),
  };
}

test('shows the banner and loads nothing before a choice', () => {
  const p = page();
  assert.ok(p.banner());
  assert.equal(p.banner().getAttribute('role'), 'region');
  assert.equal(p.gaScript(), null);
  assert.equal(p.window.dataLayer, undefined);
  assert.equal(p.window.KvkkConsent.choice(), null);
});

test('both buttons are there, Reject first', () => {
  const p = page();
  const buttons = [...p.doc.querySelectorAll('.consent-banner__btn')].map((b) => b.textContent);
  assert.deepEqual(buttons, ['Reject', 'Accept']);
  assert.equal(p.doc.querySelector('.consent-banner a').getAttribute('href'), '/privacy#cookies');
});

test('accept loads Google Analytics and runs the marked scripts', () => {
  const p = page({ head: '<script type="text/plain" data-consent="analytics">window.__ran = (window.__ran || 0) + 1;</script>' });
  let detail = null;
  p.doc.addEventListener('consentchange', (e) => { detail = e.detail; });
  assert.equal(p.window.__ran, undefined);

  p.button('accept').click();

  assert.equal(p.stored(), 'yes');
  assert.equal(p.banner(), null);
  assert.equal(p.gaScript().getAttribute('src'), 'https://www.googletagmanager.com/gtag/js?id=G-TEST12345');
  assert.equal(p.window.dataLayer.length, 2);
  assert.equal(p.window.__ran, 1);
  assert.equal(detail.analytics, true);         // detail comes from the page's realm: compare the field
});

test('reject loads nothing and is remembered', () => {
  const p = page();
  p.button('reject').click();
  assert.equal(p.stored(), 'no');
  assert.equal(p.banner(), null);
  assert.equal(p.gaScript(), null);

  const next = page({ stored: 'no' });
  assert.equal(next.banner(), null);
  assert.equal(next.gaScript(), null);
});

test('a stored yes loads at once, without a banner', () => {
  const p = page({ stored: 'yes' });
  assert.equal(p.banner(), null);
  assert.ok(p.gaScript());
});

test('withdrawing deletes the analytics cookies', () => {
  const p = page({ stored: 'yes' });
  p.doc.cookie = '_ga=GA1.1.1; path=/';
  p.doc.cookie = '_ga_TEST12345=GS1.1; path=/';
  p.doc.cookie = 'lang=tr; path=/';
  let event = null;
  p.doc.addEventListener('consentchange', (e) => { event = e; e.preventDefault(); });   // instead of the reload

  p.doc.querySelector('[data-consent-open]').click();
  assert.ok(p.banner());
  assert.equal(p.doc.activeElement, p.button('reject'));
  p.button('reject').click();

  assert.equal(p.stored(), 'no');
  assert.equal(p.doc.cookie, 'lang=tr');
  assert.equal(event.detail.analytics, false);
  assert.equal(event.defaultPrevented, true);
});

test('Turkish pages get Turkish texts', () => {
  const p = page({ lang: 'tr' });
  assert.equal(p.button('accept').textContent, 'Kabul et');
  assert.equal(p.button('reject').textContent, 'Reddet');
  assert.match(p.banner().textContent, /analitik çerezler/);
});

test('texts, classes and the storage key can be changed', () => {
  const p = page({ attrs: 'data-text="We count visits." data-accept-label="OK" data-reject-label="No thanks" data-accept-class="btn btn--primary" data-storage-key="my-choice"' });
  assert.equal(p.doc.querySelector('.consent-banner__text').textContent, 'We count visits.');
  assert.equal(p.button('accept').className, 'consent-banner__btn consent-banner__btn--accept btn btn--primary');
  p.button('accept').click();
  assert.equal(p.window.localStorage.getItem('my-choice'), 'yes');
  assert.equal(p.gaScript(), null);                      // no data-ga: nothing from Google
});

test('an invalid measurement ID loads nothing from Google', () => {
  const p = page({ attrs: 'data-ga="UA-1234-5"' });
  p.button('accept').click();
  assert.equal(p.gaScript(), null);
});

test('reset forgets the choice and asks again', () => {
  const p = page({ stored: 'no' });
  assert.equal(p.banner(), null);
  p.window.KvkkConsent.reset();
  assert.equal(p.stored(), null);
  assert.ok(p.banner());
});
