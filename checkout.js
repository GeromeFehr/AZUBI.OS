import { $, toast, fmtEUR, store, cartCount, cartSubtotal, normalizeCart, updateCartBadge } from "./shop.js";

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function readForm() {
  return {
    name: $("#f_name")?.value.trim() || "",
    street: $("#f_street")?.value.trim() || "",
    zip: $("#f_zip")?.value.trim() || "",
    city: $("#f_city")?.value.trim() || "",
    country: $("#f_country")?.value || "DE",
    email: $("#f_email")?.value.trim() || "",
  };
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
  $("#stepA")?.classList.toggle("active", step === "address");
  $("#stepB")?.classList.toggle("active", step === "review");
  $("#panelAddress").style.display = step === "address" ? "block" : "none";
  $("#panelReview").style.display = step === "review" ? "block" : "none";
}

function renderSummary() {
  normalizeCart();
  updateCartBadge();

  $("#subtotal").textContent = fmtEUR(cartSubtotal());
  $("#dueToday").textContent = fmtEUR(0);

  const b = store.getBilling();
  $("#addrStatus").textContent = b ? "✅ ok" : "❌ fehlt";
  $("#addrPreview").textContent = b
    ? `${b.name}, ${b.street}, ${b.zip} ${b.city}, ${b.country} • ${b.email}`
    : "Keine Adresse gespeichert.";
}

function generateKey(len = 16) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function createOrder() {
  const billing = store.getBilling();
  const cart = normalizeCart();

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

document.addEventListener("DOMContentLoaded", () => {
  normalizeCart();
  renderSummary();

  setStep(store.getBilling() ? "review" : "address");

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
    window.location.href = `success.html?order=${encodeURIComponent(order.id)}`;
  });
});
