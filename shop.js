/* ==========================================================
   OVO Store — Shop Page
   ========================================================== */

(async function () {
    const allProducts = await fetchProducts();
    const grid = document.getElementById('shop-grid');
    const countEl = document.getElementById('result-count');
    const catList = document.getElementById('cat-filters');
    const sortSel = document.getElementById('sort-select');
    const priceRange = document.getElementById('price-range');
    const priceVal = document.getElementById('price-val');
    const priceSymbol = document.getElementById('price-symbol');
    if (priceSymbol) priceSymbol.textContent = CURRENCY.symbol;

    // Read ?category= param
    const params = new URLSearchParams(window.location.search);
    let activeCategory = params.get('category') || 'All';
    let maxPrice = parseFloat(priceRange.value);

    // Build category buttons
    const categories = ['All', ...new Set(allProducts.map(p => p.category))];
    catList.innerHTML = categories.map(cat => `
        <li><button data-cat="${cat}" class="${cat === activeCategory ? 'active' : ''}">${cat}</button></li>
    `).join('');

    catList.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            activeCategory = e.target.dataset.cat;
            catList.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.cat === activeCategory));
            render();
        }
    });

    sortSel.addEventListener('change', render);

    priceRange.addEventListener('input', () => {
        maxPrice = parseFloat(priceRange.value);
        priceVal.textContent = priceRange.value;
        render();
    });

    function render() {
        let filtered = allProducts.slice();
        if (activeCategory !== 'All') {
            filtered = filtered.filter(p => p.category === activeCategory);
        }
        filtered = filtered.filter(p => p.price <= maxPrice);

        switch (sortSel.value) {
            case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
            case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
            case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
        }

        countEl.textContent = `${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
        if (filtered.length === 0) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px; color:var(--ink-soft);">No products match your filters.</p>';
        } else {
            grid.innerHTML = filtered.map(renderProductCard).join('');
            bindQuickAddButtons(allProducts);
        }
    }

    render();
})();
