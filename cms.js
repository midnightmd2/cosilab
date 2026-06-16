/* COSI Lab — content hydration for the Pages CMS.
   Each page names its content file on <body data-content="content/x.json">.
   When that file loads it is AUTHORITATIVE: every [data-cms] element shows the
   file's value, and a cleared/empty field hides its element (so deleting text
   in the CMS removes it from the page). The text baked into the HTML is only a
   fallback for when the file fails to load (no-JS / offline). *Asterisks*
   italicise; list sections render from arrays via [data-cms-list]. */
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
      v = (typeof v === 'string') ? v : '';
      if (v.trim()) { el.innerHTML = rich(v); el.hidden = false; }
      else { el.textContent = ''; el.hidden = true; }
    });
    document.querySelectorAll('[data-cms-img]').forEach(function (el) {
      var v = d[el.getAttribute('data-cms-img')];
      if (typeof v === 'string' && v.trim()) {
        el.innerHTML = '<img src="' + esc(v.trim()) + '" alt="' + esc(el.getAttribute('data-alt') || '') + '">';
      } /* else keep the baked-in initials */
    });
    document.querySelectorAll('[data-cms-list]').forEach(function (box) {
      var arr = d[box.getAttribute('data-cms-list')];
      if (!Array.isArray(arr)) return;
      var tpl = box.getAttribute('data-cms-tpl');
      box.innerHTML = arr.map(function (it) {
        if (tpl === 'member') {
          var face = (it.photo && String(it.photo).trim())
            ? '<img src="' + esc(String(it.photo).trim()) + '" alt="' + esc(it.name || '') + '" loading="lazy">'
            : esc(initials(it.name || ''));
          return '<div class="member"><div class="avatar">' + face + '</div><div class="name">' + esc(it.name || '') + '</div><div class="role">' + rich(it.role || '') + '</div></div>';
        }
        if (tpl === 'collab') return '<div class="collab"><div class="name">' + esc(it.name || '') + '</div><div class="role">' + rich(it.role || '') + '</div></div>';
        if (tpl === 'pub') {
          var link = it.link && String(it.link).trim();
          var title = link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener">' + rich(it.title || '') + '</a>' : rich(it.title || '');
          return '<div class="pub" data-area="' + esc(it.area || '') + '">' +
            '<div class="pt">' + title + '</div>' +
            (it.authors ? '<div class="pa">' + rich(it.authors) + '</div>' : '') +
            (it.meta ? '<div class="pm">' + rich(it.meta) + '</div>' : '') +
            '</div>';
        }
        if (tpl === 'study') return '<div class="example"><span class="tag">' + esc(it.tag || '') + '</span><span class="t">' + rich(it.text || '') + '</span></div>';
        if (tpl === 'problem') return '<div class="problem"><div><h3>' + esc(it.title || '') + '</h3><p>' + rich(it.desc || '') + '</p>' + (it.needs ? '<span class="needs">' + rich(it.needs) + '</span>' : '') + '</div></div>';
        return '';
      }).join('');
    });
  }).catch(function () { /* file failed to load -> keep baked-in text */ });
})();
