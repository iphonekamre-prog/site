"use strict";
/* ==========================================================
   script.js — home page
   Catalog sections · gallery · booking form → success page
   (shared helpers live in common.js)
   ========================================================== */

/* ---------- Hero glow follows the pointer ---------- */
$("#hero").onpointermove = e => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", e.clientX - r.left + "px");
  e.currentTarget.style.setProperty("--my", e.clientY - r.top + "px");
};

/* ---------- Catalog: services, shop, gallery ---------- */
const svcPager = mkPager({ box: $("#svc"), btn: $("#svc-more"), page: 4, onMore: renderCatalog });
const prdPager = mkPager({ box: $("#prd"), btn: $("#prd-more"), sortBar: $("#prd-sort"), page: 4, onMore: renderCatalog });
const wgPager  = mkPager({ box: $("#wg"),  btn: $("#wg-more"),  page: 8, onMore: renderCatalog });

function renderCatalog() {
  const d = db(), svc = d.items.filter(i => i.kind === "Услуга"), prd = d.items.filter(i => i.kind === "Товар");
  svcPager.draw(svc, card);
  prdPager.draw(sortBy(prd, $("#prd-order").value), card);
  wgPager.draw(d.works, w => {
    const ti = en() && w.te ? w.te : w.title;
    return `<figure class="w"><img style="${w.ratio ? `aspect-ratio:${esc(w.ratio)};` : ""}${imgSt(w)}" src="${esc(w.img)}" alt="${esc(ti)}" loading="lazy" onerror="this.closest('figure').remove()"><figcaption>${esc(ti)}</figcaption></figure>`;
  });
  $("#services").hidden = $("#nsvc").hidden = !svc.length;
  $("#products").hidden = $("#nprd").hidden = !prd.length;
  $("#works").hidden = $("#nwrk").hidden = !d.works.length;
  buildDesignSelect(d.items);
}
function buildDesignSelect(items) {
  const s = $("#design"), v = s.value;
  s.innerHTML = "";
  DESIGNS.forEach(x => s.add(new Option(en() ? x[1] : x[0], x[0])));
  items.forEach(it => s.add(new Option(ttl(it), it.title)));
  s.add(new Option(t("f.own"), OWN));
  if ([...s.options].some(o => o.value === v)) s.value = v;
}
$("#prd-order").onchange = renderCatalog;

/* gallery lightbox */
$("#wg").onclick = e => { const i = e.target.closest("img"); if (!i) return; $("#lbi").src = i.src; $("#lbi").alt = i.alt; $("#lb").showModal() };
$("#lb").onclick = () => $("#lb").close();

/* keep in sync when the master edits data in another tab */
addEventListener("storage", e => { if (e.key === "dn") { renderCatalog(); applySite() } });
document.addEventListener("visibilitychange", () => { if (!document.hidden) renderCatalog() });
window.onLang = renderCatalog;

/* ---------- Inspiration photos (max 3, click or drag & drop) ---------- */
let refs = [];
const up = $("#up"), rin = $("#ref");
function addRefs(list) {
  [...list].filter(f => f.type.startsWith("image/")).forEach(f => { if (refs.length < 3) refs.push(f) });
  $("#prev").innerHTML = refs.map(f => `<img src="${URL.createObjectURL(f)}" alt="">`).join("");
}
up.onclick = () => rin.click();
up.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); rin.click() } };
rin.onchange = () => { addRefs(rin.files); rin.value = "" };
["dragenter", "dragover"].forEach(v => up.addEventListener(v, e => { e.preventDefault(); up.classList.add("over") }));
["dragleave", "drop"].forEach(v => up.addEventListener(v, e => { e.preventDefault(); up.classList.remove("over") }));
up.addEventListener("drop", e => addRefs(e.dataTransfer.files));

/* ---------- Booking form → save → success page ---------- */
$("[name=date]").min = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

$("#form").onsubmit = async e => {
  e.preventDefault();
  const f = e.target, name = f.name.value.trim(), phone = f.phone.value.trim();
  const nameOk = name.length > 1, phoneOk = phone.replace(/\D/g, "").length >= 10 && /^[+\d\s()\-]+$/.test(phone);
  f.name.closest("label").classList.toggle("bad", !nameOk);
  f.phone.closest("label").classList.toggle("bad", !phoneOk);
  if (!nameOk || !phoneOk) return (nameOk ? f.phone : f.name).focus();

  const btn = $("#send"); btn.disabled = true; btn.textContent = t("f.sending");
  const photos = await Promise.all(refs.map(x => shrink(x))), d = db(), digits = phone.replace(/\D/g, "");
  let c = d.clients.find(x => x.phone.replace(/\D/g, "") === digits);
  if (!c) { c = { id: Date.now(), name, phone, note: "", photos: [] }; d.clients.push(c) }
  c.photos.push(...photos);
  const time = f.querySelector("[name=time]:checked").value;
  d.bookings.push({ id: Date.now() + 1, clientId: c.id, design: f.design.value, date: f.date.value, time, note: f.note.value, ref: photos[0] || "", refs: photos, status: "new", price: 0, created: new Date().toISOString() });
  dbSave(d);   // TODO production: also POST this payload to your backend

  try {
    sessionStorage.setItem("dnLast", JSON.stringify({
      name, phone, design: f.design.value, designLabel: f.design.selectedOptions[0].textContent,
      date: f.date.value, time, note: f.note.value.trim()
    }));
  } catch (err) { }
  go("success.html");
};

/* ---------- Start ---------- */
const pre = new URLSearchParams(location.search).get("pick");     // arriving from the Recommended page
renderCatalog();
if (pre && [...$("#design").options].some(o => o.value === pre)) $("#design").value = pre;
