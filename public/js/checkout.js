// ─── Checkout page logic (Stripe Elements) ────────────────────────────────────

let stripeInstance = null;
let cardElement = null;
let cartData = null;

async function initCheckout() {
  requireAuth();
  const layout = document.getElementById('checkout-layout');
  if (!layout) return;

  // Load cart
  const cartRes = await apiFetch('/api/cart');
  if (!cartRes.success || !cartRes.cart?.items?.length) {
    layout.innerHTML = `<div class="empty-state"><div class="icon">🛒</div><h3>Cart is empty</h3><a href="/" class="btn btn-primary" style="margin-top:16px">Shop Now</a></div>`;
    return;
  }
  cartData = cartRes.cart;

  // Get Stripe publishable key from the server config endpoint
  const configRes = await apiFetch('/api/orders/config');
  const publishableKey = configRes?.publishableKey || 'pk_test_placeholder';

  stripeInstance = Stripe(publishableKey);
  const elements = stripeInstance.elements();
  
  const subtotal = cartData.totalPrice || cartData.items.reduce((a, i) => a + i.price * i.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 49;
  const total = subtotal + shipping;

  layout.innerHTML = `
    <div>
      <div class="card" style="padding:28px;margin-bottom:24px">
        <h3 style="margin-bottom:20px">Shipping Information</h3>
        <form id="shipping-form">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" class="form-input" id="ship-name" required />
          </div>
          <div class="form-group">
            <label class="form-label">Street Address *</label>
            <input type="text" class="form-input" id="ship-street" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">City *</label>
              <input type="text" class="form-input" id="ship-city" required />
            </div>
            <div class="form-group">
              <label class="form-label">State / Province *</label>
              <input type="text" class="form-input" id="ship-state" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">PIN Code *</label>
              <input type="text" class="form-input" id="ship-pin" required />
            </div>
            <div class="form-group">
              <label class="form-label">Country *</label>
              <input type="text" class="form-input" id="ship-country" value="IN" required />
            </div>
          </div>
        </form>
      </div>

      <div class="card" style="padding:28px">
        <h3 style="margin-bottom:20px">Payment Details</h3>
        <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:16px">🔒 Secured by Stripe. Use test card: <code style="background:var(--bg-card2);padding:2px 6px;border-radius:4px">4242 4242 4242 4242</code></p>
        <div class="form-group">
          <label class="form-label">Card Information</label>
          <div id="stripe-card-element"></div>
          <div id="card-errors"></div>
        </div>
        <button id="pay-btn" class="btn btn-primary btn-full btn-lg" style="margin-top:8px">
          Pay ₹${total.toFixed(2)}
        </button>
      </div>
    </div>

    <div>
      <div class="cart-summary">
        <h3 style="margin-bottom:20px">Order Summary</h3>
        ${cartData.items.map(i => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:10px">
              <img src="${i.image || ''}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;background:var(--bg-card2)" />
              <div>
                <div style="font-size:.85rem;font-weight:600;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.name}</div>
                <div style="font-size:.75rem;color:var(--text-muted)">Qty: ${i.quantity}</div>
              </div>
            </div>
            <span style="font-weight:600">₹${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="summary-row" style="margin-top:16px"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:var(--success)">Free</span>' : '₹' + shipping.toFixed(2)}</span></div>
        <div class="summary-row total"><span>Total</span><span style="color:var(--primary)">₹${total.toFixed(2)}</span></div>
      </div>
    </div>
  `;

  // Mount Stripe card element
  cardElement = elements.create('card', {
    style: {
      base: {
        color: '#e8eaf6', fontFamily: 'Inter, sans-serif', fontSize: '16px',
        '::placeholder': { color: '#5c6380' },
      },
      invalid: { color: '#f44061' },
    },
  });
  cardElement.mount('#stripe-card-element');
  cardElement.on('change', ({ error }) => {
    document.getElementById('card-errors').textContent = error ? error.message : '';
  });

  document.getElementById('pay-btn').addEventListener('click', handlePayment);
}

async function handlePayment() {
  const btn = document.getElementById('pay-btn');
  btn.disabled = true; btn.textContent = 'Processing…';

  const shippingAddress = {
    name: document.getElementById('ship-name')?.value,
    street: document.getElementById('ship-street')?.value,
    city: document.getElementById('ship-city')?.value,
    state: document.getElementById('ship-state')?.value,
    pinCode: document.getElementById('ship-pin')?.value,
    country: document.getElementById('ship-country')?.value,
  };

  if (Object.values(shippingAddress).some(v => !v)) {
    showToast('Please fill in all shipping fields', 'error');
    btn.disabled = false; btn.textContent = `Pay Now`;
    return;
  }

  // Create PaymentIntent
  const intentRes = await apiFetch('/api/orders/checkout', { method: 'POST' });
  if (!intentRes.success) {
    showToast(intentRes.message || 'Could not initiate payment', 'error');
    btn.disabled = false; btn.textContent = 'Pay Now';
    return;
  }

  // Confirm card payment if real secret provided
  let paymentIntentId = 'pi_mock_secret_123';
  if (intentRes.clientSecret !== 'pi_mock_secret_123') {
    const { paymentIntent, error } = await stripeInstance.confirmCardPayment(intentRes.clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      document.getElementById('card-errors').textContent = error.message;
      btn.disabled = false; btn.textContent = 'Pay Now';
      return;
    }
    paymentIntentId = paymentIntent.id;
  }

  // Confirm order on backend
  const orderRes = await apiFetch('/api/orders/confirm', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId, shippingAddress }),
  });

  if (orderRes.success) {
    window.location.href = `/order-success.html?order=${orderRes.order._id}`;
  } else {
    showToast(orderRes.message || 'Order creation failed', 'error');
    btn.disabled = false; btn.textContent = 'Pay Now';
  }
}

document.addEventListener('DOMContentLoaded', initCheckout);
