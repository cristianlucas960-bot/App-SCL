// Base de datos con fotos reales de prendas
const productos = [
    { id: 1, nombre: "Remera Oversize Cotton", categoria: "remeras", precio: 25, imagen: "https://unsplash.com" },
    { id: 2, nombre: "Jean Mom Denim Premium", categoria: "pantalones", precio: 45, imagen: "https://unsplash.com" },
    { id: 3, nombre: "Campera Classic Denim", categoria: "camperas", precio: 70, imagen: "https://unsplash.com" },
    { id: 4, nombre: "Remera Minimalist White", categoria: "remeras", precio: 22, imagen: "https://unsplash.com" },
    { id: 5, nombre: "Pantalón Cargo Ajustable", categoria: "pantalones", precio: 50, imagen: "https://unsplash.com" },
    { id: 6, nombre: "Campera Aviadora Black", categoria: "camperas", precio: 85, imagen: "https://unsplash.com" }
];

let carrito = [];

const productsContainer = document.getElementById('products-container');
const filterBtns = document.querySelectorAll('.filter-btn');
const cartIcon = document.getElementById('cart-icon');
const cartModal = document.getElementById('cart-overlay'); // Se sincroniza ID con el CSS
const closeModal = document.getElementById('close-modal');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCount = document.getElementById('cart-count');
const checkoutBtn = document.getElementById('checkout-btn');

function renderProducts(productosFiltrados) {
    if(!productsContainer) return;
    productsContainer.innerHTML = "";
    productosFiltrados.forEach(prod => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.innerHTML = `
            <div class="img-wrapper">
                <img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy">
            </div>
            <div class="product-info">
                <h3>${prod.nombre}</h3>
                <p class="price">$${prod.precio}</p>
                <button class="add-to-cart" onclick="agregarAlCarrito(${prod.id})">Añadir al carrito</button>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const categoria = e.target.dataset.category;
        if(categoria === 'todos') {
            renderProducts(productos);
        } else {
            const filtrados = productos.filter(p => p.categoria === categoria);
            renderProducts(filtrados);
        }
    });
});

function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    const existe = carrito.find(p => p.id === id);

    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    actualizarCarrito();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(p => p.id !== id);
    actualizarCarrito();
}

function actualizarCarrito() {
    cartItemsContainer.innerHTML = "";
    let total = 0;
    let totalItems = 0;

    carrito.forEach(prod => {
        total += prod.precio * prod.cantidad;
        totalItems += prod.cantidad;

        const itemRow = document.createElement('div');
        itemRow.classList.add('cart-item');
        itemRow.innerHTML = `
            <div class="cart-item-details">
                <h4>${prod.nombre} (x${prod.cantidad})</h4>
                <p>$${prod.precio * prod.cantidad}</p>
                <button class="remove-btn" onclick="eliminarDelCarrito(${prod.id})">Eliminar</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemRow);
    });

    cartTotalPrice.innerText = total;
    cartCount.innerText = totalItems;
}

// Controladores de visualización del Carrito (Modal/Sidebar)
if(cartIcon) {
    cartIcon.addEventListener('click', () => {
        const modal = document.getElementById('cart-modal');
        if(modal) modal.style.display = 'flex';
    });
}
if(closeModal) {
    closeModal.addEventListener('click', () => {
        const modal = document.getElementById('cart-modal');
        if(modal) modal.style.display = 'none';
    });
}
window.addEventListener('click', (e) => {
    const modal = document.getElementById('cart-modal');
    if (e.target === modal && modal) modal.style.display = 'none';
});

if(checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if(carrito.length === 0) {
            alert("No hay artículos en tu pedido actual.");
            return;
        }
        alert("¡Pedido recibido con éxito! Iniciando despacho de prendas.");
        carrito = [];
        actualizarCarrito();
        const modal = document.getElementById('cart-modal');
        if(modal) modal.style.display = 'none';
    });
}

// Inicialización de la App
renderProducts(productos);
