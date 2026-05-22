/* ==========================================================
   OVO Store — Product Detail Page
   ========================================================== */

(async function () {
    const products = await fetchProducts();
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    const product = products.find(p => p.id === id);
    const container = document.getElementById('product-container');

    if (!product) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px;">
                <h2>Product Not Found</h2>
                <p style="color:var(--ink-soft); margin:12px 0 24px;">We couldn't find that product.</p>
                <a href="shop.html" class="btn">Back to Shop</a>
            </div>`;
        return;
    }

    document.title = `${product.name} — OVO Store`;

    let selectedSize = product.sizes[0];
    let qty = 1;

    container.innerHTML = `
        <div class="product-detail">
            <div class="pd-img">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="pd-info">
                <p class="pd-cat">${product.category}</p>
                <h1>${product.name}</h1>
                <p class="pd-price">${formatPrice(product.price)}</p>
                <p class="pd-desc">${product.description}</p>

                <span class="label">Size</span>
                <div class="size-selector" id="size-selector">
                    ${product.sizes.map((s, i) => `
                        <button class="size-btn ${i === 0 ? 'active' : ''}" data-size="${s}">${s}</button>
                    `).join('')}
                </div>

                <span class="label">Quantity</span>
                <div class="qty-row">
                    <div class="qty-control">
                        <button id="qty-minus">−</button>
                        <span id="qty-display">1</span>
                        <button id="qty-plus">+</button>
                    </div>
                    <span style="font-size:13px; color:var(--ink-soft);">${product.stock} in stock</span>
                </div>

                <div style="display:flex; gap:12px;">
                    <button class="btn btn-block" id="add-btn">Add to Cart</button>
                    <a href="cart.html" class="btn btn-outline btn-block" style="text-align:center;">View Cart</a>
                </div>
            </div>
        </div>
    `;

    // Size selection
    document.getElementById('size-selector').addEventListener('click', e => {
        if (e.target.classList.contains('size-btn')) {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedSize = e.target.dataset.size;
        }
    });

    // Qty
    const qtyDisplay = document.getElementById('qty-display');
    document.getElementById('qty-minus').addEventListener('click', () => {
        qty = Math.max(1, qty - 1);
        qtyDisplay.textContent = qty;
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
        qty = Math.min(product.stock, qty + 1);
        qtyDisplay.textContent = qty;
    });

    // Add to cart
    document.getElementById('add-btn').addEventListener('click', () => {
        addToCart(product, selectedSize, qty);
    });

    // Related products
    const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    document.getElementById('related-grid').innerHTML = related.map(renderProductCard).join('');
    bindQuickAddButtons(products);
})();
