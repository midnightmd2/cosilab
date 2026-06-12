/* COSI Lab — content hydration.
   The text in elements marked data-cms="path.to.key" is the source-of-truth
   FALLBACK baked into the HTML (so search engines and no-JS visitors always
   see real copy). This script overlays whatever is in content.json, which is
   what the Pages CMS edits — so editing the site needs no code. */
(function () {
  fetch('content.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      document.querySelectorAll('[data-cms]').forEach(function (el) {
        var v = data;
        el.getAttribute('data-cms').split('.').forEach(function (k) { v = v && v[k]; });
        if (typeof v === 'string' && v.trim()) el.textContent = v;
      });
    })
    .catch(function () { /* keep the baked-in text */ });
})();
