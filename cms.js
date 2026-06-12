/* COSI Lab — content hydration for the Pages CMS.
   Each page declares its content file on <body data-content="content/x.json">.
   Text in [data-cms="key"] elements is the SEO/no-JS fallback baked into the
   HTML; this script overlays whatever the CMS saved into that file. Use
   *asterisks* in a field to italicise a phrase. List sections (the team
   roster) render from arrays via [data-cms-list]. */
(function () {
  var body = document.body;
  var file = body && body.getAttribute('data-content');
  if (!file) return;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function rich(s) { return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>'); }
  function initials(n) {
    return String(n).trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  fetch(file, { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var v = d[el.getAttribute('data-cms')];
      if (typeof v === 'string' && v.trim()) el.innerHTML = rich(v);
    });
    document.querySelectorAll('[data-cms-list]').forEach(function (box) {
      var arr = d[box.getAttribute('data-cms-list')];
      if (!Array.isArray(arr)) return;
      var tpl = box.getAttribute('data-cms-tpl');
      box.innerHTML = arr.map(function (it) {
        if (tpl === 'member') return '<div class="member"><div class="avatar">' + esc(initials(it.name || '')) + '</div><div class="name">' + esc(it.name || '') + '</div><div class="role">' + rich(it.role || '') + '</div></div>';
        if (tpl === 'collab') return '<div class="collab"><div class="name">' + esc(it.name || '') + '</div><div class="role">' + rich(it.role || '') + '</div></div>';
        return '';
      }).join('');
    });
  }).catch(function () { /* keep baked-in text */ });
})();
