"use strict";
/* ==========================================================
   admin.js — studio dashboard (shared helpers: common.js)
   1. State & helpers   2. Tabs & dialogs   3. Bookings
   4. Clients   5. Finance   6. Catalog   7. Gallery
   8. Site settings   9. Backup, export & live sync
   ========================================================== */

/* ---------- 1. State & helpers ---------- */
let d = db(), cEdit = null, editId = null;
const STATUSES = ["new", "confirmed", "done", "paid", "cancel"];
const TIMES = [ANY, "10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00", "18:00–20:00"];
const LISTS = {
  ratio: [["", "r.auto"], ["1/1", "r.sq"], ["4/3", "r.land"], ["16/9", "r.wide"], ["4/5", "r.p45"], ["3/4", "r.p34"]],
  fit: [["", "fit.fill"], ["contain", "fit.contain"]],
  pos: [["", "pos.c"], ["top", "pos.t"], ["bottom", "pos.b"], ["left", "pos.l"], ["right", "pos.r"]]
};
const opts = (l, cur) => l.map(([v, k]) => `<option value="${v}"${v == (cur || "") ? " selected" : ""}>${t(k)}</option>`).join("");
const timeOpts = v => (v && !TIMES.includes(v) ? [v, ...TIMES] : TIMES).map(x => `<option value="${esc(x)}"${x == v ? " selected" : ""}>${esc(tm(x))}</option>`).join("");
const waN = p => { let n = String(p || "").replace(/\D/g, ""); if (n.length == 11 && n[0] == "8") n = "7" + n.slice(1); if (n.length == 10) n = "7" + n; return n };
const refsOf = b => b.refs && b.refs.length ? b.refs : b.ref ? [b.ref] : [];
const setRefs = (b, a) => { b.refs = a; b.ref = a[0] || "" };
const day = x => new Date(x).toISOString().slice(0, 10), today = () => day(Date.now());
const cn = id => (d.clients.find(c => c.id == id) || { name: id == 0 ? t("a.web") : "—" }).name;
const download = (name, txt, type) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500) };
const save = () => { if (!dbSave(d)) toast(t("a.full")); render() };
const unpaidSum = () => d.bookings.filter(b => b.status != "paid" && b.status != "cancel").reduce((s, b) => s + b.price, 0);

/* ---------- 2. Tabs & dialogs ---------- */
$("#tabs").onclick = e => {
  const b = e.target.closest("button"); if (!b) return;
  $$("#tabs button").forEach(x => x.setAttribute("aria-selected", x == b));
  ["bk", "cl", "fn", "it", "wk", "st"].forEach(k => $("#" + k).hidden = k != b.dataset.t);
};
document.addEventListener("click", e => {                         // photo zoom
  const i = e.target.closest(".thumb");
  if (i) { $("#big").src = i.src; $("#dlg").showModal() } else if (e.target == $("#dlg")) $("#dlg").close();
});
function modal(title, fields = [], yes = t("a.confirm")) {        // resolves to array of values, or null if cancelled
  return new Promise(res => {
    const dl = $("#cdlg"); $("#cdt").textContent = title;
    $("#cdb").innerHTML = fields.map(f => `<label>${esc(f.l)}<input value="${esc(f.v || "")}"></label>`).join("");
    $("#cdy").textContent = yes; let r = null;
    $("#cdf").onsubmit = e => { e.preventDefault(); r = $$("#cdb input").map(x => x.value); dl.close() };
    $("#cdn").onclick = () => dl.close();
    dl.onclose = () => res(r); dl.showModal();
    const f = $("#cdb input"); f && f.focus();
  });
}
const sure = async m => !!await modal(m, [], t("a.del"));

/* ---------- 3. Bookings ---------- */
$("#nba").onclick = () => {
  const c = $("#nbc").value; if (!c) return toast(t("a.addclient"));
  d.bookings.push({ id: Date.now(), clientId: +c, design: $("#nbd").value.trim() || t("a.untitled"), date: $("#nbt").value, time: $("#nbtm").value, note: "", ref: "", status: "confirmed", price: +$("#nbp").value || 0, created: new Date().toISOString() });
  $("#nbd").value = ""; $("#nbp").value = ""; save();
};
$("#bt").onchange = async e => {
  const x = e.target;
  if (x.dataset.ra) { const b = d.bookings.find(v => v.id == x.dataset.ra); if (!b) return; setRefs(b, [...refsOf(b), ...await Promise.all([...x.files].map(f => shrink(f)))]); return save() }
  if (x.dataset.pay) {
    const b = d.bookings.find(v => v.id == x.dataset.pay); if (!b) return;
    if (x.checked) { b.status = "paid"; b.paid = b.paid || today() } else { if (b.status == "paid") b.status = "done"; delete b.paid }
    return save();
  }
  const b = d.bookings.find(v => v.id == x.dataset.id); if (!b) return; const f = x.dataset.f;
  if (f == "status") { b.status = x.value; if (x.value == "paid" && !b.paid) b.paid = today(); if (x.value != "paid") delete b.paid }
  else if (f == "price") b.price = +x.value || 0; else if (f == "date") b.date = x.value; else if (f == "time") b.time = x.value; else if (f == "design") b.design = x.value.trim() || b.design;
  save();
};
$("#bt").onclick = async e => {
  const del = e.target.closest("[data-del]"), rx = e.target.closest("[data-rx]");
  if (del && await sure(t("a.delbk.q"))) { d.bookings = d.bookings.filter(v => v.id != del.dataset.del); save() }
  if (rx) { const [id, i] = rx.dataset.rx.split(":"), b = d.bookings.find(v => v.id == id); if (b) { setRefs(b, refsOf(b).filter((_, k) => k != +i)); save() } }
};
function renderBookings() {
  const keep = $("#nbc").value;
  $("#nbc").innerHTML = d.clients.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join(""); if (keep) $("#nbc").value = keep;
  const q = ($("#bq").value || "").toLowerCase().trim(), fl = $("#bf").value,
    hay = b => { const c = d.clients.find(x => x.id == b.clientId) || {}; return [b.design, c.name, c.phone, b.date, b.time, b.note].join(" ").toLowerCase() },
    pass = b => fl == "all" || (fl == "new" && b.status == "new") || (fl == "unpaid" && b.status != "paid" && b.status != "cancel") || (fl == "paid" && b.status == "paid") || (fl == "cancel" && b.status == "cancel");
  const list = d.bookings.filter(b => pass(b) && (!q || hay(b).includes(q))).sort((a, b) => (b.date || b.created).localeCompare(a.date || a.created)), nn = d.bookings.filter(b => b.status == "new").length;
  $("#bkb").textContent = nn ? " · " + nn : "";
  $("#bt").innerHTML = list.length ? list.map(b => {
    const c = d.clients.find(x => x.id == b.clientId), pd = b.status == "paid", id = b.id;
    return `<article class="bc${pd ? " paid" : ""}">
      <div class="bh"><div>${c ? `<b>${esc(c.name)}</b><br><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a> · <a href="https://wa.me/${waN(c.phone)}" target="_blank" rel="noopener">WhatsApp</a>` : `<b>${t("a.web")}</b>`}</div>
        <button class="b" data-del="${id}" aria-label="${t("a.delbk")}">✕</button></div>
      <label><span>${t("a.design")}</span><input value="${esc(b.design)}" data-id="${id}" data-f="design"></label>${b.note ? `<small>${esc(b.note)}</small>` : ""}
      <div class="bg"><label><span>${t("a.date")}</span><input type="date" value="${esc(b.date || "")}" data-id="${id}" data-f="date"></label>
        <label><span>${t("a.time")}</span><select data-id="${id}" data-f="time">${timeOpts(b.time)}</select></label>
        <label><span>${t("a.price")}</span><input type="number" min="0" step="50" value="${b.price}" data-id="${id}" data-f="price"></label>
        <label><span>${t("a.status")}</span><select class="st" data-s="${b.status}" data-id="${id}" data-f="status">${STATUSES.map(k => `<option value="${k}"${k == b.status ? " selected" : ""}>${t("st." + k)}</option>`).join("")}</select></label></div>
      <div class="ph">${refsOf(b).map((r, i) => `<span class="pw"><img class="thumb" src="${r}" alt="${t("a.preview")}"><button class="x" data-rx="${id}:${i}" aria-label="${t("a.rmphoto")}">✕</button></span>`).join("")}<label class="fl b" style="padding:4px 14px;align-self:center" aria-label="${t("a.addphoto.a")}">${t("a.addphoto")}<input class="vh" type="file" accept="image/*" multiple data-ra="${id}"></label></div>
      <div class="bf2"><label class="sw${pd ? " on" : ""}"><input class="vh" type="checkbox" data-pay="${id}"${pd ? " checked" : ""}><span class="tg"></span><span>${t(pd ? "a.paid" : "a.unpaid")}<small dir="rtl" lang="ar">${ARABIC[pd ? 0 : 1]}</small></span></label></div></article>`;
  }).join("") : `<p class="empty">${t("a.nobk")}</p>`;
  $("#bkp").innerHTML = [["k.new", nn, nn > 0], ["k.today", d.bookings.filter(b => b.date == today()).length], ["k.unpaid", fmt(unpaidSum())]]
    .map(([k, v, h]) => `<div class="k${h ? " hl" : ""}"><span>${t(k)}</span><b>${v}</b></div>`).join("");
}

/* ---------- 4. Clients ---------- */
const cReset = () => { cEdit = null;["#cn", "#cp", "#cz", "#cf"].forEach(s => $(s).value = ""); $("#ca").dataset.i18n = "a.saveclient"; $("#ca").textContent = t("a.saveclient"); $("#cx").hidden = true };
$("#ca").onclick = async () => {
  const n = $("#cn").value.trim(), p = $("#cp").value.trim();
  if (n.length < 2 || p.replace(/\D/g, "").length < 10) return toast(t("a.badclient"));
  const ph = await Promise.all([...$("#cf").files].map(f => shrink(f)));
  const ex = cEdit ? d.clients.find(c => c.id == cEdit) : d.clients.find(c => c.phone.replace(/\D/g, "") == p.replace(/\D/g, ""));
  if (ex) { ex.name = n; ex.phone = p; ex.note = cEdit ? $("#cz").value : ($("#cz").value || ex.note); ex.photos.push(...ph) }
  else d.clients.push({ id: Date.now(), name: n, phone: p, note: $("#cz").value, photos: ph });
  cReset(); save();
};
$("#cx").onclick = cReset;
$("#cg").onclick = async e => {
  const del = e.target.closest("[data-cd]"), ed = e.target.closest("[data-ce]"), px = e.target.closest("[data-cpx]");
  if (ed) {
    const c = d.clients.find(v => v.id == ed.dataset.ce); cEdit = c.id;
    $("#cn").value = c.name; $("#cp").value = c.phone; $("#cz").value = c.note || "";
    $("#ca").dataset.i18n = "a.savechg"; $("#ca").textContent = t("a.savechg"); $("#cx").hidden = false; scrollTo({ top: 0, behavior: "smooth" });
  }
  if (px) { const [id, i] = px.dataset.cpx.split(":"), c = d.clients.find(v => v.id == id); if (c) { c.photos.splice(+i, 1); save() } }
  if (del && await sure(t("a.delclient"))) { d.clients = d.clients.filter(c => c.id != del.dataset.cd); d.bookings = d.bookings.filter(b => b.clientId != del.dataset.cd); save() }
};
$("#cg").onchange = async e => { const x = e.target; if (!x.dataset.add) return; const c = d.clients.find(v => v.id == x.dataset.add); c.photos.push(...await Promise.all([...x.files].map(f => shrink(f)))); save() };
function renderClients() {
  $("#cg").innerHTML = d.clients.length ? d.clients.map(c => {
    const bk = d.bookings.filter(b => b.clientId == c.id), sum = bk.filter(b => b.status == "paid").reduce((s, b) => s + b.price, 0);
    return `<article class="cc"><h3>${esc(c.name)}</h3><p><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></p><p>${esc(c.note) || t("a.nonotes")}</p>
      <div class="ph">${c.photos.map((p, i) => `<span class="pw"><img class="thumb" src="${p}" alt="${t("a.preview")}"><button class="x" data-cpx="${c.id}:${i}" aria-label="${t("a.rmphoto")}">✕</button></span>`).join("")}</div>
      <p>${t("a.visits", bk.length, fmt(sum))}</p>
      <div class="acts"><input type="file" accept="image/*" multiple data-add="${c.id}" aria-label="${t("a.addphoto.a")}"><button class="b" data-ce="${c.id}">${t("a.edit")}</button><button class="b" data-cd="${c.id}">${t("a.del")}</button></div></article>`;
  }).join("") : `<p class="empty">${t("a.noclients")}</p>`;
}

/* ---------- 5. Finance ---------- */
function renderFinance() {
  const tr = d.bookings.filter(b => b.status == "paid").map(b => ({ ...b, paid: b.paid || day(b.created) })).sort((a, b) => b.paid.localeCompare(a.paid));
  const sum = f => tr.filter(f).reduce((s, b) => s + b.price, 0), now = today(), wk = day(Date.now() - 6 * 864e5), mo = now.slice(0, 7);
  const tot = sum(() => 1), avg = tr.length ? tot / tr.length : 0;
  $("#kp").innerHTML = [["k.today", sum(b => b.paid == now), 1], ["k.d7", sum(b => b.paid >= wk)], ["k.month", sum(b => b.paid.startsWith(mo))], ["k.total", tot], ["k.avg", avg], ["k.unpaid", unpaidSum()]]
    .map(([k, v, h]) => `<div class="k${h ? " hl" : ""}"><span>${t(k)}</span><b>${fmt(v)}</b></div>`).join("");
  const days = [...Array(14)].map((_, i) => day(Date.now() - (13 - i) * 864e5)), vals = days.map(x => sum(b => b.paid == x)), mx = Math.max(...vals, 1);
  $("#ch").innerHTML = days.map((x, i) => `<div title="${x}: ${fmt(vals[i])}"><i style="height:${vals[i] / mx * 100}%"></i>${x.slice(8)}</div>`).join("");
  $("#tx").innerHTML = tr.length ? tr.map(b => `<tr><td>${b.paid}</td><td>${esc(cn(b.clientId))}</td><td>${esc(b.design)}</td><td>${fmt(b.price)}</td></tr>`).join("") : `<tr><td colspan="4" class="empty">${t("a.notx")}</td></tr>`;
}

/* ---------- 6. Catalog (feeds Services, Shop and the Recommended page) ---------- */
function resetItem() { editId = null;["it_t", "it_te", "it_d", "it_de", "it_p", "it_o", "it_f"].forEach(i => $("#" + i).value = ""); $("#it_r").checked = true; $("#ia").dataset.i18n = "a.itadd"; $("#ia").textContent = t("a.itadd"); $("#ic").hidden = true }
$("#ia").onclick = async () => {
  const ti = $("#it_t").value.trim(), p = +$("#it_p").value, old = +$("#it_o").value || 0;
  if (!ti || !(p > 0)) return toast(t("a.badit")); if (old && old <= p) return toast(t("a.badold"));
  const f = $("#it_f").files[0], prev = d.items.find(x => x.id == editId), img = f ? await shrink(f, 600) : (prev ? prev.img : "");
  const o = { ...(prev || {}), id: editId || Date.now(), kind: $("#it_k").value, title: ti, te: $("#it_te").value.trim(), desc: $("#it_d").value.trim(), de: $("#it_de").value.trim(), price: p, old, img, rec: $("#it_r").checked }, i = d.items.findIndex(x => x.id == editId);
  i >= 0 ? d.items[i] = o : d.items.unshift(o); resetItem(); save();
};
$("#ic").onclick = resetItem;
$("#ig").onclick = async e => {
  const ed = e.target.closest("[data-ie]"), del = e.target.closest("[data-idel]"), t0 = e.target.closest("[data-dap],[data-drm],[data-adj]"), rp = e.target.closest("[data-irp]");
  if (ed) {
    const i = d.items.find(x => x.id == ed.dataset.ie); editId = i.id;
    $("#it_k").value = i.kind; $("#it_t").value = i.title; $("#it_te").value = i.te || ""; $("#it_d").value = i.desc; $("#it_de").value = i.de || ""; $("#it_p").value = i.price; $("#it_o").value = i.old || ""; $("#it_r").checked = i.rec !== false;
    $("#ia").dataset.i18n = "a.savechg"; $("#ia").textContent = t("a.savechg"); $("#ic").hidden = false; scrollTo({ top: 0, behavior: "smooth" });
  }
  if (del && await sure(t("a.delit"))) { d.items = d.items.filter(x => x.id != del.dataset.idel); save() }
  if (rp) { const i = d.items.find(x => x.id == rp.dataset.irp); if (i) { i.img = ""; save() } }
  if (t0) {                                                       // quick price / discount controls
    const i = d.items.find(x => x.id == (t0.dataset.dap || t0.dataset.drm || t0.dataset.adj)); if (!i) return;
    if (t0.dataset.dap) {
      const p = +$(`[data-dp="${i.id}"]`).value; if (!(p > 0 && p < 100)) return toast(t("a.baddisc"));
      const base = i.old > i.price ? i.old : i.price; i.old = base; i.price = Math.max(10, Math.round(base * (1 - p / 100) / 10) * 10);
    } else if (t0.dataset.drm) { if (i.old > i.price) i.price = i.old; i.old = 0 }
    else { i.price = Math.max(50, i.price + (+t0.dataset.v)); if (i.old && i.price >= i.old) i.old = 0 }
    save();
  }
};
$("#ig").onchange = async e => {
  const x = e.target;
  if (x.dataset.ic) { const [id, f] = x.dataset.ic.split(":"), i = d.items.find(v => v.id == id); if (i) { x.value ? i[f] = x.value : delete i[f]; save() } return }
  if (!x.dataset.ip) return; const i = d.items.find(v => v.id == x.dataset.ip); if (i && x.files[0]) { i.img = await shrink(x.files[0], 600); save() }
};
function renderItems() {
  $("#ig").innerHTML = d.items.length ? d.items.map(i => {
    const sale = i.old > i.price, id = i.id;
    return `<article class="cc">${i.img ? `<img class="thumb" style="width:100%;height:auto;aspect-ratio:${esc(i.ratio || "4/3")};${imgSt(i)}" src="${esc(i.img)}" alt="">` : ""}
      <h3>${esc(i.title)}</h3><p>${t("kind." + i.kind)}${i.rec ? " · " + t("a.inrec") : ""}</p><p>${esc(i.desc)}</p>
      <p><b>${fmt(i.price)}</b>${sale ? ` <s>${fmt(i.old)}</s> (−${Math.round((1 - i.price / i.old) * 100)}%)` : ""}</p>
      <div class="form" style="grid-template-columns:70px auto auto"><input type="number" min="1" max="99" placeholder="%" data-dp="${id}" aria-label="${t("a.disc")}"><button class="b" data-dap="${id}">${t("a.discbtn")}</button><button class="b" data-drm="${id}"${sale ? "" : " disabled"}>${t("a.discoff")}</button></div>
      <div class="acts"><label class="fl b">${t("a.repl")}<input class="vh" type="file" accept="image/*" data-ip="${id}"></label><button class="b" data-irp="${id}"${i.img ? "" : " disabled"}>${t("a.rmimg")}</button></div>
      <div class="form"><label><span>${t("a.ratio")}</span><select data-ic="${id}:ratio">${opts(LISTS.ratio, i.ratio)}</select></label><label><span>${t("a.fit.s")}</span><select data-ic="${id}:fit">${opts(LISTS.fit, i.fit)}</select></label><label><span>${t("a.pos")}</span><select data-ic="${id}:pos">${opts(LISTS.pos, i.pos)}</select></label></div>
      <div class="acts"><button class="b" data-adj="${id}" data-v="-100">−100 ₽</button><button class="b" data-adj="${id}" data-v="100">+100 ₽</button><button class="b" data-ie="${id}">${t("a.edit")}</button><button class="b" data-idel="${id}">${t("a.del")}</button></div></article>`;
  }).join("") : `<p class="empty">${t("a.noit")}</p>`;
}

/* ---------- 7. Gallery ---------- */
$("#wa").onclick = async () => {
  const f = $("#wk_f").files[0]; if (!f) return toast(t("a.wk.pick"));
  d.works.unshift({ id: Date.now(), img: await shrink(f, 900), title: $("#wk_t").value.trim() || t("a.untitled"), te: $("#wk_te").value.trim() });
  ["wk_t", "wk_te", "wk_f"].forEach(i => $("#" + i).value = ""); save();
};
$("#wgl").onclick = async e => {
  const r = e.target.closest("[data-wr]"), x = e.target.closest("[data-wd]"), m = e.target.closest("[data-wm]");
  if (r) {
    const w = d.works.find(v => v.id == r.dataset.wr), v = await modal(t("a.rename.h"), [{ l: t("a.title.ru"), v: w.title }, { l: t("a.title.en"), v: w.te || "" }], t("a.save"));
    if (!v) return; w.title = v[0].trim() || w.title; w.te = v[1].trim(); save();
  }
  if (m) { const [id, s] = m.dataset.wm.split(":"), i = d.works.findIndex(v => v.id == id), n = i + +s; if (i >= 0 && n >= 0 && n < d.works.length) { [d.works[i], d.works[n]] = [d.works[n], d.works[i]]; save() } }
  if (x && await sure(t("a.delwk"))) { d.works = d.works.filter(v => v.id != x.dataset.wd); save() }
};
$("#wgl").onchange = async e => {
  const x = e.target;
  if (x.dataset.wc) { const [id, f] = x.dataset.wc.split(":"), w = d.works.find(v => v.id == id); if (w) { x.value ? w[f] = x.value : delete w[f]; save() } return }
  if (!x.dataset.wp) return; const w = d.works.find(v => v.id == x.dataset.wp); if (w && x.files[0]) { w.img = await shrink(x.files[0], 900); save() }
};
function renderWorks() {
  $("#wgl").innerHTML = d.works.length ? d.works.map((w, k) => `<article class="cc"><img class="thumb" style="width:100%;height:auto;aspect-ratio:${esc(w.ratio || "4/5")};${imgSt(w)}" src="${esc(w.img)}" alt=""><h3>${esc(w.title)}</h3><p>${esc(w.te)}</p>
    <div class="form"><label><span>${t("a.ratio")}</span><select data-wc="${w.id}:ratio">${opts(LISTS.ratio, w.ratio)}</select></label><label><span>${t("a.fit.s")}</span><select data-wc="${w.id}:fit">${opts(LISTS.fit, w.fit)}</select></label><label><span>${t("a.pos")}</span><select data-wc="${w.id}:pos">${opts(LISTS.pos, w.pos)}</select></label></div>
    <div class="acts"><label class="fl b">${t("a.repl")}<input class="vh" type="file" accept="image/*" data-wp="${w.id}"></label><button class="b" data-wr="${w.id}">${t("a.rename")}</button></div>
    <div class="acts"><button class="b" data-wm="${w.id}:-1" aria-label="${t("a.left")}"${k ? "" : " disabled"}>←</button><button class="b" data-wm="${w.id}:1" aria-label="${t("a.right")}"${k < d.works.length - 1 ? "" : " disabled"}>→</button><button class="b" data-wd="${w.id}">${t("a.del")}</button></div></article>`).join("") : `<p class="empty">${t("a.nowk")}</p>`;
}

/* ---------- 8. Site settings ---------- */
const HERO_DEF = "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=900&q=80", MASTER_DEF = "images/master.jpg";
const SF = { s_call: "call", s_calle: "calle", s_hero: "hero", s_heroe: "heroe", s_role: "role", s_rolee: "rolee", s_atext: "atext", s_atexte: "atexte", s_ph: "phone", s_wa: "wa", s_vk: "vk", s_ad: "addr", s_ade: "addre", s_adh: "hint", s_adhe: "hinte", s_himgpos: "himgpos", s_himgfit: "himgfit", s_mimgpos: "mimgpos", s_mimgfit: "mimgfit", s_mimgratio: "mimgratio" };
const l2t = a => a.map(x => x.join(" | ")).join("\n");
const t2l = s => s.split("\n").map(x => x.trim()).filter(Boolean).map(x => { const i = x.indexOf("|"); return i < 0 ? [x, ""] : [x.slice(0, i).trim(), x.slice(i + 1).trim()] });
const defList = (k, e) => RD[k].map(x => e ? [x[2], x[3]] : [x[0], x[1]]);
function fillStatic() {                                           // selects whose option labels depend on language
  $("#nbtm").innerHTML = timeOpts("");
  $$("[data-o]").forEach(s => s.innerHTML = opts(LISTS[s.dataset.o], s.value));
}
function fillSite() {
  const s = d.site;
  fillStatic();
  Object.entries(SF).forEach(([id, k]) => $("#" + id).value = s[k] || "");
  ["tr", "tp", "sg"].forEach(k => {
    $("#s_" + k).value = l2t((s.lists && s.lists[k]) || defList(k, false));
    $("#s_" + k + "e").value = l2t((s.listsEn && s.listsEn[k]) || defList(k, true));
  });
  $("#pv_himg").src = s.himg || HERO_DEF; $("#pv_mimg").src = s.mimg || MASTER_DEF;
}
$("#sa").onclick = async () => {
  const s = d.site;
  Object.entries(SF).forEach(([id, k]) => { const v = $("#" + id).value.trim(); v ? s[k] = v : delete s[k] });
  s.lists = s.lists || {}; s.listsEn = s.listsEn || {};
  ["tr", "tp", "sg"].forEach(k => [["lists", "", false], ["listsEn", "e", true]].forEach(([store, sfx, isEn]) => {
    const l = t2l($("#s_" + k + sfx).value);
    // empty or identical to the built-in default → keep the default (so it translates correctly)
    if (!l.length || JSON.stringify(l) == JSON.stringify(defList(k, isEn))) delete s[store][k]; else s[store][k] = l;
  }));
  const h = $("#s_himg").files[0], m = $("#s_mimg").files[0]; if (h) s.himg = await shrink(h, 900); if (m) s.mimg = await shrink(m, 900);
  $("#s_himg").value = ""; $("#s_mimg").value = ""; save(); fillSite(); toast(t("a.saved"));
};
$("#st").onclick = e => { const b = e.target.closest("[data-rs]"); if (b) { const k = b.dataset.rs;["", "pos", "fit", "ratio"].forEach(x => delete d.site[k + x]); save(); fillSite() } };

/* ---------- 9. Backup, CSV export, live sync ---------- */
const q2 = s => '"' + String(s ?? "").replace(/"/g, '""') + '"';
$("#csv").onclick = () => {
  const head = ["a.date", "a.time", "a.client", "a.phone", "a.design", "csv.price", "a.status", "csv.pay"].map(k => t(k));
  const rows = [head, ...d.bookings.map(b => { const c = d.clients.find(x => x.id == b.clientId) || {}; return [b.date || "", tm(b.time || ""), c.name || cn(b.clientId), c.phone || "", b.design, b.price, t("st." + b.status), t(b.status == "paid" ? "a.paid" : "a.unpaid")] })];
  download("bookings-" + today() + ".csv", "\ufeff" + rows.map(r => r.map(q2).join(";")).join("\n"), "text/csv");
};
$("#bkx").onclick = () => download("darya-nails-backup-" + today() + ".json", JSON.stringify(d), "application/json");
$("#bki").onchange = async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try {
    const x = JSON.parse(await f.text());
    if (!x || typeof x != "object" || !Array.isArray(x.clients || []) || !Array.isArray(x.bookings || [])) throw 0;
    if (!await modal(t("a.restore.q"), [], t("a.restore"))) return;
    localStorage.setItem("dn", JSON.stringify(x)); d = db(); render(); fillSite(); toast(t("a.restored"));
  } catch (err) { toast(t("a.badfile")) }
};
$("#bq").oninput = renderBookings; $("#bf").onchange = renderBookings;
addEventListener("storage", () => { d = db(); render() });
document.addEventListener("visibilitychange", () => { if (!document.hidden) { d = db(); render() } });
setInterval(() => {                                               // pick up new website requests while the panel is open
  if (!document.hidden && !document.activeElement.matches("input,select,textarea")) {
    const n = db(); if (JSON.stringify(n.bookings) != JSON.stringify(d.bookings)) { d = n; render() }
  }
}, 4000);

/* ---------- Render & start ---------- */
function render() { renderBookings(); renderClients(); renderFinance(); renderItems(); renderWorks() }
window.onLang = () => { render(); fillStatic() };
fillStatic(); render(); fillSite();
