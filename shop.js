// shop.js — shared engine for AZUBI.OS shop (GitHub Pages friendly)

// ---------- constants ----------
const STORAGE = {
  CART: "azubios_cart_v1",
  BILLING: "azubios_billing_v1",
  ORDERS: "azubios_orders_v1",
};

const PRODUCT = {
  id: "azubios-alpha",
  name: "AZUBI.OS – Alpha Build",
  price: 29.95,
  img: "azubios-box.png",
};

// ---------- helpers ----------
export const fmtEUR = (n) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

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
    background: "rgba(10,8,18,.75)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,.55)",
    color: "rgba(255,255,255,.92)",
    fontWeight: "900",
    letterSpacing: ".2px",
    zIndex: "9999",
    transition: "opacity .4s ease",
  });
  document.body.appendChild(el);
  setTimeout(() => (el.style.opacity = "0"), 1600);
  setTimeout(() => el.remove(), 2100);
}

// ---------- storage ----------
function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

export const store = {
  getCart() {
    return safeParse(localStorage.getItem(STORAGE.CART) || "[]", []);
  },
  setCart(items) {
    localStorage.setItem(STORAGE.CART, JSON.stringify(items));
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

// ---------- cart logic ----------
export function cartAddOne() {
  const cart = store.getCart();
  const idx = cart.findIndex((i) => i.id === PRODUCT.id);
  if (idx >= 0) cart[idx].qty += 1;
  else cart.push({ ...PRODUCT, qty: 1 });
  store.setCart(cart);
  return cart;
}

export function cartRemoveAll() {
  store.setCart([]);
}

export function cartCount(cart = store.getCart()) {
  return cart.reduce((s, it) => s + (it.qty || 0), 0);
}

export function cartSubtotal(cart = store.getCart()) {
  return cart.reduce((s, it) => s + (it.price * (it.qty || 0)), 0);
}

export function ensureProductInCart() {
  const cart = store.getCart();
  if (!cart.find((i) => i.id === PRODUCT.id)) {
    store.setCart([{ ...PRODUCT, qty: 1 }]);
  }
  return store.getCart();
}

// ---------- UI: badge everywhere ----------
export function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  badge.textContent = String(cartCount());
}

// ---------- page bindings ----------
export function bindGlobalNav() {
  // optional: keep badge in nav updated
  updateCartBadge();
}

// ---------- expose product ----------
export { PRODUCT };
