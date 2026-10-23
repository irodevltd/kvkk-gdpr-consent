# kvkk-gdpr-consent

[![tests](https://github.com/irodevltd/kvkk-gdpr-consent/actions/workflows/tests.yml/badge.svg)](https://github.com/irodevltd/kvkk-gdpr-consent/actions/workflows/tests.yml)
![size](https://img.shields.io/badge/size-~2%20KB%20gzipped-informational)
![License](https://img.shields.io/badge/license-MIT-blue)

**English** · [Türkçe](README.tr.md)

A small cookie banner for Google Analytics (and any other analytics script) under **KVKK** and **UK/EU GDPR**. No
dependencies, no tracking before consent, works with a strict Content Security Policy.

- **Nothing loads before "Accept".** Not Google's script, not your marked scripts. "Reject" is a button of the same
  size, as easy to press.
- **The choice can be changed at any time.** Any element with `data-consent-open` brings the banner back.
  Withdrawing deletes the `_ga` cookies and reloads the page.
- **Turkish and English built in.** It follows `<html lang>`, and every text can be replaced.
- **Accessible:** a labelled region, real buttons, focus moves to the banner when a visitor reopens it.

It is the banner that runs on [irodev.net](https://irodev.net), made standalone.

![The banner](examples/screenshot.png)

## Usage

```html
<link rel="stylesheet" href="consent.css">
<script src="consent.js" data-ga="G-XXXXXXXXXX" data-privacy="/privacy#cookies" defer></script>

<!-- anywhere, for example in the footer -->
<button type="button" data-consent-open>Cookie settings</button>
```

That's all: the first visit shows the banner; after "Accept", Google Analytics 4 loads with your measurement ID.

The script must be a classic script (not `type="module"`): it reads its options from its own tag.

### Holding back other scripts

Mark any script `type="text/plain"` with `data-consent="analytics"`. The browser ignores it until the visitor accepts,
then it runs as a normal script:

```html
<script type="text/plain" data-consent="analytics" src="https://example.com/heatmap.js"></script>
<script type="text/plain" data-consent="analytics">
  startMyAnalytics();
</script>
```

### Options

| Attribute | Default | |
| --- | --- | --- |
| `data-ga` | none | Your GA4 measurement ID (`G-…`). Without it, only marked scripts run after "Accept". |
| `data-privacy` | none | Link to the cookie section of your privacy notice ("Details"). |
| `data-lang` | `<html lang>` | `tr` or `en`. |
| `data-text` | built in | The banner's sentence. |
| `data-accept-label`, `data-reject-label`, `data-more-label` | built in | Button and link texts. |
| `data-label` | built in | The region's accessible name. |
| `data-accept-class`, `data-reject-class` | none | Extra classes, to reuse your site's buttons. |
| `data-storage-key` | `consent` | The localStorage key for the choice (`yes` or `no`). |
| `data-cookies` | `_ga` | Cookie name prefixes deleted on withdrawal, comma separated. |

### JavaScript

```js
KvkkConsent.choice();   // 'yes', 'no' or null
KvkkConsent.open();     // show the banner again
KvkkConsent.reset();    // forget the choice and ask again

document.addEventListener('consentchange', function (e) {
  if (e.detail.analytics) { /* the visitor accepted */ }
  else { e.preventDefault(); /* withdrawn: handle it yourself instead of the reload */ }
});
```

### Styling

Override the custom properties on `.consent-banner`: `--consent-bg`, `--consent-fg`, `--consent-muted`,
`--consent-accept-bg`, `--consent-accept-fg`, `--consent-reject-bg`, `--consent-reject-fg`, `--consent-border`,
`--consent-radius`, `--consent-font`. Keep the two buttons equally visible.

### Content Security Policy

The banner adds no inline scripts or styles. With `data-ga`, allow Google's endpoints:

```
script-src  'self' https://www.googletagmanager.com;
connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;
img-src     'self' https://*.google-analytics.com https://*.googletagmanager.com;
```

### From a CDN

After the v1.0.0 release, jsDelivr serves the files straight from this repository (it minifies on the fly):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/irodevltd/kvkk-gdpr-consent@1.0.0/src/consent.min.css">
<script src="https://cdn.jsdelivr.net/gh/irodevltd/kvkk-gdpr-consent@1.0.0/src/consent.min.js" data-ga="G-XXXXXXXXXX" defer></script>
```

A CDN is a third party your visitors' browsers connect to. If your privacy notice says there are none, host the files
yourself.

## Your privacy notice

The banner handles the consent; your privacy notice has to explain it. For Google Analytics it usually covers: what
is measured, the cookies (`_ga` and `_ga_<ID>`, kept for up to 2 years), Google as your service provider, the transfer
of data to the United States and its legal basis, how long the data is kept (set the retention to the shortest
period you need in Google Analytics), and how to withdraw consent. The
[irodev.net privacy notice](https://irodev.net/gizlilik) is one example. This is not legal advice: have your notice
checked for your business.

## Testing

```bash
npm install
npm test
```

The tests run the script in [jsdom](https://github.com/jsdom/jsdom). [`examples/index.html`](examples/index.html) is a
demo that makes no requests to Google.

## License

MIT © [İRODEV LTD](https://irodev.net). Built by İrodev, a web and software studio for businesses in Turkey and the UK.
