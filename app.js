// Storage Keys
const KEYS = {
  products: 'cctv_products',
  categories: 'cctv_categories',
  cart: 'cctv_cart',
  sales: 'cctv_sales'
};

// Utilities
const fmt = (n) => (Number(n || 0)).toFixed(2);
const uid = () => Math.random().toString(36).slice(2, 9);
const todayIso = () => new Date().toISOString();

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Seed Data
function seedIfEmpty() {
  let products = read(KEYS.products, []);
  let categories = read(KEYS.categories, []);
  if (products.length && categories.length) return;

  categories = [
    { id: 'cat-cctv', name: 'CCTV Cameras' },
    { id: 'cat-dvr', name: 'DVR' },
    { id: 'cat-monitors', name: 'Monitors' },
    { id: 'cat-hdmi', name: 'HDMI Cables' },
    { id: 'cat-connectors', name: 'Connectors' }
  ];

  const sample = [
    { name: 'Dome Camera 2MP', categoryId: 'cat-cctv', price: 1499.00, image: 'https://images.unsplash.com/photo-1587476482538-517f6a60f1f0?q=80&w=600' },
    { name: 'Bullet Camera 5MP', categoryId: 'cat-cctv', price: 2499.00, image: 'https://images.unsplash.com/photo-1564257631407-0e3ca97b7d2a?q=80&w=600' },
    { name: 'DVR 4-Channel', categoryId: 'cat-dvr', price: 3999.00, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600' },
    { name: 'DVR 8-Channel', categoryId: 'cat-dvr', price: 5499.00, image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=600' },
    { name: 'LED Monitor 22"', categoryId: 'cat-monitors', price: 7999.00, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600' },
    { name: 'HDMI Cable 2m', categoryId: 'cat-hdmi', price: 299.00, image: 'https://images.unsplash.com/photo-1596991924191-53debd31a8a8?q=80&w=600' },
    { name: 'BNC Connector', categoryId: 'cat-connectors', price: 49.00, image: 'https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?q=80&w=600' }
  ].map(p => ({ id: uid(), ...p }));

  write(KEYS.categories, categories);
  write(KEYS.products, sample);
  write(KEYS.cart, []);
  write(KEYS.sales, []);
}

function resetSeed() {
  localStorage.removeItem(KEYS.products);
  localStorage.removeItem(KEYS.categories);
  localStorage.removeItem(KEYS.cart);
  localStorage.removeItem(KEYS.sales);
  seedIfEmpty();
  renderAll();
}

// State
let PRODUCTS = [];
let CATEGORIES = [];
let CART = [];
let HISTORY = [];

function getCustomerFields() {
  return {
    name: (document.getElementById('bill-customer')?.value || '').trim(),
    address: (document.getElementById('bill-address')?.value || '').trim(),
    phone: (document.getElementById('bill-phone')?.value || '').trim()
  };
}

function setCustomerFields(customer) {
  const n = document.getElementById('bill-customer'); if (n) n.value = customer?.name || '';
  const a = document.getElementById('bill-address'); if (a) a.value = customer?.address || '';
  const p = document.getElementById('bill-phone'); if (p) p.value = customer?.phone || '';
}

function pushHistory() {
  const snapshot = {
    cart: JSON.parse(JSON.stringify(CART)),
    customer: getCustomerFields()
  };
  HISTORY.push(snapshot);
  if (HISTORY.length > 50) HISTORY.shift();
}

function undo() {
  const prev = HISTORY.pop();
  if (!prev) return;
  CART = prev.cart;
  write(KEYS.cart, CART);
  setCustomerFields(prev.customer);
  renderCart();
}

// Render Helpers
function byId(id) { return document.getElementById(id); }

function renderCategories() {
  const list = byId('category-list');
  list.innerHTML = '';
  const liAll = document.createElement('li');
  liAll.textContent = 'All';
  liAll.className = 'chip active';
  liAll.style.cursor = 'pointer';
  liAll.addEventListener('click', () => renderProducts(PRODUCTS));
  list.appendChild(liAll);

  CATEGORIES.forEach(cat => {
    const li = document.createElement('li');
    li.textContent = cat.name;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => renderProducts(PRODUCTS.filter(p => p.categoryId === cat.id)));
    list.appendChild(li);
  });
}

function renderProducts(items) {
  const grid = byId('product-grid');
  grid.innerHTML = '';
  const tpl = byId('tpl-product');
  items.forEach(p => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('img').src = p.image || '';
    node.querySelector('.name').textContent = p.name;
    node.querySelector('.price').textContent = '₹ ' + fmt(p.price);
    node.addEventListener('click', () => addToCart(p.id));
    grid.appendChild(node);
  });
}

function findProduct(id) { return PRODUCTS.find(p => p.id === id); }

function addToCart(productId) {
  pushHistory();
  const existing = CART.find(ci => ci.productId === productId);
  if (existing) existing.qty += 1; else CART.push({ id: uid(), productId, qty: 1 });
  write(KEYS.cart, CART);
  renderCart();
}

function updateCartQty(itemId, qty) {
  pushHistory();
  const item = CART.find(ci => ci.id === itemId);
  if (!item) return;
  const q = Math.max(1, Number(qty || 1));
  item.qty = q;
  write(KEYS.cart, CART);
  renderCart();
}

function removeCartItem(itemId) {
  pushHistory();
  CART = CART.filter(ci => ci.id !== itemId);
  write(KEYS.cart, CART);
  renderCart();
}

function clearCart() {
  pushHistory();
  CART = [];
  write(KEYS.cart, CART);
  renderCart();
  const n = document.getElementById('bill-customer'); if (n) n.value = '';
  const a = document.getElementById('bill-address'); if (a) a.value = '';
  const p = document.getElementById('bill-phone'); if (p) p.value = '';
}

function computeTotals() {
  const subtotal = CART.reduce((sum, ci) => sum + (findProduct(ci.productId)?.price || 0) * ci.qty, 0);
  const tax = 0;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function renderCart() {
  const wrap = byId('cart-items');
  wrap.innerHTML = '';
  const tpl = byId('tpl-cart-item');
  CART.forEach(ci => {
    const p = findProduct(ci.productId);
    if (!p) return;
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.ci-name').textContent = p.name;
    node.querySelector('.ci-price').textContent = '₹ ' + fmt(p.price * ci.qty);
    const qtyInput = node.querySelector('input.qty');
    qtyInput.value = String(ci.qty);
    node.querySelector('.inc').addEventListener('click', () => updateCartQty(ci.id, ci.qty + 1));
    node.querySelector('.dec').addEventListener('click', () => updateCartQty(ci.id, ci.qty - 1));
    qtyInput.addEventListener('change', (e) => updateCartQty(ci.id, Number(e.target.value)));
    node.querySelector('.remove').addEventListener('click', () => removeCartItem(ci.id));
    wrap.appendChild(node);
  });
  const { subtotal, tax, total } = computeTotals();
  byId('subtotal').textContent = fmt(subtotal);
  byId('tax').textContent = fmt(tax);
  byId('total').textContent = fmt(total);
}

// Manage Menu (CRUD)
function renderManage() {
  // Categories dropdown
  const sel = byId('product-category');
  sel.innerHTML = '';
  CATEGORIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.name; sel.appendChild(opt);
  });

  // Products table
  const tbody = byId('manage-products');
  tbody.innerHTML = '';
  PRODUCTS.forEach(p => {
    const tr = document.createElement('tr');
    const cat = CATEGORIES.find(c => c.id === p.categoryId)?.name || '-';
    tr.innerHTML = `<td>${p.name}</td><td>${cat}</td><td>₹ ${fmt(p.price)}</td><td></td>`;
    const cell = tr.lastElementChild;
    const eb = document.createElement('button'); eb.textContent = 'Edit';
    const db = document.createElement('button'); db.textContent = 'Delete'; db.style.marginLeft = '6px';
    eb.addEventListener('click', () => loadProductToForm(p.id));
    db.addEventListener('click', () => { deleteProduct(p.id); });
    cell.appendChild(eb); cell.appendChild(db);
    tbody.appendChild(tr);
  });

  // Categories list
  const ul = byId('manage-categories');
  ul.innerHTML = '';
  CATEGORIES.forEach(c => {
    const li = document.createElement('li');
    li.dataset.categoryId = c.id;
    
    const span = document.createElement('span'); 
    span.textContent = c.name;
    span.className = 'category-name';
    
    const editBtn = document.createElement('button'); 
    editBtn.textContent = '✎';
    editBtn.className = 'edit-category';
    editBtn.title = 'Edit category name';
    editBtn.addEventListener('click', () => startEditCategory(c.id));
    
    const del = document.createElement('button'); 
    del.textContent = '×';
    del.className = 'delete-category';
    del.addEventListener('click', () => deleteCategory(c.id));
    
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(del);
    ul.appendChild(li);
  });
}

function loadProductToForm(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  byId('product-id').value = p.id;
  byId('product-name').value = p.name;
  byId('product-category').value = p.categoryId;
  byId('product-price').value = p.price;
  byId('product-image').value = p.image || '';
}

function saveProduct(e) {
  e.preventDefault();
  const id = byId('product-id').value || uid();
  const data = {
    id,
    name: byId('product-name').value.trim(),
    categoryId: byId('product-category').value,
    price: Number(byId('product-price').value || 0),
    image: byId('product-image').value.trim()
  };
  const existingIdx = PRODUCTS.findIndex(p => p.id === id);
  if (existingIdx >= 0) PRODUCTS[existingIdx] = data; else PRODUCTS.push(data);
  write(KEYS.products, PRODUCTS);
  (e.target.reset?.bind(e.target))?.();
  byId('product-id').value = '';
  renderManage();
  renderCategories();
  renderProducts(PRODUCTS);
}

function deleteProduct(id) {
  PRODUCTS = PRODUCTS.filter(p => p.id !== id);
  write(KEYS.products, PRODUCTS);
  renderManage();
  renderProducts(PRODUCTS);
}

function addCategory(e) {
  e.preventDefault();
  const name = byId('category-name').value.trim();
  if (!name) return;
  CATEGORIES.push({ id: uid(), name });
  write(KEYS.categories, CATEGORIES);
  byId('category-name').value = '';
  renderManage();
  renderCategories();
}

function startEditCategory(id) {
  const category = CATEGORIES.find(c => c.id === id);
  if (!category) return;
  
  const li = document.querySelector(`[data-category-id="${id}"]`);
  if (!li) return;
  
  const span = li.querySelector('.category-name');
  if (!span) return;
  
  const currentName = category.name;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'category-edit-input';
  
  const saveBtn = document.createElement('button');
  saveBtn.textContent = '✓';
  saveBtn.className = 'save-category';
  saveBtn.title = 'Save';
  saveBtn.style.cssText = 'background: var(--success); border-color: var(--success); color: #ffffff;';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '✕';
  cancelBtn.className = 'cancel-category';
  cancelBtn.title = 'Cancel';
  cancelBtn.style.cssText = 'background: var(--muted); border-color: var(--muted); color: #ffffff;';
  
  // Replace span with input and buttons
  const editBtn = li.querySelector('.edit-category');
  const delBtn = li.querySelector('.delete-category');
  
  li.innerHTML = '';
  li.appendChild(input);
  li.appendChild(saveBtn);
  li.appendChild(cancelBtn);
  
  input.focus();
  input.select();
  
  const save = () => {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      updateCategory(id, newName);
    } else {
      renderManage();
    }
  };
  
  const cancel = () => {
    renderManage();
  };
  
  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', cancel);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  });
}

function updateCategory(id, newName) {
  if (!newName || !newName.trim()) {
    alert('Category name cannot be empty');
    return;
  }
  
  // Check if name already exists
  const existing = CATEGORIES.find(c => c.id !== id && c.name.toLowerCase() === newName.trim().toLowerCase());
  if (existing) {
    alert('A category with this name already exists');
    return;
  }
  
  const category = CATEGORIES.find(c => c.id === id);
  if (category) {
    category.name = newName.trim();
    write(KEYS.categories, CATEGORIES);
    renderManage();
    renderCategories();
  }
}

function deleteCategory(id) {
  // Prevent delete if products exist under category
  if (PRODUCTS.some(p => p.categoryId === id)) { alert('Remove or move products in this category first.'); return; }
  CATEGORIES = CATEGORIES.filter(c => c.id !== id);
  write(KEYS.categories, CATEGORIES);
  renderManage();
  renderCategories();
}

// QR Pay
function openQrModal() {
  const { total } = computeTotals();
  byId('qr-amount').value = fmt(total);
  byId('qr-amount-label').textContent = '₹ ' + fmt(total);
  byId('qr-image').src = '';
  byId('qr-modal').classList.remove('hidden');
}
function closeQrModal() {
  byId('qr-modal').classList.add('hidden');
}
function generateQr() {
  const amount = Number(byId('qr-amount').value || 0);
  const note = encodeURIComponent(byId('qr-note').value || 'Invoice');
  const target = byId('qr-target').value.trim();
  const data = target || `upi://pay?pa=your@upi&pn=SM%20Systems%20and%20Services%20(Kottaram)&am=${amount}&tn=${note}`;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(data)}`;
  byId('qr-image').src = url;
  byId('qr-amount-label').textContent = '₹ ' + fmt(amount);
}

// Sales
function createOrderFromCart(status) {
  const items = CART.map(ci => {
    const p = findProduct(ci.productId);
    return { productId: ci.productId, name: p?.name || '', price: p?.price || 0, qty: ci.qty };
  });
  const totals = computeTotals();
  const customer = {
    name: (document.getElementById('bill-customer')?.value || '').trim(),
    address: (document.getElementById('bill-address')?.value || '').trim(),
    phone: (document.getElementById('bill-phone')?.value || '').trim()
  };
  return { id: 'ORD-' + uid().toUpperCase(), createdAt: todayIso(), items, totals, status, customer };
}

function markPaid() {
  if (!CART.length) { alert('Cart is empty'); return; }
  const order = createOrderFromCart('PAID');
  const sales = read(KEYS.sales, []);
  sales.push(order);
  write(KEYS.sales, sales);
  clearCart();
  closeQrModal();
  alert('Payment recorded.');
}

// Print Bill
function printBill() {
  const win = window.open('', '_blank');
  const order = createOrderFromCart('DRAFT');
  const rows = order.items.map(it => `<tr><td>${it.name}</td><td>${it.qty}</td><td>₹ ${fmt(it.price)}</td><td>₹ ${fmt(it.qty * it.price)}</td></tr>`).join('');
  win.document.write(`<!doctype html><html><head><title>Invoice ${order.id}</title>
  <style>body{font-family:Segoe UI,Arial;margin:24px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:8px;text-align:left} tfoot td{text-align:right;font-weight:700}</style>
  </head><body>
  <h2>SM SYSTEMS (SALES & SERVICES) (Kottaram)</h2>
  <div>Contact: 9486171929, 7598194206</div>
  <div style="margin-top:8px;margin-bottom:8px;"><strong>Invoice To:</strong> ${order.customer?.name || ''}</div>
  <div>${(order.customer?.address || '').replaceAll('\n','<br>')}</div>
  <div>${order.customer?.phone || ''}</div>
  <div>Invoice: ${order.id}</div>
  <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
  <hr>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td colspan="3">Subtotal</td><td>₹ ${fmt(order.totals.subtotal)}</td></tr>
  <tr><td colspan="3">Tax</td><td>₹ ${fmt(order.totals.tax)}</td></tr>
  <tr><td colspan="3">Total</td><td>₹ ${fmt(order.totals.total)}</td></tr></tfoot></table>
  <p>Thank you for your purchase!</p>
  <script>window.print();</script>
  </body></html>`);
  win.document.close();
}

// Report
function refreshReport() {
  const monthInput = byId('report-month').value; // yyyy-MM
  const sales = read(KEYS.sales, []);
  const tbody = byId('report-tbody');
  tbody.innerHTML = '';
  const filtered = monthInput ? sales.filter(s => s.createdAt.startsWith(monthInput)) : sales;
  let total = 0;
  filtered.forEach(s => {
    total += s.totals.total;
    const tr = document.createElement('tr');
    const itemsStr = s.items.map(i => `${i.name} ×${i.qty}`).join(', ');
    tr.innerHTML = `<td>${new Date(s.createdAt).toLocaleDateString()}</td><td>${s.id}</td><td>${itemsStr}</td><td>₹ ${fmt(s.totals.total)}</td>`;
    tbody.appendChild(tr);
  });
  byId('report-total').textContent = '₹ ' + fmt(total);
}

function printReport() {
  window.print();
}

// Search
function setupSearch() {
  const input = byId('search');
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    renderProducts(PRODUCTS.filter(p => p.name.toLowerCase().includes(q)));
  });
}

// Render All
function renderAll() {
  PRODUCTS = read(KEYS.products, []);
  CATEGORIES = read(KEYS.categories, []);
  CART = read(KEYS.cart, []);
  renderCategories();
  renderProducts(PRODUCTS);
  renderCart();
  renderManage();
  refreshReport();
}

// Event Bindings
function bindEvents() {
  byId('btnClearCart').addEventListener('click', clearCart);
  byId('btnPrint').addEventListener('click', printBill);
  byId('btnPayNow').addEventListener('click', openQrModal);
  if (byId('resetSeed')) byId('resetSeed').addEventListener('click', resetSeed);
  byId('btnUndo').addEventListener('click', undo);

  byId('qr-close').addEventListener('click', closeQrModal);
  byId('qr-generate').addEventListener('click', generateQr);
  byId('qr-mark-paid').addEventListener('click', markPaid);
  byId('qr-print').addEventListener('click', printBill);

  byId('product-form').addEventListener('submit', saveProduct);
  byId('btnResetForm').addEventListener('click', () => {
    byId('product-id').value = '';
    byId('product-form').reset();
  });
  byId('category-form').addEventListener('submit', addCategory);

  byId('btnRefreshReport').addEventListener('click', refreshReport);
  byId('btnPrintReport').addEventListener('click', printReport);
  byId('report-month').value = new Date().toISOString().slice(0, 7);

  setupSearch();
}

// Init
seedIfEmpty();
bindEvents();
renderAll();


