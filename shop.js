/* ============================================================================
   AZUBI.OS – Shop Engine (GitHub Pages / Frontend only)
   - Single Source of Truth für Warenkorb + Billing + Orders
   - Keine doppelten Add-to-cart Effekte
   - localStorage Keys zentral
   ========================================================================== */

// --------------------------- Konfiguration ---------------------------------
const STORAGE = {
  CART: "azubios_cart_v1",
  BILLING: "azubios_billing_v1",
  ORDERS: "azubios_orders_v1",
};

// Euer einziges Produkt (Shop ist Demo -> reicht)
export const PRODUCT = {
  id: "azubios-alpha",
  name: "AZUBI.OS – Alpha Build",
  price: 29.95,
  img: "azubios-box.png",
};

// ---------------------------- Helfer ---------------------------------------
export const fmtEUR = (n) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

export const $ = (sel, root = document) => root.querySelector(sel);

export function toast(msg) {
  const el = document.createElement("div");
  el.textContent = msg;
  Object.assign(el.style, {
    position: "fixed",
    left: "50%",
    bottom: "22px",
    transform: "translateX(-50%)",
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,.18)",
    background: "rgba(10,8,18,.78)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.55)",
    color: "rgba(255,255,255,.92)",
    fontWeight: "900",
    letterSpacing: ".2px",
    zIndex: "9999",
    transition: "opacity .4s ease",
  });
  document.body.appendChild(el);
  setTimeout(() => (el.style.opacity = "0"), 1500);
  setTimeout(() => el.remove(), 2100);
}

function safeParse(txt, fallback) {
  try { return JSON.parse(txt); } catch { return fallback; }
}

// ---------------------------- Store ----------------------------------------
export const store = {
  getCart() {
    return safeParse(localStorage.getItem(STORAGE.CART) || "[]", []);
  },
  setCart(items) {
    localStorage.setItem(STORAGE.CART, JSON.stringify(items));
  },
  clearCart() {
    localStorage.removeItem(STORAGE.CART);
  },

  getBilling() {
    return safeParse(localStorage.getItem(STORAGE.BILLING) || "null", null);
  },
  setBilling(data) {
    localStorage.setItem(STORAGE.BILLING, JSON.stringify(data));
  },
  clearBilling() {
    localStorage.removeItem(STORAGE.BILLING);
  },

  getOrders() {
    return safeParse(localStorage.getItem(STORAGE.ORDERS) || "[]", []);
  },
  pushOrder(order) {
    const orders = store.getOrders();
    orders.unshift(order);
    localStorage.setItem(STORAGE.ORDERS, JSON.stringify(orders));
  },
};

// ------------------------- Warenkorb Utilities ------------------------------
export function normalizeCart() {
  // Verhindert doppelte Einträge -> IDs werden zusammengeführt
  const cart = store.getCart();
  const map = new Map();

  for (const it of cart) {
    if (!it?.id) continue;

    const qty = Math.max(1, Number(it.qty) || 1);
    const existing = map.get(it.id);

    if (!existing) map.set(it.id, { ...it, qty });
    else existing.qty += qty;
  }

  const normalized = [...map.values()];
  store.setCart(normalized);
  return normalized;
}

export function cartCount(cart = normalizeCart()) {
  return cart.reduce((s, it) => s + (it.qty || 0), 0);
}

export function cartSubtotal(cart = normalizeCart()) {
  return cart.reduce((s, it) => s + (Number(it.price) || 0) * (it.qty || 0), 0);
}

export function cartAdd(product = PRODUCT, qty = 1) {
  const cart = normalizeCart();
  const q = Math.max(1, Number(qty) || 1);

  const idx = cart.findIndex((i) => i.id === product.id);
  if (idx >= 0) cart[idx].qty += q;
  else cart.push({ ...product, qty: q });

  store.setCart(cart);
  return cart;
}

export function cartSetQty(productId, qty) {
  const cart = normalizeCart();
  const q = Number(qty) || 0;

  const idx = cart.findIndex((i) => i.id === productId);
  if (idx < 0) return cart;

  if (q <= 0) cart.splice(idx, 1);
  else cart[idx].qty = q;

  store.setCart(cart);
  return cart;
}

export function cartRemove(productId) {
  const cart = normalizeCart().filter((i) => i.id !== productId);
  store.setCart(cart);
  return cart;
}

// ---------------------------- Badge ----------------------------------------
export function updateCartBadge() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  el.textContent = String(cartCount());
}

// --------------------- Global “Add to Cart” Binder --------------------------
// Bindet automatisch jeden Button mit data-add-to-cart
export function bindAddToCartButtons() {
  const btns = [...document.querySelectorAll("[data-add-to-cart]")];

  btns.forEach((btn) => {
    // verhindert doppelte Event-Bindings
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", (e) => {
      e.preventDefault();

      cartAdd(PRODUCT, 1);
      updateCartBadge();
      toast("✅ In den Warenkorb gelegt.");

      // Optional: direkt in den Warenkorb leiten
      if (btn.hasAttribute("data-go-cart")) {
        window.location.href = "cart.html";
      }
    });
  });
}
