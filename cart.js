/* ==========================================================
   OVO Store — Cart Page (advanced)
   ========================================================== */

// Cart settings (in the base currency defined by CURRENCY in main.js)
const SHIPPING_FLAT = 75.00;        // ~P75 standard shipping fee
const FREE_SHIP_THRESHOLD = 1000;   // Free shipping over P1000
const TAX_RATE = 0.14;              // 14% VAT (Botswana standard rate)

const PROMOS = {
    'OVO10': { type: 'percent', value: 10, label: '10% off' },
    'OVO20': { type: 'percent', value: 20, label: '20% off' },
    'FREESHIP': { type: 'shipping', value: 0, label: 'Free shipping' },
    'WELCOME': { type: 'flat', value: 150, label: 'P150 off' }
};

let appliedPromo = null;

function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cart-content');
    const checkoutSection = document.getElementById('checkout-section');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything yet.</p>
                <a href="shop.html" class="btn">Browse the Shop</a>
            </div>`;
        checkoutSection.style.display = 'none';
        return;
    }

    container.innerHTML = `
        <div class="cart-layout">
            <div class="cart-items" id="cart-items"></div>
            <div class="cart-summary" id="cart-summary"></div>
        </div>
    `;

    renderItems();
    renderSummary();
    checkoutSection.style.display = 'block';
}

function renderItems() {
    const cart = getCart();
    const wrap = document.getElementById('cart-items');
    wrap.innerHTML = cart.map(item => `
        <div class="cart-row" data-id="${item.id}" data-size="${item.size}">
            <div class="ci-img">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="ci-info">
                <div class="ci-name">${item.name}</div>
                <div class="ci-meta">${item.category} · Size: ${item.size}</div>
                <div class="ci-meta">${formatPrice(item.price)} each</div>
            </div>
            <div class="qty-control">
                <button class="qty-dec">−</button>
                <span>${item.qty}</span>
                <button class="qty-inc">+</button>
            </div>
            <div class="ci-price">${formatPrice(item.price * item.qty)}</div>
            <button class="remove-btn" title="Remove">&times;</button>
        </div>
    `).join('');

    wrap.querySelectorAll('.cart-row').forEach(row => {
        const id = parseInt(row.dataset.id);
        const size = row.dataset.size;
        const item = getCart().find(i => i.id === id && i.size === size);
        row.querySelector('.qty-inc').addEventListener('click', () => {
            updateCartQty(id, size, item.qty + 1);
            renderItems();
            renderSummary();
        });
        row.querySelector('.qty-dec').addEventListener('click', () => {
            if (item.qty > 1) {
                updateCartQty(id, size, item.qty - 1);
                renderItems();
                renderSummary();
            }
        });
        row.querySelector('.remove-btn').addEventListener('click', () => {
            if (confirm('Remove this item from your cart?')) {
                removeFromCart(id, size);
                renderCart();
            }
        });
    });
}

function calculateTotals() {
    const subtotal = getCartSubtotal();
    let discount = 0;
    let shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FLAT;

    if (appliedPromo) {
        if (appliedPromo.type === 'percent') {
            discount = subtotal * (appliedPromo.value / 100);
        } else if (appliedPromo.type === 'flat') {
            discount = Math.min(appliedPromo.value, subtotal);
        } else if (appliedPromo.type === 'shipping') {
            shipping = 0;
        }
    }

    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * TAX_RATE;
    const total = taxable + shipping + tax;

    return { subtotal, discount, shipping, tax, total };
}

function renderSummary() {
    const wrap = document.getElementById('cart-summary');
    const t = calculateTotals();

    wrap.innerHTML = `
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(t.subtotal)}</span></div>
        ${t.discount > 0 ? `<div class="summary-row" style="color:var(--success);"><span>Discount (${appliedPromo.label})</span><span>−${formatPrice(t.discount)}</span></div>` : ''}
        <div class="summary-row"><span>Shipping</span><span>${t.shipping === 0 ? 'FREE' : formatPrice(t.shipping)}</span></div>
        <div class="summary-row"><span>Tax (5%)</span><span>${formatPrice(t.tax)}</span></div>

        <div class="promo-row">
            <input type="text" id="promo-input" placeholder="Promo code" value="${appliedPromo ? appliedPromo.code : ''}">
            <button id="apply-promo">Apply</button>
        </div>
        <div class="promo-msg" id="promo-msg"></div>

        <div class="summary-row total"><span>Total</span><span>${formatPrice(t.total)}</span></div>

        <button class="btn btn-block" id="goto-checkout" style="margin-top:14px;">Proceed to Checkout</button>
        <button class="btn btn-outline btn-block" id="clear-cart-btn" style="margin-top:8px;">Clear Cart</button>

        ${t.subtotal < FREE_SHIP_THRESHOLD && !appliedPromo ?
            `<p style="font-size:12px; color:var(--ink-soft); margin-top:12px; text-align:center;">Add ${formatPrice(FREE_SHIP_THRESHOLD - t.subtotal)} more for free shipping.</p>` : ''}
    `;

    document.getElementById('apply-promo').addEventListener('click', applyPromo);
    document.getElementById('promo-input').addEventListener('keypress', e => {
        if (e.key === 'Enter') { e.preventDefault(); applyPromo(); }
    });
    document.getElementById('goto-checkout').addEventListener('click', () => {
        document.getElementById('checkout-section').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('clear-cart-btn').addEventListener('click', () => {
        if (confirm('Clear all items from your cart?')) {
            clearCart();
            appliedPromo = null;
            renderCart();
        }
    });
}

function applyPromo() {
    const input = document.getElementById('promo-input');
    const msg = document.getElementById('promo-msg');
    const code = input.value.trim().toUpperCase();

    if (!code) {
        appliedPromo = null;
        msg.textContent = 'Promo cleared.';
        msg.className = 'promo-msg';
        renderSummary();
        return;
    }

    if (PROMOS[code]) {
        appliedPromo = { ...PROMOS[code], code };
        msg.textContent = `✓ "${code}" applied — ${PROMOS[code].label}.`;
        msg.className = 'promo-msg success';
    } else {
        appliedPromo = null;
        msg.textContent = 'Invalid promo code. Try OVO10, OVO20, FREESHIP, or WELCOME.';
        msg.className = 'promo-msg error';
    }
    renderSummary();
}

document.addEventListener('DOMContentLoaded', renderCart);
