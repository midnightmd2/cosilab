/* Keep one accessible logo set; its inert visual copy completes the loop. */
(function () {
  var marquee = document.querySelector('.partner-marquee');
  if (!marquee) return;
  var track = marquee.querySelector('.partner-track');
  var group = marquee.querySelector('.partner-group');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var copy;

  function syncCopy() {
    if (reduce.matches) return;
    var next = group.cloneNode(true);
    next.setAttribute('aria-hidden', 'true');
    next.setAttribute('inert', '');
    next.removeAttribute('id');
    next.querySelectorAll('[id], [data-cms]').forEach(function (el) {
      el.removeAttribute('id');
      el.removeAttribute('data-cms');
    });
    if (copy) copy.replaceWith(next);
    else track.appendChild(next);
    copy = next;
  }

  function setMotion() {
    if (reduce.matches) {
      marquee.classList.remove('is-animated');
      if (copy) copy.remove();
      copy = null;
    } else {
      syncCopy();
      marquee.classList.add('is-animated');
    }
  }

  // CMS text may arrive after this deferred script. Mirror only that source set.
  new MutationObserver(syncCopy).observe(group, { childList: true, subtree: true, characterData: true });
  if (reduce.addEventListener) reduce.addEventListener('change', setMotion);
  else reduce.addListener(setMotion);
  setMotion();
})();
