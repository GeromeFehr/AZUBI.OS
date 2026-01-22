import { PRODUCT, store, fmtEUR, toast, normalizeCart, cartSubtotal, cartCount, cartSetQty, cartRemove, updateCartBadge } from "./shop.js";

const $ = (id) => document.getElementById(id);

function render() {
  const cart = normalizeCart();
  updateCartBadge();

  const empty = cartCount(cart) <= 0;

  $("emptyState").style.display = empty ? "block" : "none";
  $("cartItem").style.display = empty ? "none" : "grid";
  $("checkoutLink").style.opacity = empty ? ".5" : "1";
  $("checkoutLink").style.pointerEvents = empty ? "none" : "auto";

  $("subtotal").textContent = fmtEUR(cartSubtotal(cart));
  $("dueToday").textContent = fmtEUR(0);

  if (!empty) {
    const it = cart.find(i => i.id === PRODUCT.id) || cart[0];

    $("itemImg").src = it.img || "azubios-box.png";
    $("itemName").textContent = it.name || "AZUBI.OS";
    $("itemPrice").textContent = fmtEUR(it.price || 0);
    $("itemQtyChip").textContent = `x${it.qty || 1}`;
  }
}

function plus() {
  const cart = normalizeCart();
  const it = cart.find(i => i.id === PRODUCT.id);
  const q = (it?.qty || 0) + 1;
  cartSetQty(PRODUCT.id, q);
  toast("➕ Menge erhöht.");
  render();
}

function minus() {
  const cart = normalizeCart();
  const it = cart.find(i => i.id === PRODUCT.id);
  const q = (it?.qty || 0) - 1;
  cartSetQty(PRODUCT.id, q);
  toast("➖ Menge reduziert.");
  render();
}

function removeAll() {
  cartRemove(PRODUCT.id);
  toast("🗑️ Artikel entfernt.");
  render();
}

function clearCart() {
  store.clearCart();
  toast("🧹 Warenkorb geleert.");
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  render();

  $("plusBtn")?.addEventListener("click", plus);
  $("minusBtn")?.addEventListener("click", minus);
  $("removeAllBtn")?.addEventListener("click", removeAll);
  $("clearCartBtn")?.addEventListener("click", clearCart);
});
