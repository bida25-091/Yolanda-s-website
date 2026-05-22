/* ==========================================================
   OVO Store — Checkout (card validation + order saving)
   ========================================================== */

/* ---------- Card Number Formatting ---------- */
const cardNumberInput = document.getElementById('ck-number');
const cardExpiryInput = document.getElementById('ck-expiry');
const cardCvvInput = document.getElementById('ck-cvv');
const cardNameInput = document.getElementById('ck-name');

const cpNumber = document.getElementById('cp-number');
const cpName = document.getElementById('cp-name');
const cpExpiry = document.getElementById('cp-expiry');

cardNumberInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    cpNumber.textContent = (e.target.value + ' •••• •••• •••• ••••').slice(0, 19);
});

cardExpiryInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
    cpExpiry.textContent = v || 'MM/YY';
});

cardCvvInput.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

cardNameInput.addEventListener('input', e => {
    cpName.textContent = (e.target.value || 'FULL NAME').toUpperCase();
});

/* ---------- Luhn Algorithm ---------- */
function luhnCheck(num) {
    const digits = num.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0, alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let d = parseInt(digits[i], 10);
        if (alt) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        sum += d;
        alt = !alt;
    }
    return sum % 10 === 0;
}

/* ---------- Validation ---------- */
function setError(input, msg) {
    const errEl = input.parentElement.querySelector('.error-text');
    errEl.textContent = msg;
    if (msg) input.classList.add('invalid'); else input.classList.remove('invalid');
}

function validateCheckout() {
    let valid = true;
    const fields = [
        { el: cardNameInput, test: v => v.trim().length >= 2, msg: 'Enter the cardholder name.' },
        { el: cardNumberInput, test: v => luhnCheck(v), msg: 'Invalid card number.' },
        { el: cardExpiryInput, test: v => {
            const m = v.match(/^(\d{2})\/(\d{2})$/);
            if (!m) return false;
            const month = parseInt(m[1]), year = 2000 + parseInt(m[2]);
            if (month < 1 || month > 12) return false;
            const now = new Date();
            const exp = new Date(year, month, 0, 23, 59, 59);
            return exp >= now;
        }, msg: 'Invalid or expired date.' },
        { el: cardCvvInput, test: v => /^\d{3,4}$/.test(v), msg: 'CVV must be 3–4 digits.' },
        { el: document.getElementById('ck-email'), test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Enter a valid email.' },
        { el: document.getElementById('ck-address'), test: v => v.trim().length >= 5, msg: 'Enter a shipping address.' }
    ];

    fields.forEach(f => {
        if (!f.test(f.el.value)) {
            setError(f.el, f.msg);
            valid = false;
        } else {
            setError(f.el, '');
        }
    });

    return valid;
}

/* ---------- Save Order ---------- */
function saveOrder(orderData) {
    // Append to storage "orders" array (acts as our pseudo-file).
    // Uses the storage helper from main.js (localStorage with in-memory fallback).
    const orders = JSON.parse(storage.get('ovo_orders') || '[]');
    orders.push(orderData);
    storage.set('ovo_orders', JSON.stringify(orders));
}

function downloadOrderFile(orderData) {
    const blob = new Blob([JSON.stringify(orderData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OVO-Order-${orderData.orderRef}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ---------- Submit ---------- */
let lastOrder = null;

document.getElementById('checkout-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateCheckout()) {
        showToast('Please fix the errors in the form.');
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        showToast('Your cart is empty.');
        return;
    }

    const totals = calculateTotals();
    const cardNum = cardNumberInput.value.replace(/\s/g, '');
    const masked = '**** **** **** ' + cardNum.slice(-4);

    const orderRef = 'OVO-' + Date.now().toString(36).toUpperCase();

    const orderData = {
        orderRef,
        timestamp: new Date().toISOString(),
        customer: {
            name: cardNameInput.value.trim(),
            email: document.getElementById('ck-email').value.trim(),
            address: document.getElementById('ck-address').value.trim()
        },
        payment: {
            cardHolder: cardNameInput.value.trim(),
            cardNumberMasked: masked,
            cardNumberFull: cardNum,   // stored as requested (demo only)
            expiry: cardExpiryInput.value,
            cvv: cardCvvInput.value
        },
        items: cart,
        promo: appliedPromo ? appliedPromo.code : null,
        currency: CURRENCY.code,
        totals: {
            subtotal: +totals.subtotal.toFixed(2),
            discount: +totals.discount.toFixed(2),
            shipping: +totals.shipping.toFixed(2),
            tax: +totals.tax.toFixed(2),
            total: +totals.total.toFixed(2)
        }
    };

    saveOrder(orderData);
    lastOrder = orderData;

    // Clear cart + show confirmation
    clearCart();
    appliedPromo = null;
    document.getElementById('checkout-form').reset();
    cpNumber.textContent = '•••• •••• •••• ••••';
    cpName.textContent = 'FULL NAME';
    cpExpiry.textContent = 'MM/YY';

    document.getElementById('order-ref').textContent = orderRef;
    document.getElementById('order-success').style.display = 'block';
    document.getElementById('order-success').scrollIntoView({ behavior: 'smooth' });
    showToast('Order placed successfully.');

    // Hide cart layout (it's now empty)
    setTimeout(renderCart, 600);
});

document.getElementById('download-receipt').addEventListener('click', () => {
    if (lastOrder) downloadOrderFile(lastOrder);
});
