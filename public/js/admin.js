// ─── Admin JS — handles dashboard, products, and orders pages ─────────────────

const isAdminPage = window.location.pathname.startsWith('/admin');

// ─── Auth guard ────────────────────────────────────────────────────────────────
(async () => {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = '/login.html'; return; }
  const me = await apiFetch('/api/auth/me');
  if (!me.success || me.user?.role !== 'admin') {
    alert('Admin access required.');
    window.location.href = '/login.html';
  }
})();

// ─── Dashboard ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  const statsGrid = document.getElementById('stats-grid');
  if (!statsGrid) return;

  const data = await apiFetch('/api/admin/stats');
  if (!data.success) { statsGrid.innerHTML = `<p style="color:var(--danger)">Failed to load stats</p>`; return; }

  const { totalUsers, totalProducts, totalOrders, totalRevenue } = data.stats;
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">💰</div>
      <div class="stat-label">Total Revenue</div>
      <div class="stat-value gradient-text">₹${totalRevenue.toFixed(2)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📦</div>
      <div class="stat-label">Total Orders</div>
      <div class="stat-value">${totalOrders}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🏷️</div>
      <div class="stat-label">Products</div>
      <div class="stat-value">${totalProducts}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-label">Users</div>
      <div class="stat-value">${totalUsers}</div>
    </div>
  `;

  // Revenue chart
  const chartWrap = document.getElementById('revenue-chart');
  const labelsWrap = document.getElementById('revenue-labels');
  if (chartWrap && data.monthlyRevenue?.length) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const maxRev = Math.max(...data.monthlyRevenue.map(m => m.revenue), 1);
    chartWrap.innerHTML = data.monthlyRevenue.map(m => {
      const pct = Math.max(4, (m.revenue / maxRev) * 100);
      return `<div class="chart-bar" style="height:${pct}%" data-tip="${months[m._id.month-1]}: ₹${m.revenue.toFixed(0)}"></div>`;
    }).join('');
    labelsWrap.innerHTML = data.monthlyRevenue.map(m => `<div class="chart-label">${months[m._id.month-1]}</div>`).join('');
  } else if (chartWrap) {
    chartWrap.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem">No revenue data yet.</p>';
  }

  // Recent orders
  const recentEl = document.getElementById('recent-orders');
  if (recentEl && data.recentOrders?.length) {
    recentEl.innerHTML = data.recentOrders.map(o => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:.85rem;font-weight:600">${o.user?.name || 'Unknown'}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${new Date(o.createdAt).toLocaleDateString()}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;font-size:.9rem">₹${o.totalAmount.toFixed(2)}</div>
          <span class="status-badge status-${o.status}" style="font-size:.65rem">${o.status}</span>
        </div>
      </div>
    `).join('');
  } else if (recentEl) {
    recentEl.innerHTML = '<p style="color:var(--text-muted)">No orders yet.</p>';
  }
}

// ─── Admin Products ─────────────────────────────────────────────────────────────
async function loadAdminProducts() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  const data = await apiFetch('/api/products?limit=100');
  if (!data.success) { tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger)">Failed to load</td></tr>`; return; }

  if (!data.products.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:40px"><div class="icon">🏷️</div><h3>No products yet</h3></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.products.map(p => {
    const img = p.images?.[0]?.url || '';
    return `
      <tr>
        <td><img src="${img}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;background:var(--bg-card2)" /></td>
        <td>
          <div style="font-weight:600;max-width:200px">${p.name}</div>
          ${p.isFeatured ? `<span style="font-size:.7rem;color:var(--primary)">★ Featured</span>` : ''}
        </td>
        <td>${p.category}</td>
        <td>
          <div style="font-weight:600">₹${p.price.toFixed(2)}</div>
          ${p.originalPrice > p.price ? `<div style="text-decoration:line-through;color:var(--text-dim);font-size:.8rem">₹${p.originalPrice.toFixed(2)}</div>` : ''}
        </td>
        <td>
          <span style="color:${p.stock <= 10 ? 'var(--warning)' : 'var(--success)'};font-weight:600">${p.stock}</span>
        </td>
        <td>★ ${(p.rating || 0).toFixed(1)} (${p.numReviews})</td>
        <td>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick='editProduct(${JSON.stringify(p)})'>Edit</button>
            <button class="btn btn-sm" style="background:var(--danger);color:white" onclick="deleteProduct('${p._id}','${p.name.replace(/'/g,"\\'")}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openProductModal(product = null) {
  document.getElementById('product-id').value = product?._id || '';
  document.getElementById('p-name').value = product?.name || '';
  document.getElementById('p-desc').value = product?.description || '';
  document.getElementById('p-price').value = product?.price || '';
  document.getElementById('p-disc').value = product?.originalPrice || '';
  document.getElementById('p-cat').value = product?.category || '';
  document.getElementById('p-stock').value = product?.stock ?? '';
  document.getElementById('p-brand').value = product?.brand || '';
  document.getElementById('p-img').value = product?.images?.[0]?.url || '';
  document.getElementById('p-featured').checked = product?.isFeatured || false;
  document.getElementById('modal-title').textContent = product ? 'Edit Product' : 'Add Product';
  document.getElementById('product-modal').classList.add('open');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
}

function editProduct(p) { openProductModal(p); }

let pendingDeleteId = null;
function deleteProduct(id, name) {
  pendingDeleteId = id;
  document.getElementById('delete-modal').classList.add('open');
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const res = await apiFetch(`/api/products/${pendingDeleteId}`, { method: 'DELETE' });
    document.getElementById('delete-modal').classList.remove('open');
    if (res.success) { showToast('Product deleted', 'success'); loadAdminProducts(); }
    else showToast(res.message || 'Error', 'error');
  });

  document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const body = {
      name: document.getElementById('p-name').value,
      description: document.getElementById('p-desc').value,
      price: Number(document.getElementById('p-price').value),
      originalPrice: document.getElementById('p-disc').value ? Number(document.getElementById('p-disc').value) : null,
      category: document.getElementById('p-cat').value,
      stock: Number(document.getElementById('p-stock').value),
      brand: document.getElementById('p-brand').value,
      isFeatured: document.getElementById('p-featured').checked,
      images: document.getElementById('p-img').value ? [{ url: document.getElementById('p-img').value }] : [],
    };

    const btn = document.getElementById('modal-submit-btn');
    btn.disabled = true; btn.textContent = 'Saving…';

    const res = id
      ? await apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      : await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(body) });

    if (res.success) {
      closeProductModal();
      showToast(id ? 'Product updated' : 'Product created', 'success');
      loadAdminProducts();
    } else {
      showToast(res.message || 'Error saving product', 'error');
    }
    btn.disabled = false; btn.textContent = 'Save Product';
  });
});

// ─── Admin Orders ──────────────────────────────────────────────────────────────
async function loadAdminOrders(status = '') {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  const query = status ? `?status=${status}` : '';
  const data = await apiFetch(`/api/admin/orders${query}`);
  if (!data.success) { tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger)">Failed to load</td></tr>`; return; }

  if (!data.orders.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:40px"><div class="icon">📦</div><h3>No orders</h3></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.orders.map(o => `
    <tr>
      <td style="font-family:monospace;font-size:.75rem">${o._id.slice(-8)}</td>
      <td>
        <div style="font-weight:600">${o.user?.name || 'N/A'}</div>
        <div style="font-size:.75rem;color:var(--text-muted)">${o.user?.email || ''}</div>
      </td>
      <td>${o.items.length} item${o.items.length !== 1 ? 's' : ''}</td>
      <td style="font-weight:700">₹${o.totalAmount.toFixed(2)}</td>
      <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      <td>
        <select class="select-input" style="font-size:.8rem;padding:6px 10px" onchange="updateOrderStatus('${o._id}',this.value,this)">
          <option value="">Change status</option>
          ${['pending','paid','processing','shipped','delivered','cancelled'].map(s =>
            `<option value="${s}" ${o.status === s ? 'selected':''} >${s}</option>`
          ).join('')}
        </select>
      </td>
    </tr>
  `).join('');
}

async function updateOrderStatus(id, status, selectEl) {
  if (!status) return;
  const res = await apiFetch(`/api/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  if (res.success) { showToast(`Order marked as ${status}`, 'success'); }
  else showToast(res.message || 'Error', 'error');
}

function filterOrders(status) { loadAdminOrders(status); }

// ─── Auto-init based on current page ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path === '/admin/' || path === '/admin/index.html') loadDashboard();
  else if (path.includes('/admin/products')) loadAdminProducts();
  else if (path.includes('/admin/orders')) loadAdminOrders();
});
