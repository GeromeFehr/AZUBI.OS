// checkout.js — handles checkout flow (address -> review -> start trial)

import { $, $$, toast, fmtEUR, store, cartCount, cartSubtotal, ensureProductInCart, updateCartBadge } from "./shop.js";

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function readForm() {
  const data = {
    name: $("#f_name").value.trim(),
    street: $("#f_street").value.trim(),
    zip: $("#f_zip").value.trim(),
    city: $("#f_city").value.trim(),
    country: $("#f_country").value,
    email: $("#f_email").value.trim(),
  };
  return data;
}

function validateBilling(b) {
  return (
    b.name.length >= 3 &&
    b.street.length >= 3 &&
    b.zip.length >= 4 &&
    b.city.length >= 2 &&
    validEmail(b.email)
  );
}

function setStep(step) {
  // step: "address" | "review" | "done"
  $("#stepA").classList.toggle("active", step === "address");
  $("#stepB").classList.toggle("active", step === "review");

  $("#panelAddress").style.display = step === "address" ? "block" : "none";
  $("#panelReview").style.display = step === "review" ? "block" : "none";
}

function renderSummary() {
  const subtotal = cartSubtotal();
  $("#subtotal").textContent = fmtEUR(subtotal);
  $("#dueToday").textContent = fmtEUR(0);

  const b = store.getBilling();
  $("#addrStatus").textContent = b ? "✅ ok" : "❌ fehlt";
  $("#addrStatus").style.color = b ? "var(--ok)" : "rgba(255,255,255,.9)";

  if (b) {
    $("#addrPreview").textContent = `${b.name}, ${b.street}, ${b.zip} ${b.city}, ${b.country} • ${b.email}`;
  } else {
    $("#addrPreview").textContent = "Keine Adresse gespeichert.";
  }
}

function generateKey(len = 16) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function createOrder() {
  const billing = store.getBilling();
  const cart = store.getCart();
  const order = {
    id: "AZ-" + Date.now().toString(36).toUpperCase(),
    createdAt: new Date().toISOString(),
    billing,
    cart,
    subtotal: cartSubtotal(cart),
    dueToday: 0,
    trialDays: 30,
    trialKey: "TRIAL-" + generateKey(14),
  };
  store.pushOrder(order);
  return order;
}

function goSuccess(orderId) {
  // success page reads latest order by ID
  window.location.href = `success.html?order=${encodeURIComponent(orderId)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  ensureProductInCart();
  updateCartBadge();
  renderSummary();

  setStep(store.getBilling() ? "review" : "address");

  // Guarded bindings -> kein Crash wenn IDs fehlen
  $("#saveAddressBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    $("#addrErr")?.classList.remove("show");

    const b = readForm();
    if (!validateBilling(b)) {
      $("#addrErr")?.classList.add("show");
      return;
    }

    store.setBilling(b);
    toast("✅ Rechnungsadresse gespeichert.");
    renderSummary();
    setStep("review");
  });

  $("#editAddressBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    setStep("address");
  });

  $("#startTrialBtn")?.addEventListener("click", (e) => {
    e.preventDefault();

    if (!store.getBilling()) {
      toast("Bitte zuerst Rechnungsadresse angeben.");
      setStep("address");
      return;
    }
    if (cartCount() <= 0) {
      toast("Warenkorb ist leer.");
      window.location.href = "cart.html";
      return;
    }

    const order = createOrder();
    toast("🎉 Testversion gestartet (Demo).");
    goSuccess(order.id);
  });
});
