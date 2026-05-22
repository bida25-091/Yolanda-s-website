const CURRENCY = { symbol: 'P', code: 'BWP', rate: 1 };

function formatPrice(amount) {
    return CURRENCY.symbol + (amount * CURRENCY.rate).toFixed(2);
}
const _memStore = {};
function _getStore() {
    try { return window['local' + 'Storage']; } catch (e) { return null; }
}
const storage = {
    get(key) {
        const s = _getStore();
        try { return s ? s.getItem(key) : (key in _memStore ? _memStore[key] : null); }
        catch (e) { return key in _memStore ? _memStore[key] : null; }
    },
    set(key, val) {
        const s = _getStore();
        try { if (s) s.setItem(key, val); else _memStore[key] = val; }
        catch (e) { _memStore[key] = val; }
    },
    remove(key) {
        const s = _getStore();
        try { if (s) s.removeItem(key); else delete _memStore[key]; }
        catch (e) { delete _memStore[key]; }
    }
};

/* ---------- Cart Storage Helpers ---------- */
const CART_KEY = 'ovo_cart';

function getCart() {
    try {
        return JSON.parse(storage.get(CART_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    storage.set(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(product, size = 'One Size', qty = 1) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id && item.size === size);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            size: size,
            qty: qty
        });
    }
    saveCart(cart);
    showToast(`Added "${product.name}" to cart`);
}

function removeFromCart(id, size) {
    const cart = getCart().filter(item => !(item.id === id && item.size === size));
    saveCart(cart);
}

function updateCartQty(id, size, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id && i.size === size);
    if (item) {
        item.qty = Math.max(1, qty);
        saveCart(cart);
    }
}

function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartSubtotal() {
    return getCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function clearCart() {
    storage.remove(CART_KEY);
    updateCartBadge();
}

/* ---------- Cart Badge ---------- */
function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = getCartCount();
    badges.forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

/* ---------- Toast ---------- */
function showToast(message, duration = 2200) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ---------- Mobile Nav Toggle ---------- */
function initNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => links.classList.toggle('open'));
    }
}

/* ---------- Slideshow ---------- */
function initSlideshow() {
    const slideshow = document.querySelector('.slideshow');
    if (!slideshow) return;

    const slides = slideshow.querySelectorAll('.slide');
    const dotsContainer = slideshow.querySelector('.slide-dots');
    const prevBtn = slideshow.querySelector('.slide-prev');
    const nextBtn = slideshow.querySelector('.slide-next');
    let current = 0;
    let timer;

    // Build dots
    if (dotsContainer) {
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => goTo(i));
            dotsContainer.appendChild(dot);
        });
    }

    function goTo(idx) {
        slides[current].classList.remove('active');
        const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
        if (dots[current]) dots[current].classList.remove('active');
        current = (idx + slides.length) % slides.length;
        slides[current].classList.add('active');
        if (dots[current]) dots[current].classList.add('active');
        resetTimer();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function resetTimer() {
        clearInterval(timer);
        timer = setInterval(next, 5000);
    }

    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    resetTimer();
}

/* ---------- Product Card Renderer (shared) ---------- */
function renderProductCard(p) {
    return `
        <div class="product-card" data-id="${p.id}">
            <a href="product.html?id=${p.id}" class="img-wrap">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='images/placeholder.jpg'">
            </a>
            <div class="info">
                <span class="cat">${p.category}</span>
                <a href="product.html?id=${p.id}" class="name">${p.name}</a>
                <span class="price">${formatPrice(p.price)}</span>
                <div class="actions">
                    <a href="product.html?id=${p.id}" class="btn btn-outline">View</a>
                    <button class="btn add-to-cart-btn" data-id="${p.id}">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
}

/* ---------- Bind quick "Add to Cart" buttons ---------- */
function bindQuickAddButtons(products) {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = parseInt(btn.dataset.id);
            const product = products.find(p => p.id === id);
            if (product) {
                const defaultSize = product.sizes && product.sizes.length ? product.sizes[0] : 'One Size';
                addToCart(product, defaultSize, 1);
            }
        });
    });
}

/* ---------- Fetch Products ---------- */
async function fetchProducts() {
    const res = await fetch('data/products.json');
    return await res.json();
}

/* ---------- Init on every page ---------- */
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    initNavToggle();
    initSlideshow();
});
