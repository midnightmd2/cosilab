# vendored / self-hosted assets

The visual libraries and fonts here are served from our own origin. The site
also uses the UCSF administrator-supplied Siteimprove analytics loader. Its
specific script URL and account collector are the explicit external exceptions
in the Content Security Policy; `default-src 'self'` remains unchanged.

## three/ — Three.js r0.165 (ES modules + addons)
Loaded via the import map in `index.html`. Replace wholesale on upgrade.

## gsap/ — GSAP 3.13.0 + ScrollTrigger 3.13.0
Source: `https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/`. Used only by the
homepage reveal/scroll animation. To upgrade: re-download both `.min.js` at the
new pinned version and bump the `?v=` query in `index.html`.

## fonts/ — EB Garamond + Inter, self-hosted (Latin subset)
Source: Google Fonts css2. `fonts.css` + 5 woff2, Latin range only — covers all
Western accents, em-dash, curly quotes, `·`, `©`, `€`, `™`. If a name ever needs
Latin-Extended (e.g. ł, ě, ő) or another range, re-add those `@font-face` blocks
from the Google css2 response and drop the woff2 alongside.

## UCSF Siteimprove analytics

`/analytics.js` contains the administrator-supplied asynchronous loader for
`https://siteimproveanalytics.com/js/siteanalyze_8343.js`. Every HTML page loads
it once, just before `</body>`. The account's current pixel collector is
`https://8343.global.siteimproveanalytics.io`; the CSP allows that image origin
and the exact tracking-script URL. Other CSP restrictions remain in place.
Account privacy, consent and cookie settings are managed separately in UCSF's
Siteimprove configuration; this loader does not set or change those options.

## Content-Security-Policy hashes
The CSP in every `*.html` whitelists `index.html`'s two inline scripts — the
**import map** and the **JSON-LD** block — by SHA-256 hash. **If you edit either
block, those scripts get blocked until you update the hash.** Recompute both:

```sh
python3 - <<'EOF'
import re, hashlib, base64
h = open("index.html").read()
for t in ['type="importmap"', 'type="application/ld+json"']:
    b = re.search(r'<script %s>(.*?)</script>' % re.escape(t), h, re.S).group(1)
    print(t, "sha256-" + base64.b64encode(hashlib.sha256(b.encode()).digest()).decode())
EOF
```

Then paste the new `sha256-…` values into the `script-src` directive of the
`<meta http-equiv="Content-Security-Policy">` tag — it's byte-identical across all
seven HTML files, so update them together.
