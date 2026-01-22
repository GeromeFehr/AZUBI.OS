// ============================================================
// AZUBI.OS SHOP CORE (GitHub Pages friendly)
// - Warenkorb (localStorage)
// - Gutschein (Demo)
// - Checkout Validierung (Adresse + Payment)
// - Bestellung erzeugen + Success Seite
// - Fake-Rechnung als HTML Download (kein Backend)
// ============================================================

const PRODUCT = {
  id: "azubios-alpha",
  name: "AZUBI.OS – Alpha Build",
  price: 29.95,
  img: "azubios-box.png",
  trialDays: 30
};

const LS = {
  cart: "azubios_cart_v1",
  billing: "azubios_billing_v1",
  order: "azubios_last_order_v1",
  coupon: "azubios_coupon_v1"
};

const fmtEUR = (n) => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(n);

const store = {
  get(key, fallback){
    try{ return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)); }
    catch{ return fallback; }
  },
  set(key, val){
    localStorage.setItem(key, JSON.stringify(val));
  },
  del(key){
    localStorage.removeItem(key);
  }
};

function toast(msg){
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=> el.style.opacity = "0", 1600);
  setTimeout(()=> el.remove(), 2100);
}

function cartGet(){ return store.get(LS.cart, []); }
function cartSet(items){ store.set(LS.cart, items); }
function cartCount(){
  return cartGet().reduce((s,it)=> s + (it.qty||0), 0);
}
function cartSubtotal(){
  return cartGet().reduce((s,it)=> s + (it.price * (it.qty||0)), 0);
}

function cartAddOne(){
  const cart = cartGet();
  const i = cart.findIndex(x=> x.id === PRODUCT.id);
  if(i >= 0) cart[i].qty += 1;
  else cart.push({ ...PRODUCT, qty: 1 });
  cartSet(cart);
  updateCartBadge();
  toast("✅ In den Warenkorb gelegt. TD95 approved. 😉");
}

function cartRemoveAll(){
  cartSet([]);
  updateCartBadge();
}

function cartSetQty(qty){
  const q = Math.max(1, Math.min(99, Number(qty)||1));
  const cart = cartGet();
  const i = cart.findIndex(x=> x.id === PRODUCT.id);
  if(i >= 0){
    cart[i].qty = q;
    cartSet(cart);
  }
  updateCartBadge();
}

function applyCoupon(codeRaw){
  const code = String(codeRaw||"").trim().toUpperCase();

  // Demo-Coupons:
  // - "IT25" -> 25% off
  // - "TD95" -> 9.5% off (Easteregg)
  let coupon = null;

  if(code === "IT25"){
    coupon = { code, type:"percent", value:25, label:"IT25 – 25% Rabatt" };
  } else if(code === "TD95"){
    coupon = { code, type:"percent", value:9.5, label:"TD95 – 9,5% Rabatt 😉" };
  } else if(code === ""){
    coupon = null;
  } else {
    coupon = { code, type:"invalid", value:0, label:"Ungültiger Gutschein" };
  }

  store.set(LS.coupon, coupon);
  return coupon;
}

function getCoupon(){
  return store.get(LS.coupon, null);
}

function calcTotals(){
  const sub = cartSubtotal();
  const c = getCoupon();

  let discount = 0;
  if(c && c.type === "percent"){
    discount = sub * (c.value/100);
  }

  // Trial ist gratis → heute fällig = 0, aber wir zeigen trotzdem Shop-typische Summen.
  // Optional: "Nach Trial" Betrag (Demo-Text).
  const total = Math.max(0, sub - discount);
  const dueToday = 0;

  return { sub, discount, total, dueToday, coupon: c };
}

function updateCartBadge(){
  const el = document.getElementById("cartCount");
  if(el) el.textContent = String(cartCount());
}

// -------------------- Checkout Validation --------------------
function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||"").trim()); }

function billingSaveFromForm(prefix="b_"){
  const name = document.getElementById(prefix+"name")?.value?.trim() || "";
  const street = document.getElementById(prefix+"street")?.value?.trim() || "";
  const zip = document.getElementById(prefix+"zip")?.value?.trim() || "";
  const city = document.getElementById(prefix+"city")?.value?.trim() || "";
  const country = document.getElementById(prefix+"country")?.value || "DE";
  const email = document.getElementById(prefix+"email")?.value?.trim() || "";

  const ok =
    name.length >= 3 &&
    street.length >= 3 &&
    zip.length >= 4 &&
    city.length >= 2 &&
    validEmail(email);

  if(!ok) return { ok:false };

  const billing = { name, street, zip, city, country, email };
  store.set(LS.billing, billing);
  return { ok:true, billing };
}

function billingLoadToForm(prefix="b_"){
  const b = store.get(LS.billing, null);
  if(!b) return;

  const set = (id,val) => { const el = document.getElementById(prefix+id); if(el) el.value = val; };

  set("name", b.name || "");
  set("street", b.street || "");
  set("zip", b.zip || "");
  set("city", b.city || "");
  set("country", b.country || "DE");
  set("email", b.email || "");
}

// -------------------- Order + Invoice (Demo) --------------------
function newOrderNumber(){
  // Demo-Order: AZU-YYYYMMDD-xxxxx
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  const rnd = String(Math.floor(Math.random()*90000)+10000);
  return `AZU-${y}${m}${day}-${rnd}`;
}

function placeOrder(paymentMethod){
  const cart = cartGet();
  if(!cart.length) return { ok:false, reason:"Warenkorb leer" };

  const billing = store.get(LS.billing, null);
  if(!billing) return { ok:false, reason:"Rechnungsadresse fehlt" };

  const totals = calcTotals();
  const order = {
    orderNo: newOrderNumber(),
    createdAt: new Date().toISOString(),
    items: cart,
    billing,
    totals,
    payment: { method: paymentMethod || "trial" },
    trial: { days: PRODUCT.trialDays, startsAt: new Date().toISOString() }
  };

  store.set(LS.order, order);
  return { ok:true, order };
}

function invoiceHTML(order){
  const lines = order.items.map(it => `
    <tr>
      <td>${it.name}</td>
      <td style="text-align:right;">${it.qty}</td>
      <td style="text-align:right;">${fmtEUR(it.price)}</td>
      <td style="text-align:right;">${fmtEUR(it.price*it.qty)}</td>
    </tr>
  `).join("");

  const { sub, discount, total } = order.totals;

  return `<!doctype html>
<html lang="de"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Rechnung ${order.orderNo}</title>
<style>
  body{ font-family: Arial, sans-serif; margin:40px; color:#111; }
  h1{ margin:0 0 8px; }
  .muted{ color:#666; }
  table{ width:100%; border-collapse:collapse; margin-top:18px; }
  th,td{ border-bottom:1px solid #ddd; padding:10px; }
  th{ text-align:left; background:#f7f7f7; }
  .right{ text-align:right; }
  .box{ border:1px solid #ddd; padding:12px; border-radius:10px; }
</style>
</head><body>
  <h1>Rechnung</h1>
  <div class="muted">Bestellnummer: <b>${order.orderNo}</b> • Datum: ${new Date(order.createdAt).toLocaleString("de-DE")}</div>

  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-top:18px;">
    <div class="box">
      <b>Rechnungsadresse</b><br/>
      ${order.billing.name}<br/>
      ${order.billing.street}<br/>
      ${order.billing.zip} ${order.billing.city}<br/>
      ${order.billing.country}<br/>
      <span class="muted">${order.billing.email}</span>
    </div>
    <div class="box">
      <b>Hinweis</b><br/>
      Dies ist eine Demo-Rechnung (Projekt).<br/>
      Testversion: ${order.trial.days} Tage gratis.
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Artikel</th><th class="right">Menge</th><th class="right">Preis</th><th class="right">Summe</th></tr>
    </thead>
    <tbody>
      ${lines}
    </tbody>
  </table>

  <div style="margin-top:18px; max-width:420px; margin-left:auto;">
    <div style="display:flex; justify-content:space-between;"><span>Zwischensumme</span><b>${fmtEUR(sub)}</b></div>
    <div style="display:flex; justify-content:space-between;"><span>Rabatt</span><b>${fmtEUR(discount)}</b></div>
    <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:18px;"><span>Gesamt</span><b>${fmtEUR(total)}</b></div>
    <div class="muted" style="margin-top:6px;">Heute fällig: <b>${fmtEUR(0)}</b> (Testversion)</div>
  </div>
</body></html>`;
}

function downloadInvoice(){
  const order = store.get(LS.order, null);
  if(!order) return toast("Keine Bestellung gefunden.");

  const html = invoiceHTML(order);
  const blob = new Blob([html], { type:"text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `Rechnung_${order.orderNo}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}

// -------------------- Page Hooks --------------------
function onReady(fn){
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
  else fn();
}

onReady(() => {
  updateCartBadge();

  // Buttons (wenn vorhanden)
  document.getElementById("btnAddToCart")?.addEventListener("click", cartAddOne);

  // Cart page actions
  document.getElementById("btnClearCart")?.addEventListener("click", () => {
    cartRemoveAll();
    renderCartPage();
    toast("🗑️ Warenkorb geleert.");
  });

  document.getElementById("qtyInput")?.addEventListener("input", (e) => {
    cartSetQty(e.target.value);
    renderCartPage();
  });

  document.getElementById("btnApplyCoupon")?.addEventListener("click", () => {
    const code = document.getElementById("couponInput")?.value || "";
    const c = applyCoupon(code);

    if(c && c.type === "percent") toast(`✅ Gutschein aktiv: ${c.label}`);
    else toast("❌ Gutschein ungültig.");

    renderCartPage();
  });

  // Checkout page actions
  document.getElementById("btnSaveBilling")?.addEventListener("click", (e) => {
    e.preventDefault();
    const r = billingSaveFromForm("b_");
    const err = document.getElementById("billingErr");

    if(!r.ok){
      err && (err.style.display = "block");
      return;
    }
    err && (err.style.display = "none");
    toast("✅ Rechnungsadresse gespeichert.");
    renderCheckoutSummary();
  });

  document.getElementById("btnPlaceOrder")?.addEventListener("click", (e) => {
    e.preventDefault();

    const pm = document.querySelector('input[name="paymethod"]:checked')?.value || "trial";
    const billing = store.get(LS.billing, null);
    const cart = cartGet();
    const err = document.getElementById("checkoutErr");

    if(!cart.length){
      err && (err.textContent = "Warenkorb ist leer."); err && (err.style.display = "block");
      return;
    }
    if(!billing){
      err && (err.textContent = "Bitte zuerst eine Rechnungsadresse speichern."); err && (err.style.display = "block");
      return;
    }

    err && (err.style.display = "none");

    const placed = placeOrder(pm);
    if(!placed.ok){
      err && (err.textContent = placed.reason || "Fehler beim Checkout."); err && (err.style.display = "block");
      return;
    }

    // optional: Warenkorb nach Bestellung leeren
    cartRemoveAll();

    // success page
    window.location.href = "success.html";
  });

  // Success page actions
  document.getElementById("btnInvoice")?.addEventListener("click", downloadInvoice);

  // Auto-render pages if containers exist
  renderCartPage();
  billingLoadToForm("b_");
  renderCheckoutSummary();
  renderSuccess();
});

function renderCartPage(){
  const el = document.getElementById("cartRender");
  if(!el) return;

  const cart = cartGet();
  const totals = calcTotals();

  if(!cart.length){
    el.innerHTML = `
      <div class="card section">
        <h2>Warenkorb ist leer</h2>
        <p>Pack AZUBI.OS rein und starte die <b>${PRODUCT.trialDays} Tage Testversion</b>.</p>
        <a class="btn btn-primary" href="index.html">Zurück zum Produkt</a>
      </div>
    `;
    updateCartBadge();
    return;
  }

  const c = totals.coupon;
  const couponLine = c && c.type === "percent"
    ? `<div style="display:flex; justify-content:space-between;"><span>Rabatt (${c.code})</span><b>- ${fmtEUR(totals.discount)}</b></div>`
    : `<div style="display:flex; justify-content:space-between;"><span>Rabatt</span><b>${fmtEUR(0)}</b></div>`;

  el.innerHTML = `
    <div class="card section">
      <h2>Warenkorb</h2>
      <p>Shop-Flow: Warenkorb → Rechnungsadresse → Testversion aktivieren → Bestätigung.</p>

      <table class="table">
        <tr class="row">
          <td style="width:110px;">
            <img src="${PRODUCT.img}" alt="" style="width:90px; height:auto; border-radius:14px; mix-blend-mode: lighten; filter: drop-shadow(0 14px 35px rgba(255,79,216,.20));">
          </td>
          <td>
            <div style="font-weight:950;">${PRODUCT.name}</div>
            <div class="small">Digitaler Artikel • Trial: ${PRODUCT.trialDays} Tage gratis</div>
          </td>
          <td style="width:140px; text-align:right; font-weight:950;">${fmtEUR(PRODUCT.price)}</td>
        </tr>
      </table>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-top:14px;">
        <div class="card section" style="margin:0;">
          <h2 style="font-size:18px;">Menge & Gutschein</h2>
          <div class="small">Menge</div>
          <input class="input" id="qtyInput" type="number" min="1" max="99" value="${cart[0].qty}">
          <div style="height:10px;"></div>
          <div class="small">Gutschein</div>
          <div style="display:flex; gap:10px;">
            <input class="input" id="couponInput" placeholder="z.B. IT25 oder TD95" value="${(c && c.code && c.type!=="invalid") ? c.code : ""}">
            <button class="btn" id="btnApplyCoupon">Anwenden</button>
          </div>
          <div class="small" style="margin-top:10px;">
            Demo-Codes: <b>IT25</b> (25%), <b>TD95</b> (9,5% 😉)
          </div>

          <div style="margin-top:12px;">
            <button class="btn" id="btnClearCart">Warenkorb leeren</button>
          </div>
        </div>

        <div class="card section" style="margin:0;">
          <h2 style="font-size:18px;">Zusammenfassung</h2>
          <div style="display:flex; justify-content:space-between;"><span>Zwischensumme</span><b>${fmtEUR(totals.sub)}</b></div>
          ${couponLine}
          <div style="height:8px;"></div>
          <div style="display:flex; justify-content:space-between; font-size:18px;"><span>Gesamt</span><b>${fmtEUR(totals.total)}</b></div>
          <div class="small" style="margin-top:8px;">Heute fällig: <b>${fmtEUR(0)}</b> (Testversion)</div>

          <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
            <a class="btn btn-primary" href="checkout.html">Zur Kasse</a>
            <a class="btn" href="index.html">Weiter shoppen</a>
          </div>
        </div>
      </div>
    </div>
  `;

  updateCartBadge();
}

function renderCheckoutSummary(){
  const el = document.getElementById("checkoutSummary");
  if(!el) return;

  const cart = cartGet();
  const totals = calcTotals();
  const billing = store.get(LS.billing, null);

  if(!cart.length){
    el.innerHTML = `
      <div class="card section">
        <h2>Zur Kasse</h2>
        <p>Dein Warenkorb ist leer. Pack zuerst AZUBI.OS rein.</p>
        <a class="btn btn-primary" href="index.html">Zum Produkt</a>
      </div>
    `;
    updateCartBadge();
    return;
  }

  el.innerHTML = `
    <div class="card section">
      <h2>Bestellübersicht</h2>
      <div class="small">${PRODUCT.name} • Menge: <b>${cart[0].qty}</b></div>

      <div style="height:10px;"></div>

      <div style="display:flex; justify-content:space-between;"><span>Zwischensumme</span><b>${fmtEUR(totals.sub)}</b></div>
      <div style="display:flex; justify-content:space-between;"><span>Rabatt</span><b>- ${fmtEUR(totals.discount)}</b></div>
      <div style="height:8px;"></div>
      <div style="display:flex; justify-content:space-between; font-size:18px;"><span>Gesamt</span><b>${fmtEUR(totals.total)}</b></div>
      <div class="small" style="margin-top:8px;">Heute fällig: <b>${fmtEUR(0)}</b> (Trial)</div>

      <div style="height:10px;"></div>

      <div class="small">Rechnungsadresse: ${billing ? "<b style='color:var(--ok)'>ok</b>" : "<b style='color:var(--bad)'>fehlt</b>"}</div>
    </div>
  `;

  updateCartBadge();
}

function renderSuccess(){
  const el = document.getElementById("successRender");
  if(!el) return;

  const order = store.get(LS.order, null);
  if(!order){
    el.innerHTML = `
      <div class="card section">
        <h2>Keine Bestellung gefunden</h2>
        <p>Du hast noch keine Bestellung abgeschlossen.</p>
        <a class="btn btn-primary" href="index.html">Zur Startseite</a>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="card section">
      <h1>✅ Bestellung bestätigt</h1>
      <p>Danke! Deine <b>${PRODUCT.trialDays} Tage Testversion</b> ist jetzt aktiv (Demo).</p>

      <div class="chip">Bestellnummer: <b>${order.orderNo}</b></div>
      <div style="height:10px;"></div>

      <div class="card section" style="margin:0;">
        <h2 style="font-size:18px;">Was passiert jetzt?</h2>
        <p class="small">
          In einem echten Shop würden wir jetzt eine Lizenz erzeugen und dir per E-Mail senden.
          Hier simulieren wir das: <b>Trial aktiviert</b> + Rechnung verfügbar.
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-primary" id="btnInvoice">Rechnung herunterladen</button>
          <a class="btn" href="index.html">Zurück zur Startseite</a>
        </div>
      </div>
    </div>
  `;
}