"use strict";
/* success.js — confirmation page shown after "Send request" */

let last = null;
try { last = JSON.parse(sessionStorage.getItem("dnLast") || "null") } catch (e) { }
setTimeout(() => $("#arrive") && $("#arrive").remove(), 1400);   // curtain is decorative; remove once it has played

function render() {
  const p = $("#okp"), sum = $("#sum"), wa = $("#okwa");
  if (!last) { p.textContent = t("ok.p0"); sum.hidden = wa.hidden = true; return }
  p.textContent = t("ok.p", last.name);
  const design = last.design === OWN ? t("f.own") : (DESIGNS.find(x => x[0] === last.design) || [])[en() ? 1 : 0] || (db().items.find(i => i.title === last.design) ? ttl(db().items.find(i => i.title === last.design)) : last.design);
  const rows = [["ok.design", design], ["ok.date", last.date || t("ok.anydate")], ["ok.time", tm(last.time)], ["ok.phone", last.phone]];
  if (last.note) rows.push(["ok.note", last.note]);
  sum.innerHTML = rows.map(([k, v]) => `<div><dt>${t(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
  sum.hidden = false;
  const msg = t("wa.book", last.name, last.phone, design, last.date || t("wa.any"), tm(last.time)) + (last.note ? t("wa.note", last.note) : "");
  wa.href = "https://wa.me/" + waNum() + "?text=" + encodeURIComponent(msg);
  wa.hidden = false;
}
window.onLang = render;
render();
