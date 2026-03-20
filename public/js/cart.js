// ─── Cart page logic ─────────────────────────────────────────────────────────

async function loadCart() {
  requireAuth();
  const container = document.getElementById('cart-container');
  if (!container) return;

  const data = await apiFetch('/api/cart');
  if (!data.success) { container.innerHTML = `<p style="color:var(--danger)">${data.message}</p>`; return; }

  const cart = data.cart;
  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started</p>
        <a href="/" class="btn btn-primary" style="margin-top:16px">Browse Products</a>
      </div>`;
    return;
  }

  const subtotal = cart.totalPrice || cart.items.reduce((a, i) => a + i.price * i.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  container.innerHTML = `
    <div class="cart-layout">
      <div>
        <div class="card" style="padding:0">
          ${cart.items.map(item => `
            <div class="cart-item" id="item-${item.product}">
              <img class="cart-item-img" src="${item.image || 'https://via.placeholder.com/100'}" alt="${item.name}" />
              <div>
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price.toFixed(2)} each</div>
                <div class="qty-control">
                  <button class="qty-btn" onclick="changeQty('${item.product}', ${item.quantity - 1})">−</button>
                  <span class="qty-value">${item.quantity}</span>
                  <button class="qty-btn" onclick="changeQty('${item.product}', ${item.quantity + 1})">+</button>
                </div>
              </div>
              <div class="cart-item-actions" style="text-align:right">
                <div style="font-weight:700;font-size:1.1rem;margin-bottom:12px">₹${(item.price * item.quantity).toFixed(2)}</div>
                <button class="btn btn-ghost btn-sm" onclick="removeItem('${item.product}')" style="color:var(--danger);border-color:var(--danger)">Remove</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="clearCart()">Clear Cart</button>
        </div>
      </div>

      <div class="cart-summary">
        <h3 style="margin-bottom:20px">Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:var(--success)">Free</span>' : '₹' + shipping.toFixed(2)}</span></div>
        ${shipping > 0 ? `<p style="font-size:.8rem;color:var(--text-dim);margin:-4px 0 8px">Free shipping on orders over ₹500</p>` : ''}
        <div class="summary-row total"><span>Total</span><span style="color:var(--primary)">₹${total.toFixed(2)}</span></div>
        <a href="/checkout.html" class="btn btn-primary btn-full" style="margin-top:20px">Proceed to Checkout →</a>
        <a href="/" class="btn btn-ghost btn-full" style="margin-top:10px">Continue Shopping</a>
        <div style="margin-top:20px;text-align:center;font-size:.8rem;color:var(--text-dim)">🔒 Secure checkout powered by Stripe</div>
      </div>
    </div>
  `;
}

async function changeQty(productId, newQty) {
  if (newQty < 1) { removeItem(productId); return; }
  const res = await apiFetch('/api/cart/update', { method: 'PUT', body: JSON.stringify({ productId, quantity: newQty }) });
  if (res.success) { loadCart(); updateCartCount(); }
  else showToast(res.message || 'Error', 'error');
}

async function removeItem(productId) {
  const res = await apiFetch(`/api/cart/remove/${productId}`, { method: 'DELETE' });
  if (res.success) { loadCart(); updateCartCount(); showToast('Item removed', 'info'); }
  else showToast(res.message || 'Error', 'error');
}

async function clearCart() {
  const res = await apiFetch('/api/cart/clear', { method: 'DELETE' });
  if (res.success) { loadCart(); updateCartCount(); showToast('Cart cleared', 'info'); }
}

document.addEventListener('DOMContentLoaded', loadCart);
