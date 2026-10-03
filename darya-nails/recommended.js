"use strict";
/* recommended.js — dedicated "Recommended" page
   Studio picks (catalog items flagged in admin) + trends, home care, signature styles */

const picks = mkPager({ box: $("#items"), btn: $("#items-more"), sortBar: $("#rec-sort"), page: 4, onMore: render });

function render() {
  const list = db().items.filter(i => i.rec);
  picks.draw(sortBy(list, $("#rec-order").value), card);
  $("#picks").hidden = false;
  $("#rec-empty").hidden = !!list.length;
  ["tr", "tp", "sg"].forEach(k => $("#" + k).innerHTML = recList(k).map(x => `<li><b>${esc(x[0])}</b><span>${esc(x[1])}</span></li>`).join(""));
}
$("#rec-order").onchange = render;
addEventListener("storage", e => { if (e.key === "dn") render() });
window.onLang = render;
render();
