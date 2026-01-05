const app = {
    data: {
        products: [],
        cart: [],
        orders: [],
        currentFilter: 'all'
    },

    init: function() {
        // Load Data
        const storedProducts = localStorage.getItem('grillaway_products');
        if (storedProducts) {
            this.data.products = JSON.parse(storedProducts);
        } else {
            this.seedData();
        }

        const storedCart = localStorage.getItem('grillaway_cart');
        if (storedCart) this.data.cart = JSON.parse(storedCart);

        const storedOrders = localStorage.getItem('grillaway_orders');
        if (storedOrders) this.data.orders = JSON.parse(storedOrders);

        this.renderProducts();
        this.renderCart();
        this.renderAdminTable();
        document.getElementById('rent-date').valueAsDate = new Date();
    },

    seedData: function() {
        // Data Awal
        this.data.products = [
            { id: 1, name: "Paket Grill Anak Kost", category: "meat", price: 120000, desc: "500gr chicken slice, saus BBQ 100 ml, 1 paket alat BBQ." },
            { id: 2, name: "Paket Hemat Grill", category: "meat", price: 170000, desc: "400gr beef shortplate, saus BBQ 100 ml, 1 paket alat BBQ." },
            { id: 3, name: "Paket All in One", category: "meat", price: 250000, desc: "400gr beef short plate, 400gr chicken slice, saus BBQ 300 ml, bombai + selada, 1 paket alat." },
            { id: 4, name: "Paket Grill Gear", category: "tool", price: 65000, desc: "Kompor, gas, fan grill, capit, brush, sumpit 2, tikar." },
            { id: 5, name: "Bakso 350 gr", category: "addon", price: 20000, desc: "Bakso siap grill." },
        ];
        this.saveProducts();
    },

    saveProducts: function() {
        localStorage.setItem('grillaway_products', JSON.stringify(this.data.products));
        this.renderProducts();
        this.renderAdminTable();
    },

    saveCart: function() {
        localStorage.setItem('grillaway_cart', JSON.stringify(this.data.cart));
        this.renderCart();
    },

    // --- NAVIGATION & UI ---
    showPage: function(pageId) {
        document.querySelectorAll('main').forEach(el => el.classList.add('hidden'));
        document.getElementById('page-' + pageId).classList.remove('hidden');
        window.scrollTo(0,0);
    },

    formatRupiah: function(num) {
        return 'Rp ' + num.toLocaleString('id-ID');
    },

    showToast: function(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    // --- PRODUCTS ---
    filterProducts: function(category) {
        this.data.currentFilter = category;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        this.renderProducts();
    },

    renderProducts: function() {
        const container = document.getElementById('product-list');
        container.innerHTML = '';
        const filtered = this.data.currentFilter === 'all' 
            ? this.data.products 
            : this.data.products.filter(p => p.category === this.data.currentFilter);

        filtered.forEach(p => {
            const imgUrl = `https://picsum.photos/seed/bbq${p.id}/400/300`;
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${imgUrl}" alt="${p.name}" class="product-img">
                <div class="product-info">
                    <div class="product-meta">${p.category === 'meat' ? 'Paket Lengkap' : (p.category === 'tool' ? 'Sewa Alat' : 'Tambahan')}</div>
                    <h3 class="product-title">${p.name}</h3>
                    <p class="product-desc">${p.desc}</p>
                    <div class="product-price">${this.formatRupiah(p.price)}</div>
                    <button class="btn btn-outline btn-block" onclick="app.addToCart(${p.id})">
                        <i class="fa-solid fa-plus"></i> Tambah
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // --- CART ---
    addToCart: function(id) {
        const existing = this.data.cart.find(item => item.id === id);
        if (existing) existing.qty++;
        else this.data.cart.push({ id: id, qty: 1 });
        this.saveCart();
        this.showToast('Produk ditambahkan ke keranjang!', 'success');
        this.openCart();
    },

    updateCartQty: function(id, delta) {
        const item = this.data.cart.find(i => i.id === id);
        if (item) {
            item.qty += delta;
            if (item.qty <= 0) this.removeFromCart(id);
            else this.saveCart();
        }
        this.updateCheckoutSummary();
    },

    removeFromCart: function(id) {
        this.data.cart = this.data.cart.filter(item => item.id !== id);
        this.saveCart();
        this.updateCheckoutSummary();
    },

    renderCart: function() {
        const container = document.getElementById('cart-items-container');
        const countBadge = document.getElementById('cart-count');
        const totalEl = document.getElementById('cart-total-price');
        container.innerHTML = '';
        let total = 0;
        let count = 0;

        if (this.data.cart.length === 0) {
            container.innerHTML = '<p class="text-center text-muted" style="margin-top: 50px;">Keranjang masih kosong.</p>';
        } else {
            this.data.cart.forEach(item => {
                const product = this.data.products.find(p => p.id === item.id);
                if (!product) return;
                total += product.price * item.qty;
                count += item.qty;
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${product.name}</h4>
                        <p>${this.formatRupiah(product.price)} x ${item.qty}</p>
                    </div>
                    <div class="cart-controls">
                        <button class="btn-sm btn-secondary" onclick="app.updateCartQty(${item.id}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="btn-sm btn-secondary" onclick="app.updateCartQty(${item.id}, 1)">+</button>
                    </div>
                `;
                container.appendChild(div);
            });
        }
        countBadge.innerText = count;
        totalEl.innerText = this.formatRupiah(total);
        this.updateCheckoutSummary();
    },

    toggleCart: function() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('overlay');
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        } else {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        }
    },

    openCart: function() {
        document.getElementById('cart-sidebar').classList.add('open');
        document.getElementById('overlay').classList.add('active');
    },

    // --- CHECKOUT ---
    selectOption: function(group, value, element) {
        const parent = element.parentElement;
        parent.querySelectorAll('.radio-option').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');

        if(group === 'delivery') {
            document.getElementById('input-delivery').value = value;
            const shippingEl = document.getElementById('summary-shipping');
            const costBox = document.getElementById('shipping-cost-box');
            
            if (value === 'offline') {
                shippingEl.innerText = 'Rp 0';
                costBox.classList.add('hidden');
            } else if (value === 'internal') {
                shippingEl.innerText = 'Rp 20.000';
                costBox.classList.add('hidden');
            } else {
                shippingEl.innerText = 'Estimasi Rp 15rb-25rb';
                costBox.classList.remove('hidden');
            }
            this.updateCheckoutSummary();
        }
        if(group === 'payment') {
            document.getElementById('input-payment').value = value;
        }
    },

    updateCheckoutSummary: function() {
        const container = document.getElementById('checkout-items');
        container.innerHTML = '';
        this.data.cart.forEach(item => {
            const p = this.data.products.find(x => x.id === item.id);
            if(!p) return;
            const div = document.createElement('div');
            div.className = 'flex justify-between';
            div.style.marginBottom = '5px';
            div.innerHTML = `<span>${p.name} (x${item.qty})</span> <span>${this.formatRupiah(p.price * item.qty)}</span>`;
            container.appendChild(div);
        });

        const subtotal = this.getCartTotal();
        document.getElementById('summary-subtotal').innerText = this.formatRupiah(subtotal);
        
        const deliveryType = document.getElementById('input-delivery').value;
        let shippingCost = 0;
        if (deliveryType === 'internal') shippingCost = 20000;
        
        document.getElementById('summary-total').innerText = this.formatRupiah(subtotal + shippingCost);
    },

    goToCheckout: function() {
        if (this.data.cart.length === 0) return this.showToast('Keranjang kosong!', 'warning');
        this.toggleCart();
        this.showPage('checkout');
        if(!document.getElementById('input-delivery').value) document.querySelector('.radio-option').click();
        this.updateCheckoutSummary();
    },

    processPayment: function() {
        const delivery = document.getElementById('input-delivery').value;
        const address = document.getElementById('input-address').value;
        if(!delivery || !address) return alert("Lengkapi data pengiriman.");

        const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
        this.data.orders.push({
            id: orderId,
            items: [...this.data.cart],
            total: this.getCartTotal(),
            status: 'Diproses'
        });

        localStorage.setItem('grillaway_orders', JSON.stringify(this.data.orders));
        this.data.cart = [];
        this.saveCart();
        this.toggleCart();

        alert(`Terima Kasih! Pesanan Anda ${orderId} berhasil.`);
        this.showPage('tracking');
        document.getElementById('track-id').value = orderId;
        this.trackOrder();
    },

    getCartTotal: function() {
        let total = 0;
        this.data.cart.forEach(item => {
            const p = this.data.products.find(x => x.id === item.id);
            if(p) total += p.price * item.qty;
        });
        return total;
    },

    // --- TRACKING ---
    trackOrder: function() {
        const id = document.getElementById('track-id').value.trim();
        const order = this.data.orders.find(o => o.id === id);
        const resultBox = document.getElementById('tracking-result');

        if (order) {
            resultBox.classList.remove('hidden');
            document.getElementById('track-order-id').innerText = `Order ID: ${order.id} (${order.status})`;
        } else {
            resultBox.classList.add('hidden');
            this.showToast('Pesanan tidak ditemukan', 'warning');
        }
    },

    // --- ADMIN ---
    renderAdminTable: function() {
        const tbody = document.getElementById('admin-product-list');
        tbody.innerHTML = '';
        this.data.products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.category}</td>
                <td>${this.formatRupiah(p.price)}</td>
                <td>
                    <button class="btn-sm btn-primary" onclick="app.editProduct(${p.id})">Edit</button>
                    <button class="btn-sm btn-outline" style="border-color:red; color:red;" onclick="app.deleteProduct(${p.id})">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    showAddProductModal: function() {
        document.getElementById('edit-id').value = '';
        document.getElementById('edit-name').value = '';
        document.getElementById('edit-price').value = '';
        document.getElementById('edit-desc').value = '';
        document.getElementById('admin-form-container').classList.remove('hidden');
        window.scrollTo(0, document.body.scrollHeight);
    },

    saveProduct: function() {
        const id = document.getElementById('edit-id').value;
        const name = document.getElementById('edit-name').value;
        const cat = document.getElementById('edit-category').value;
        const price = parseInt(document.getElementById('edit-price').value);
        const desc = document.getElementById('edit-desc').value;

        if (id) {
            const index = this.data.products.findIndex(p => p.id == id);
            if (index !== -1) this.data.products[index] = { id: parseInt(id), name, category: cat, price, desc };
        } else {
            const newId = this.data.products.length ? Math.max(...this.data.products.map(p => p.id)) + 1 : 1;
            this.data.products.push({ id: newId, name, category: cat, price, desc });
        }
        this.saveProducts();
        document.getElementById('admin-form-container').classList.add('hidden');
        this.showToast('Produk tersimpan', 'success');
    },

    deleteProduct: function(id) {
        if(confirm('Hapus produk ini?')) {
            this.data.products = this.data.products.filter(p => p.id !== id);
            this.saveProducts();
            this.showToast('Produk dihapus', 'success');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { app.init(); });