// ─── Orders history page ─────────────────────────────────────────────────────

async function loadOrders() {
  requireAuth();
  const container = document.getElementById('orders-container');
  if (!container) return;

  const data = await apiFetch('/api/orders');
  if (!data.success) { container.innerHTML = `<p style="color:var(--danger)">${data.message}</p>`; return; }

  if (!data.orders?.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📦</div>
        <h3>No orders yet</h3>
        <p>Your order history will appear here once you make a purchase.</p>
        <a href="/" class="btn btn-primary" style="margin-top:16px">Start Shopping</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      ${data.orders.map(o => `
        <div class="card" style="padding:24px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px">
            <div>
              <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px">Order ID</div>
              <div style="font-family:monospace;font-size:.8rem">${o._id}</div>
            </div>
            <div>
              <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px">Date</div>
              <div style="font-size:.9rem">${new Date(o.createdAt).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'})}</div>
            </div>
            <div>
              <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px">Total</div>
              <div style="font-weight:700;font-size:1.05rem">₹${o.totalAmount.toFixed(2)}</div>
            </div>
            <span class="status-badge status-${o.status}">${o.status}</span>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            ${o.items.map(i => `
              <div style="display:flex;align-items:center;gap:10px;background:var(--bg-card2);padding:8px 12px;border-radius:var(--radius)">
                <img src="${i.image || ''}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;background:var(--border)" />
                <div>
                  <div style="font-size:.85rem;font-weight:600">${i.name}</div>
                  <div style="font-size:.75rem;color:var(--text-muted)">Qty ${i.quantity} · ₹${i.price.toFixed(2)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          ${o.shippingAddress ? `
            <div style="margin-top:16px;font-size:.85rem;color:var(--text-muted)">
              📍 ${o.shippingAddress.street}, ${o.shippingAddress.city}, ${o.shippingAddress.state} ${o.shippingAddress.zipCode}, ${o.shippingAddress.country}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', loadOrders);
