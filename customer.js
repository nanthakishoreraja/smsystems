// Storage Keys
const KEYS = {
  products: 'cctv_products',
  categories: 'cctv_categories'
};

// Utilities
const fmt = (n) => (Number(n || 0)).toFixed(2);

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
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
    // Cameras
    { name: 'Dome Camera 2MP', categoryId: 'cat-cctv', price: 1499.00, image: 'images/dome-camera-2mp.jpg' },
    { name: 'Bullet Camera 5MP', categoryId: 'cat-cctv', price: 2499.00, image: 'images/bullet-camera-5mp.jpg' },
    { name: 'PTZ Camera 2MP', categoryId: 'cat-cctv', price: 8999.00, image: 'images/ptz-camera-2mp.jpg' },
    { name: 'IP Camera 4MP', categoryId: 'cat-cctv', price: 3299.00, image: 'images/ip-camera-4mp.jpg' },
    { name: 'Wireless Camera 1080p', categoryId: 'cat-cctv', price: 2799.00, image: 'images/wireless-camera-1080p.jpg' },
    { name: 'Indoor Dome 4MP', categoryId: 'cat-cctv', price: 1899.00, image: 'images/indoor-dome-4mp.jpg' },
    { name: 'Outdoor Bullet 8MP', categoryId: 'cat-cctv', price: 4499.00, image: 'images/outdoor-bullet-8mp.jpg' },
    { name: 'C-Mount Camera', categoryId: 'cat-cctv', price: 3999.00, image: 'images/c-mount-camera.jpg' },
    { name: 'Night Vision Camera', categoryId: 'cat-cctv', price: 3599.00, image: 'images/night-vision-camera.jpg' },
    // DVR / NVR
    { name: 'DVR 4-Channel', categoryId: 'cat-dvr', price: 3999.00, image: 'images/dvr-4-channel.jpg' },
    { name: 'DVR 8-Channel', categoryId: 'cat-dvr', price: 5499.00, image: 'images/dvr-8-channel.jpg' },
    { name: 'DVR 16-Channel', categoryId: 'cat-dvr', price: 8999.00, image: 'images/dvr-16-channel.jpg' },
    { name: 'DVR 32-Channel', categoryId: 'cat-dvr', price: 14999.00, image: 'images/dvr-32-channel.jpg' },
    { name: 'NVR 4-Channel PoE', categoryId: 'cat-dvr', price: 6499.00, image: 'images/nvr-4-channel-poe.jpg' },
    { name: 'NVR 8-Channel PoE', categoryId: 'cat-dvr', price: 9999.00, image: 'images/nvr-8-channel-poe.jpg' },
    // Monitors & accessories
    { name: 'LED Monitor 22"', categoryId: 'cat-monitors', price: 7999.00, image: 'images/led-monitor-22.jpg' },
    { name: 'HDMI Cable 2m', categoryId: 'cat-hdmi', price: 299.00, image: 'images/hdmi-cable-2m.jpg' },
    { name: 'BNC Connector', categoryId: 'cat-connectors', price: 49.00, image: 'images/bnc-connector.jpg' }
  ].map(p => ({ id: Math.random().toString(36).slice(2, 9), ...p }));

  localStorage.setItem(KEYS.categories, JSON.stringify(categories));
  localStorage.setItem(KEYS.products, JSON.stringify(sample));
}

// State
let PRODUCTS = [];
let CATEGORIES = [];

// Render Helpers
function byId(id) { return document.getElementById(id); }

// Category icons mapping
const categoryIcons = {
  'cat-cctv': '📹',
  'cat-dvr': '💿',
  'cat-monitors': '🖥️',
  'cat-hdmi': '🔌',
  'cat-connectors': '🔗',
  'all': '📦'
};

function renderCategories() {
  const list = byId('category-list');
  list.innerHTML = '';
  
  // Count products per category
  const categoryCounts = {};
  CATEGORIES.forEach(cat => {
    categoryCounts[cat.id] = PRODUCTS.filter(p => p.categoryId === cat.id).length;
  });
  
  // All Products category
  const liAll = document.createElement('li');
  liAll.className = 'active';
  
  const iconAll = document.createElement('span');
  iconAll.className = 'category-icon';
  iconAll.textContent = categoryIcons.all || '📦';
  
  const textAll = document.createElement('span');
  textAll.textContent = 'All Products';
  
  const badgeAll = document.createElement('span');
  badgeAll.className = 'category-badge';
  badgeAll.textContent = PRODUCTS.length;
  
  liAll.appendChild(iconAll);
  liAll.appendChild(textAll);
  liAll.appendChild(badgeAll);
  
  liAll.addEventListener('click', () => {
    document.querySelectorAll('#category-list li').forEach(item => item.classList.remove('active'));
    liAll.classList.add('active');
    renderProducts(PRODUCTS);
  });
  
  list.appendChild(liAll);

  CATEGORIES.forEach(cat => {
    const li = document.createElement('li');
    
    const icon = document.createElement('span');
    icon.className = 'category-icon';
    icon.textContent = categoryIcons[cat.id] || '📋';
    
    const text = document.createElement('span');
    text.textContent = cat.name;
    
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = categoryCounts[cat.id] || 0;
    
    li.appendChild(icon);
    li.appendChild(text);
    li.appendChild(badge);
    
    li.addEventListener('click', () => {
      document.querySelectorAll('#category-list li').forEach(item => item.classList.remove('active'));
      li.classList.add('active');
      renderProducts(PRODUCTS.filter(p => p.categoryId === cat.id));
    });
    
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
    // Remove click handler - customers can't add to cart
    node.style.cursor = 'default'; // Make it clear products are not clickable
    grid.appendChild(node);
  });
}

// Search
function setupSearch() {
  const input = byId('search');
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    if (q.trim() === '') {
      // Reset to active category when search is cleared
      const activeLi = document.querySelector('#category-list li.active');
      if (activeLi) {
        const activeText = activeLi.querySelector('span:not(.category-icon):not(.category-badge)')?.textContent;
        if (activeText === 'All Products') {
          renderProducts(PRODUCTS);
        } else {
          const activeCategory = CATEGORIES.find(cat => cat.name === activeText);
          if (activeCategory) {
            renderProducts(PRODUCTS.filter(p => p.categoryId === activeCategory.id));
          }
        }
      } else {
        renderProducts(PRODUCTS);
      }
    } else {
      renderProducts(PRODUCTS.filter(p => p.name.toLowerCase().includes(q)));
    }
  });
}

// Render All
function renderAll() {
  PRODUCTS = read(KEYS.products, []);
  CATEGORIES = read(KEYS.categories, []);
  renderCategories();
  renderProducts(PRODUCTS);
}

// Init
seedIfEmpty();
setupSearch();
renderAll();

