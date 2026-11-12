/* SpyWell Live Studio: tiny i18n. Source text is Hindi; translations come from window.I18N_DATA (hindi -> {en,pa,mr,gu,ur}).
   The page DOM is translated at runtime (outside .sr cards); cards use I18N.tr(text, cardLang). */
(function () {
  var LANGS = { hi: ['हिन्दी', 'ltr'], en: ['English', 'ltr'], pa: ['ਪੰਜਾਬੀ', 'ltr'], mr: ['मराठी', 'ltr'], gu: ['ગુજરાતી', 'ltr'], ur: ['اردو', 'rtl'] };
  var D = window.I18N_DATA || {}, cur = 'en', origText = new WeakMap(), lastWritten = new WeakMap(), keys = null, busy = false, obs = null;
  try { var s = localStorage.getItem('sp_lang'); if (s && LANGS[s]) cur = s; } catch (e) { }
  function tr(hi, lang) {
    lang = lang || cur; if (lang === 'hi' || typeof hi !== 'string') return hi;
    var e = D[hi]; if (!e) return hi; return e[lang] || e.en || hi;
  }
  function sortedKeys() { if (!keys) keys = Object.keys(D).filter(function (k) { return k.length >= 5; }).sort(function (a, b) { return b.length - a.length; }); return keys; }
  var DEV = /[ऀ-ॿ]/;
  function trText(t) {
    if (cur === 'hi' || !DEV.test(t)) return t;
    var m = t.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2];
    if (D[core]) return m[1] + tr(core) + m[3];
    var out = core, ks = sortedKeys();
    for (var i = 0; i < ks.length; i++) { var k = ks[i]; if (out.indexOf(k) >= 0) out = out.split(k).join(tr(k)); }
    return m[1] + out + m[3];
  }
  function skipEl(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentNode) {
      var tg = n.tagName; if (tg === 'SCRIPT' || tg === 'STYLE' || tg === 'TEXTAREA' || tg === 'CODE') return true;
      if (n.classList && (n.classList.contains('sr') || n.classList.contains('notranslate'))) return true;
    }
    return false;
  }
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  function doText(node) {
    if (skipEl(node.parentNode)) return;
    var cur_ = node.data, lw = lastWritten.get(node), o;
    if (lw !== undefined && cur_ === lw) o = origText.get(node); else { o = cur_; origText.set(node, o); }
    var t = cur === 'hi' ? o : trText(o);
    if (t !== node.data) { node.data = t; }
    lastWritten.set(node, node.data);
  }
  function doAttrs(el) {
    if (skipEl(el)) return;
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute || !el.hasAttribute(a)) return;
      var store = el.__i18n || (el.__i18n = {}), v = el.getAttribute(a);
      if (store[a] && store[a].w === v) v = store[a].o; else store[a] = { o: v, w: v };
      var t = cur === 'hi' ? v : trText(v); if (t !== el.getAttribute(a)) el.setAttribute(a, t); store[a].w = t;
    });
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (skipEl(root)) return;
    doAttrs(root);
    for (var c = root.firstChild; c; c = c.nextSibling) walk(c);
  }
  function applyAll() { busy = true; try { walk(document.documentElement); } finally { busy = false; } if (obs) obs.takeRecords(); }
  function start() {
    if (obs) return;
    obs = new MutationObserver(function (recs) {
      if (busy) return; busy = true;
      try {
        recs.forEach(function (r) {
          if (r.type === 'childList') { for (var i = 0; i < r.addedNodes.length; i++) walk(r.addedNodes[i]); }
          else if (r.type === 'characterData') doText(r.target);
          else if (r.type === 'attributes') doAttrs(r.target);
        });
      } finally { busy = false; }
      obs.takeRecords();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function setLang(l, temp) {
    if (!LANGS[l]) l = 'hi'; cur = l;
    if (!temp) try { localStorage.setItem('sp_lang', l); } catch (e) { }
    document.documentElement.lang = l; document.documentElement.dir = LANGS[l][1];
    applyAll(); var p = document.getElementById('sp-lang'); if (p) p.value = l;
  }
  function picker() {
    if (document.getElementById('sp-lang') || window.I18N_PICKER === false) return;
    var s = document.createElement('select'); s.id = 'sp-lang'; s.className = 'notranslate'; s.setAttribute('aria-label', 'Language');
    s.style.cssText = 'position:fixed;right:10px;bottom:calc(10px + var(--i18n-lift,0px));z-index:99999;width:auto;max-width:130px;margin:0;padding:6px 8px;border:1px solid #c9a227;border-radius:20px;background:#fff;color:#8b1a2b;font:600 13px system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.2)';
    Object.keys(LANGS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = LANGS[k][0]; s.appendChild(o); });
    s.value = cur; s.onchange = function () { setLang(s.value); }; document.body.appendChild(s);
  }
  window.I18N = { LANGS: LANGS, tr: tr, setLang: setLang, get lang() { return cur; }, apply: applyAll };
  function reveal() { var st = document.getElementById('i18n-hide'); if (st) st.remove(); }
  if (cur !== 'hi') { try { var hs = document.createElement('style'); hs.id = 'i18n-hide'; hs.textContent = 'body{visibility:hidden}'; (document.head || document.documentElement).appendChild(hs); setTimeout(reveal, 1500); } catch (e) { } }
  function init() { document.documentElement.lang = cur; document.documentElement.dir = LANGS[cur][1]; picker(); applyAll(); start(); reveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
;window.spLoc=function(){try{var l=localStorage.getItem('sp_lang')||'hi';return({hi:'hi-IN',en:'en-IN',pa:'pa-IN',mr:'mr-IN',gu:'gu-IN',ur:'ur-PK'})[l]||'hi-IN'}catch(e){return'hi-IN'}};
