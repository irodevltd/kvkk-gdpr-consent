# Changelog

## 1.0.0 – 2026-10-23

First release, made standalone from the consent banner that runs on [irodev.net](https://irodev.net).

- Google Analytics 4 loads only after "Accept"; scripts marked `type="text/plain" data-consent="analytics"` too.
- "Reject" and "Accept" are equal buttons; `[data-consent-open]` and `KvkkConsent.open()` bring the banner back.
- Withdrawing deletes the `_ga` cookies (configurable prefixes) and reloads, unless a `consentchange` listener cancels.
- Turkish and English texts, all replaceable; extra button classes; a configurable storage key.
- No inline scripts or styles: works under a strict Content Security Policy.
