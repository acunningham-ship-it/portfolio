// Renders the portfolio from data.js.
let FILES = [];                       // all media filenames (from media-list.json)
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mediaURL = (f) => "media/" + encodeURIComponent(f);

// expand special tokens / arrays into a real file list (only files that exist)
function imgs(spec) {
  let list = spec;
  if (!Array.isArray(spec)) list = [];
  return list.filter((f) => FILES.includes(f));
}

function navHTML() {
  return window.SITE.nav.map((n) => {
    if (n.children) {
      const sub = n.children.map((c) => `<a href="#/${c.slug}" data-slug="${c.slug}">${esc(c.title)}</a>`).join("");
      return `<div class="nav-drop"><a href="#/${n.slug}" data-slug="${n.slug}">${esc(n.title)} ▾</a><div class="nav-menu">${sub}</div></div>`;
    }
    return `<a href="#/${n.slug}" data-slug="${n.slug}">${esc(n.title)}</a>`;
  }).join("");
}

let lb = { list: [], i: 0, back: null };
function openLB(list, i) { lb = { list, i, back: document.activeElement }; $("#lightbox").hidden = false; document.body.style.overflow = "hidden"; showLB(); $(".lb-close").focus(); }
function closeLB() { $("#lightbox").hidden = true; document.body.style.overflow = ""; if (lb.back) lb.back.focus(); }
function showLB() {
  if (!lb.list.length) return;
  lb.i = (lb.i + lb.list.length) % lb.list.length;
  const f = lb.list[lb.i];
  $("#lb-img").src = mediaURL(f); $("#lb-img").alt = (window.SITE.captions || {})[f] || "";
  $("#lb-count").textContent = `${lb.i + 1} / ${lb.list.length}`;
  const cap = (window.SITE.captions || {})[f] || "";
  const el = $("#lb-caption"); el.textContent = cap; el.style.display = cap ? "block" : "none";
}

function gallery(list) {
  if (!list.length) return "";
  return `<div class="grid" data-gallery='${esc(JSON.stringify(list))}'>` +
    list.map((f, i) => `<button class="g-item" data-i="${i}"><img src="${mediaURL(f)}" alt="${esc((window.SITE.captions || {})[f] || "")}" loading="lazy"></button>`).join("") + `</div>`;
}

function slideshowHTML(list) {
  list = imgs(list);
  if (!list.length) return "";
  return `<div class="slideshow" data-i="0" data-list='${esc(JSON.stringify(list))}'>` +
    `<div class="ss-stage">` +
    list.map((f, i) => `<img class="ss-slide${i === 0 ? " active" : ""}" data-i="${i}" src="${mediaURL(f)}" alt="" loading="lazy">`).join("") +
    `</div>` +
    `<button class="ss-prev" aria-label="Previous slide">‹</button>` +
    `<button class="ss-next" aria-label="Next slide">›</button>` +
    `<div class="ss-count mono">1 / ${list.length}</div>` +
    `</div>`;
}

function sectionHTML(s) {
  if (s.head) return `<div class="section-head section-break"><h2>${esc(s.head)}</h2></div>`;
  const list = imgs(s.images || []);
  let h = `<section class="block">`;
  if (s.sub && !s.heading) h += `<p class="band mono">${esc(s.sub)}</p>`;
  h += `<h2>${esc(s.heading || "")}</h2>`;
  if (s.sub && s.heading) h += `<p class="sub">${esc(s.sub)}</p>`;
  if (s.body) h += `<p class="body">${esc(s.body)}</p>`;
  if (s.link) h += `<a class="btn btn-primary sec-btn" href="${esc(s.link.url)}" target="_blank" rel="noopener">${esc(s.link.label || "Visit")} ↗</a>`;
  if (s.video && FILES.includes(s.video)) h += `<video class="vid" controls src="${mediaURL(s.video)}"></video>`;
  if (s.videos) h += `<div class="vgrid">` + s.videos.filter((v) => FILES.includes(v.file)).map((v) =>
    `<figure><video controls playsinline preload="none" poster="${mediaURL(v.poster)}" src="${mediaURL(v.file)}"></video><figcaption>${esc(v.label)}</figcaption></figure>`).join("") + `</div>`;
  if (s.item) h += `<p class="item-label mono">${esc(s.item)}</p>`;
  if (s.caption) h += `<p class="caption">${esc(s.caption)}</p>`;
  h += gallery(list);
  if (s.note) h += `<p class="note mono">${esc(s.note)}</p>`;
  return h + `</section>`;
}

function render(slug) {
  const P = window.SITE.pages;
  const p = Object.hasOwn(P, slug) ? slug : "home";
  const page = P[p];
  document.querySelectorAll("#nav-links [data-slug]").forEach((a) => a.classList.toggle("active", a.dataset.slug === p));
  $("#nav-links").classList.remove("open");
  const c = $("#content"); window.scrollTo(0, 0);

  let inner = "";
  if (page.type === "sections") inner = (page.banner || "") + `<div class="section-head"><h2>${esc(page.title)}</h2></div>` + slideshowHTML(page.slideshow || []) + page.sections.map(sectionHTML).join("");

  c.innerHTML = `<section class="section container">${inner}</section>`;
}

function route() { render(location.hash.replace(/^#\//, "") || "home"); }

async function init() {
  $("#nav-links").innerHTML = navHTML();
  try { FILES = await (await fetch("media-list.json")).json(); } catch (e) { FILES = []; }
  try { window.SITE.captions = Object.assign({}, await (await fetch("captions.json")).json(), window.SITE.captions || {}); } catch (e) { window.SITE.captions = window.SITE.captions || {}; }
  // lightbox wiring
  $(".lb-close").onclick = closeLB;
  $(".lb-prev").onclick = () => { lb.i--; showLB(); };
  $(".lb-next").onclick = () => { lb.i++; showLB(); };
  $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") closeLB(); });
  document.addEventListener("keydown", (e) => {
    if ($("#lightbox").hidden) return;
    if (e.key === "Tab") {  // keep focus inside the open dialog
      const b = [...$("#lightbox").querySelectorAll("button")], k = b.indexOf(document.activeElement);
      e.preventDefault(); b[(k + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus(); return;
    }
    if (e.key === "Escape") closeLB(); if (e.key === "ArrowLeft") { lb.i--; showLB(); } if (e.key === "ArrowRight") { lb.i++; showLB(); }
  });
  $("#content").addEventListener("click", (e) => {
    const ssBtn = e.target.closest(".ss-prev, .ss-next");
    if (ssBtn) {
      const box = ssBtn.closest(".slideshow"), list = JSON.parse(box.dataset.list);
      const i = (+box.dataset.i + (ssBtn.classList.contains("ss-next") ? 1 : -1) + list.length) % list.length;
      box.dataset.i = i;
      box.querySelectorAll(".ss-slide").forEach((s) => s.classList.toggle("active", +s.dataset.i === i));
      box.querySelector(".ss-count").textContent = `${i + 1} / ${list.length}`;
      return;
    }
    const slide = e.target.closest(".ss-slide");
    if (slide) { const box = slide.closest(".slideshow"); openLB(JSON.parse(box.dataset.list), +box.dataset.i); return; }
    const b = e.target.closest(".g-item"); if (!b) return;
    const list = JSON.parse(b.closest(".grid").dataset.gallery);
    openLB(list, +b.dataset.i);
  });
  if (window.SITE.nav.length < 2) $("#menu-btn").style.display = "none";
  $("#menu-btn").onclick = () => $("#nav-links").classList.toggle("open");
  window.addEventListener("hashchange", route);
  route();
}
init();
