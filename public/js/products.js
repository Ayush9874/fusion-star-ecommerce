// ─── Products page logic ─────────────────────────────────────────────────────

let currentPage = 1;
let searchTimeout = null;

function getFilters() {
  const priceVal = document.getElementById('price-filter')?.value || '';
  const [minPrice, maxPrice] = priceVal ? priceVal.split('-') : ['', ''];
  return {
    search: document.getElementById('search-input')?.value || '',
    category: document.getElementById('category-filter')?.value || '',
    sort: document.getElementById('sort-filter')?.value || '-createdAt',
    minPrice,
    maxPrice,
    page: currentPage,
    limit: 12,
  };
}

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
  return params.toString();
}

function renderStars(rating) {
  const full = Math.round(rating || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function renderProductCard(p) {
  const displayPrice = p.price;
  const img = p.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
  return `
    <div class="card product-card" onclick="window.location='/product.html?id=${p._id}'">
      <div class="img-wrap">
        <img src="${img}" alt="${p.name}" loading="lazy" />
        ${p.isFeatured ? `<span class="badge">Featured</span>` : ''}
        ${p.originalPrice > p.price ? `<span class="badge sale" style="left:auto;right:12px">Sale</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-category">${p.category}</div>
        <div class="card-name">${p.name}</div>
        <div class="stars">${[...renderStars(p.rating)].map(s=>`<span class="star">${s}</span>`).join('')}</div>
        <div class="card-price">
          <span class="price">₹${displayPrice.toFixed(2)}</span>
          ${p.originalPrice > p.price ? `<span class="price-old">₹${p.originalPrice.toFixed(2)}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-sm add-cart-btn" onclick="event.stopPropagation();addToCartHome('${p._id}',this)">
          Add to Cart
        </button>
      </div>
    </div>
  `;
}

function renderPagination(page, pages) {
  const pag = document.getElementById('pagination');
  if (!pag) return;
  if (pages <= 1) { pag.innerHTML = ''; return; }
  let html = '';
  if (page > 1) html += `<button class="page-btn" onclick="goPage(${page-1})">‹</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  if (page < pages) html += `<button class="page-btn" onclick="goPage(${page+1})">›</button>`;
  pag.innerHTML = html;
}

async function loadProducts() {
  const container = document.getElementById('products-container');
  if (!container) return;
  container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

  const filters = getFilters();
  const query = buildQuery(filters);
  const data = await apiFetch(`/api/products?${query}`);

  if (!data.success || !data.products?.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters</p>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  container.innerHTML = `<div class="products-grid">${data.products.map(renderProductCard).join('')}</div>`;
  renderPagination(data.page, data.pages);
}

function goPage(page) {
  currentPage = page;
  window.scrollTo({ top: document.getElementById('products')?.offsetTop - 80, behavior: 'smooth' });
  loadProducts();
}

async function addToCartHome(productId, btn) {
  if (!localStorage.getItem('token')) { window.location.href = '/login.html'; return; }
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = 'Adding…';
  const res = await apiFetch('/api/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) });
  if (res.success) {
    btn.textContent = '✓ Added';
    setTimeout(() => { btn.disabled = false; btn.textContent = orig; }, 2000);
    showToast('Added to cart!', 'success');
    updateCartCount();
  } else {
    showToast(res.message || 'Error adding to cart', 'error');
    btn.disabled = false; btn.textContent = orig;
  }
}

// Event listeners for filters
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  document.getElementById('search-input')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { currentPage = 1; loadProducts(); }, 500);
  });

  ['category-filter', 'sort-filter', 'price-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => { currentPage = 1; loadProducts(); });
  });
});
