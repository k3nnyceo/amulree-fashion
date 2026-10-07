// Shared product catalog for AmulRee Fashion.
// Single source of truth used by index.html, shop.html, and product.html —
// keeps names/prices/images from drifting out of sync between pages.
// Catalog is Ankara-print dresses only, split into two categories: short/long.
// Names are SKU-style codes (AK001 upwards) rather than descriptive names, so
// `description` carries the "what it shows" copy displayed in the quick view
// and product page.
const products = [
    { id: 1,  name: 'AK001', category: 'short', price: 27000,  image: 'images/products/AK001.jpg', rating: 4.6, description: 'Yellow and black print dress with sequin trim and puff sleeves.' },
    { id: 2,  name: 'AK002', category: 'short', price: 28000,  image: 'images/products/AK002.jpg', rating: 4.7, description: 'Red-sleeve dress with a white floral-burst print.' },
    { id: 3,  name: 'AK003', category: 'long',  price: 48000, image: 'images/products/AK003.jpg', rating: 4.5, description: 'Striped top with a tiered blue, teal and pink maxi skirt.' },
    { id: 4,  name: 'AK004', category: 'short', price: 25000,  image: 'images/products/AK004.jpg', rating: 4.4, description: 'Blue and white striped dress with a blue batik-print skirt panel and headwrap.' },
    { id: 5,  name: 'AK005', category: 'short', price: 42000,  image: 'images/products/AK005.jpg', rating: 4.8, description: 'Purple and pink floral dress with a sequin headwrap.' },
    { id: 6,  name: 'AK006', category: 'long',  price: 45000, image: 'images/products/AK006.jpg', rating: 4.6, description: 'Navy wide-leg jumpsuit with colorful circle patchwork.' },
    { id: 7,  name: 'AK007', category: 'short', price: 28000,  image: 'images/products/AK007.jpg', rating: 4.5, description: 'Pink and white striped dress with colorblock patches.' },
    { id: 8,  name: 'AK008', category: 'long',  price: 55000, image: 'images/products/AK008.jpg', rating: 4.9, description: 'Purple flowy kaftan gown with gold button details.' },
    { id: 9,  name: 'AK009', category: 'short', price: 25000,  image: 'images/products/AK009.jpg', rating: 4.5, description: 'Orange and red print dress with a burgundy bow accent.' },
    { id: 10, name: 'AK010', category: 'long',  price: 49000, image: 'images/products/AK010.jpg', rating: 4.6, description: 'Pink kaftan with black lace sleeve trim.' },
    { id: 11, name: 'AK011', category: 'long',  price: 48000, image: 'images/products/AK011.jpg', rating: 4.7, description: 'White textured kaftan with black lace trim and a tasseled hem.' },
    { id: 12, name: 'AK012', category: 'short', price: 25000,  image: 'images/products/AK012.jpg', rating: 4.4, description: 'White striped dress with colorful circle appliques.' },
    { id: 13, name: 'AK013', category: 'long',  price: 48000, image: 'images/products/AK013.jpg', rating: 4.6, description: 'Blue batik kaftan top with a red patterned maxi skirt.' },
    { id: 14, name: 'AK014', category: 'long',  price: 34000, image: 'images/products/AK014.jpg', rating: 4.8, description: 'Blue and white striped maxi dress with a pink and teal cold-shoulder top.' },
    { id: 15, name: 'AK015', category: 'long',  price: 34000, image: 'images/products/AK015.jpg', rating: 4.7, description: 'Red and white striped maxi kaftan with a floral yoke.' },
];

// Display labels for the two categories — used by filter buttons, badges,
// and breadcrumbs so the raw 'short'/'long' values never leak into the UI.
const CATEGORY_LABELS = {
    short: 'Short Dress',
    long: 'Long Dress',
};

// Fallback filler copy, only used if a product is ever missing its own
// hand-written `description`.
const CATEGORY_DESCRIPTIONS = {
    short: name => `The ${name} is a breezy, easy-to-wear short dress in a bold Ankara-inspired print — perfect for warm-weather days and effortless style.`,
    long: name => `The ${name} is a flowing, floor-grazing kaftan-style dress with a vibrant Ankara-inspired print — comfortable, striking, and made for standout occasions.`,
};

function getProductDescription(product) {
    if (product.description) return product.description;
    const fn = CATEGORY_DESCRIPTIONS[product.category];
    return fn ? fn(product.name) : `The ${product.name} is a versatile addition to your wardrobe, crafted with quality and comfort in mind.`;
}

// ── Sale helpers ──────────────────────────────────────────────────────────
function isOnSale(product) {
    return typeof product.originalPrice === 'number' && product.originalPrice > product.price;
}

function getDiscountPercent(product) {
    if (!isOnSale(product)) return 0;
    return Math.round((1 - product.price / product.originalPrice) * 100);
}

// ── Shared cart helpers (localStorage-backed, used by index/shop/product) ──
function addToCart(productId, opts = {}) {
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    const size = opts.size || null;
    const color = opts.color || null;
    const qty = opts.qty || 1;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(item => item.productId === productId && item.size === size && item.color === color);

    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({
            id: Date.now(),
            productId,
            name: product.name,
            price: product.price,
            image: product.image,
            size,
            color,
            quantity: qty,
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    return { product, qty, size, color };
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = count;
}

// ── Shared wishlist helpers (localStorage-backed, a plain array of product IDs) ──
function getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist')) || [];
}

function isWishlisted(productId) {
    return getWishlist().includes(productId);
}

function toggleWishlist(productId) {
    let wishlist = getWishlist();
    if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
    } else {
        wishlist.push(productId);
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistBadge();
    document.querySelectorAll(`[data-wishlist-id="${productId}"]`).forEach(btn => {
        btn.classList.toggle('active', wishlist.includes(productId));
    });
    return wishlist.includes(productId);
}

function updateWishlistBadge() {
    const badge = document.getElementById('wishlist-count');
    if (badge) badge.textContent = getWishlist().length;
}

// ── Recently viewed (localStorage-backed, a plain array of product IDs, most-recent-first) ──
const RECENTLY_VIEWED_LIMIT = 8;

function trackRecentlyViewed(productId) {
    let viewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
    viewed = viewed.filter(id => id !== productId);
    viewed.unshift(productId);
    viewed = viewed.slice(0, RECENTLY_VIEWED_LIMIT);
    localStorage.setItem('recentlyViewed', JSON.stringify(viewed));
}

function getRecentlyViewed(excludeId, limit = 4) {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
    return viewed
        .filter(id => id !== excludeId)
        .map(id => products.find(p => p.id === id))
        .filter(Boolean)
        .slice(0, limit);
}

// ── Header search — every page's nav search box sends the query here ──
function submitHeaderSearch(event, inputEl) {
    event.preventDefault();
    const query = inputEl.value.trim();
    window.location.href = query ? `shop.html?search=${encodeURIComponent(query)}` : 'shop.html';
}

// ── Announcement bar — dismissible for the browsing session ──
function dismissAnnouncement() {
    const bar = document.getElementById('announcement-bar');
    if (bar) bar.style.display = 'none';
    sessionStorage.setItem('announcementDismissed', '1');
}

// Chrome shared by every page that includes this script: wishlist badge count
// on load, and restoring the announcement bar's dismissed state.
document.addEventListener('DOMContentLoaded', () => {
    updateWishlistBadge();
    if (sessionStorage.getItem('announcementDismissed')) {
        const bar = document.getElementById('announcement-bar');
        if (bar) bar.style.display = 'none';
    }
});
