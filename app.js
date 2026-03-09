// DAURAAN - Premium Executive Logic
const SUPABASE_URL = 'https://adcwjezexcmjjtpuzyce.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkY3dqZXpleGNtamp0cHV6eWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjIxNzksImV4cCI6MjA4ODUzODE3OX0.WHWQGfm3yW38-F_fYIAWw6HTxCNUigfKJbsV4i2Fqhw';

let db;
const WHATSAPP_NUMBER = "+923130823442";
const BUCKET_NAME = "product-images";

// Aapka verified Google Script URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxSlCHjkOVXj3vj7juZIOQ4yGBcdiFr3hm7hhPaOX0qdT9WUL9BmPM0gLkL9OqmAdPvRQ/exec";

let productGalleryImages = [];
let currentImageIndex = 0;
let productToDeleteId = null;
let productToDeleteImage = null;

// Update State
let isUpdating = false;
let currentUpdateId = null;
let currentEditGallery = [];

// 1. Initialize System
function startDauranSystem() {
    if (window.supabase) {
        db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ DAURAN PREMIUM SYSTEMS ONLINE");

        const path = window.location.pathname;
        if (path.includes('product.html')) {
            loadProductDetails();
        } else if (path.includes('admin.html')) {
            fetchInventory();
        } else {
            fetchProducts('All');
        }
    } else {
        setTimeout(startDauranSystem, 500);
    }
}

// 2. Fetch Products for Storefront
async function fetchProducts(category = 'All') {
    if (!db) return;
    const container = document.getElementById('dynamic-shop-container');
    if (!container) return; // Ignore on admin panel

    container.innerHTML = '<h2 class="section-title">Loading Collection...</h2><main class="product-grid"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></main>';

    let query = db.from('products').select('*').order('id', { ascending: false });
    if (category !== 'All') query = query.eq('category', category);

    const { data: products, error } = await query;
    if (error) return console.error(error);

    if (!products || products.length === 0) {
        container.innerHTML = '<h2 class="section-title" style="padding-top: 80px;">Vault is Currently Empty</h2>';
        return;
    }

    // Toggle drawer closed on mobile nav click
    const drawer = document.getElementById('side-drawer');
    if (drawer && drawer.classList.contains('open')) toggleDrawer();

    if (category !== 'All') {
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; padding:80px 5% 40px; border-bottom:1px solid var(--border-subtle); margin-bottom:40px;">
                <h2 class="section-title" style="padding:0; text-align:left; margin:0;">
                    ${category} 
                    <span style="display:block; color:var(--text-muted); font-size:1rem; margin-top:10px; font-family:'Inter', sans-serif; font-weight:300; text-transform:none; letter-spacing:0;">Exclusive ${category} Collection</span>
                </h2>
                <a href="javascript:void(0)" onclick="fetchProducts('All'); document.getElementById('dynamic-shop-container').scrollIntoView({behavior:'smooth'})" class="btn-luxury" style="padding:10px 20px; font-size:0.7rem;">&larr; Back to Full Vault</a>
            </div>
            <main class="product-grid" style="padding-top:0;">
                ${generateProductCards(products)}
            </main>
        `;
    } else {
        const watches = products.filter(p => p.category === 'Watches');
        const perfumes = products.filter(p => p.category === 'Perfumes');
        const others = products.filter(p => p.category !== 'Watches' && p.category !== 'Perfumes');

        let html = '';
        if (watches.length > 0) {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:baseline; padding: 80px 5% 20px;">
                    <h2 class="section-title" id="products-watches" style="padding:0; text-align:left; margin:0;">Top Selling Watches</h2>
                    <a href="javascript:void(0)" onclick="fetchProducts('Watches'); setTimeout(() => document.getElementById('dynamic-shop-container').scrollIntoView({behavior:'smooth'}), 100);" class="view-all-link">See All Watches &rarr;</a>
                </div>
                <main class="product-grid" style="padding-top:20px;">${generateProductCards(watches)}</main>
             `;
        }
        if (perfumes.length > 0) {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:baseline; padding: 60px 5% 20px;">
                    <h2 class="section-title" id="products-perfumes" style="padding:0; text-align:left; margin:0;">Signature Perfumes</h2>
                    <a href="javascript:void(0)" onclick="fetchProducts('Perfumes'); setTimeout(() => document.getElementById('dynamic-shop-container').scrollIntoView({behavior:'smooth'}), 100);" class="view-all-link">See All Perfumes &rarr;</a>
                </div>
                <main class="product-grid" style="padding-top:20px;">${generateProductCards(perfumes)}</main>
             `;
        }
        if (others.length > 0) {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:baseline; padding: 60px 5% 20px;">
                    <h2 class="section-title" id="products-others" style="padding:0; text-align:left; margin:0;">Luxury Essentials</h2>
                    <a href="javascript:void(0)" onclick="fetchProducts('All'); setTimeout(() => document.getElementById('dynamic-shop-container').scrollIntoView({behavior:'smooth'}), 100);" class="view-all-link">See More &rarr;</a>
                </div>
                <main class="product-grid" style="padding-top:20px;">${generateProductCards(others)}</main>
             `;
        }
        container.innerHTML = html;
    }
}

function generateProductCards(products) {
    return products.map((p, index) => {
        // Dynamic Premium Badge Logic
        let badge = '';
        let originalPriceHtml = '';

        if (index % 4 === 0) {
            badge = '<span class="product-badge badge-hot">HOT SELLING</span>';
        } else if (index % 3 === 0) {
            badge = '<span class="product-badge badge-discount">30% OFF</span>';
            originalPriceHtml = `<span class="price-strikethrough">PKR ${(p.price * 1.42).toFixed(0)}</span>`; // Approx original price
        } else if (index === 1) {
            badge = '<span class="product-badge badge-limited">LIMITED VAULT</span>';
        }

        return `
        <div class="product-card" onclick="openProductModal('${p.id}')">
            ${badge}
            <div class="product-img-box">
                <img src="${p.image_url}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300'">
            </div>
            <div class="product-info product-details">
                <h3>${p.name}</h3>
                <div class="price-wrapper">
                    ${originalPriceHtml}
                    <p class="pkr-price">PKR ${p.price}</p>
                </div>
            </div>
        </div>
    `}).join('');
}

// 3. Admin: Fetch Inventory (FIXED LOGIC)
async function fetchInventory() {
    const container = document.getElementById('inventory-container');
    if (!container || !db) return;

    container.innerHTML = '<div class="loading" style="text-align:center;">Loading Vault Archives...</div>';

    const { data: products, error } = await db.from('products').select('*').order('id', { ascending: false });

    console.log("Admin Inventory Fetch Result:", { products, error }); // Debug Log

    if (error) {
        container.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = '<p style="text-align:center">The vault is completely empty.</p>';
        return;
    }

    const categories = ['Watches', 'Perfumes', 'Belts', 'Body Sprays'];
    let html = '';
    let categorizedProductIds = new Set();

    categories.forEach(cat => {
        const items = products.filter(p => {
            const isMatch = p.category && p.category.toLowerCase() === cat.toLowerCase();
            if (isMatch) categorizedProductIds.add(p.id);
            return isMatch;
        });

        if (items.length > 0) {
            html += `
                <div class="category-block">
                    <h3 class="category-title" style="color:var(--gold); border-bottom:1px solid var(--glass-border); padding-bottom:10px; margin-top:20px;">${cat}</h3>
                    <div class="inventory-list">
                        ${items.map(p => `
                            <div class="inventory-item">
                                <div class="item-info">
                                    <img src="${p.image_url}" class="item-img" onerror="this.src='https://via.placeholder.com/60'">
                                    <div class="item-details">
                                        <h4>${p.name || 'Unnamed'}</h4>
                                        <span class="price">PKR ${p.price || 0}</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <button class="btn-delete" style="background:#4aa0ff; border-color:#4aa0ff;" onclick="editProduct('${p.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-delete" onclick="triggerDelete('${p.id}', '${p.image_url}')">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });

    const uncategorizedItems = products.filter(p => !categorizedProductIds.has(p.id));

    if (uncategorizedItems.length > 0) {
        html += `
                <div class="category-block">
                    <h3 class="category-title" style="color:#ff4444; border-bottom:1px solid #ff4444; padding-bottom:10px; margin-top:20px;">Uncategorized / Legacy items</h3>
                    <div class="inventory-list">
                        ${uncategorizedItems.map(p => `
                            <div class="inventory-item" style="border-left: 3px solid #ff4444;">
                                <div class="item-info">
                                    <img src="${p.image_url}" class="item-img" onerror="this.src='https://via.placeholder.com/60'">
                                    <div class="item-details">
                                        <h4>${p.name || 'Unnamed'} <span style="font-size:0.7rem; color:#888;">(Cat: ${p.category || 'None'})</span></h4>
                                        <span class="price">PKR ${p.price || 0}</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <button class="btn-delete" style="background:#4aa0ff; border-color:#4aa0ff;" onclick="editProduct('${p.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-delete" onclick="triggerDelete('${p.id}', '${p.image_url}')">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
    }

    container.innerHTML = html;
}

// 4. Admin: Multi-Upload Submission
async function handleAdminSubmission(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const status = document.getElementById('status');
    const files = document.getElementById('image').files;

    if (!isUpdating && (!files || files.length === 0)) {
        status.innerText = "❌ Select at least one image.";
        return;
    }

    submitBtn.innerText = isUpdating ? "Updating Repository..." : "Uploading to Vault...";
    submitBtn.disabled = true;

    try {
        let updateData = {
            name: document.getElementById('name').value,
            price: parseInt(document.getElementById('price').value),
            category: document.getElementById('category').value,
            description: document.getElementById('spec-narrative') ? document.getElementById('spec-narrative').value.trim() : ''
        };

        // Upload new images (if any)
        let newUploadedUrls = [];
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileName = `${Date.now()}_${i}_${file.name.replace(/\s/g, '_')}`;
                const { error: upErr } = await db.storage.from(BUCKET_NAME).upload(fileName, file);
                if (upErr) throw upErr;
                const { data: { publicUrl } } = db.storage.from(BUCKET_NAME).getPublicUrl(fileName);
                newUploadedUrls.push(publicUrl);
            }
        }

        if (isUpdating) {
            const finalGallery = [...currentEditGallery, ...newUploadedUrls];
            if (finalGallery.length === 0) {
                throw new Error("A product must have at least one image.");
            }
            updateData.gallery = finalGallery;
            updateData.image_url = finalGallery[0];

            const { error: updateErr } = await db.from('products').update(updateData).eq('id', currentUpdateId);
            if (updateErr) throw updateErr;
            status.innerText = "✅ PRODUCT UPDATED";

            // Reset state
            isUpdating = false;
            currentUpdateId = null;
            currentEditGallery = [];
            document.querySelector('.form-section .section-title').innerText = "Upload New Masterpiece";
            document.getElementById('image').required = true;
            document.getElementById('edit-image-preview').innerHTML = '';
        } else {
            updateData.image_url = newUploadedUrls[0];
            updateData.gallery = newUploadedUrls;
            const { error: insErr } = await db.from('products').insert([updateData]);
            if (insErr) throw insErr;
            status.innerText = "✅ PRODUCT ADDED";
        }

        e.target.reset();
        fetchInventory();
    } catch (err) {
        status.innerText = "❌ ERROR: " + err.message;
    } finally {
        submitBtn.innerText = "Finalize Collection Item";
        submitBtn.style.background = "var(--gold)";
        submitBtn.disabled = false;
    }
}

// 5. Delete & Modal Logic
window.triggerDelete = (id, img) => {
    productToDeleteId = id; productToDeleteImage = img;
    document.getElementById('delete-modal').style.display = 'flex';
};

window.closeDeleteModal = () => {
    document.getElementById('delete-modal').style.display = 'none';
};

async function confirmEradication() {
    if (!productToDeleteId) return;

    // Attempt to delete image from bucket
    if (productToDeleteImage && productToDeleteImage.includes('supabase.co')) {
        try {
            const urlParts = productToDeleteImage.split('/');
            const fileName = urlParts[urlParts.length - 1];
            if (fileName) {
                await db.storage.from(BUCKET_NAME).remove([fileName]);
            }
        } catch (e) {
            console.warn("Could not delete associated image from bucket:", e);
        }
    }

    const { error } = await db.from('products').delete().eq('id', productToDeleteId);

    if (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete product. Database Error: " + error.message + "\nCheck browser console for details.");
    } else {
        alert("Item successfully eradicated.");
        fetchInventory();
    }
    closeDeleteModal();
}

// 5b. Edit Logic
window.editProduct = async (id) => {
    if (!db) return;

    const { data: p, error } = await db.from('products').select('*').eq('id', id).single();
    if (error || !p) {
        alert("Could not load product details for editing.");
        return;
    }

    // Populate fundamental form fields
    document.getElementById('name').value = p.name || '';
    document.getElementById('price').value = p.price || '';
    document.getElementById('category').value = p.category || 'Watches';

    // Clear and populate the story textarea
    const narrativeBox = document.getElementById('spec-narrative');
    if (narrativeBox) {
        narrativeBox.value = '';
        if (p.description) {
            // Strip legacy HTML tables that were created by the old Smart Specs builder
            // so they don't look ugly in the raw textarea during an edit.
            let cleanText = p.description;

            // If it's the old table format, just strip all the HTML tags and format nicely
            if (cleanText.includes('<table') || cleanText.includes('<div')) {
                // Replace </td> and </div> with spaces/newlines for readability
                cleanText = cleanText.replace(/<\/(td|div|tr|p)>/gi, '\n');
                // Strip all remaining HTML tags
                cleanText = cleanText.replace(/<[^>]+>/g, ' ');
                // Clean up multiple spaces/newlines
                cleanText = cleanText.replace(/\n\s*\n/g, '\n').replace(/ {2,}/g, ' ').trim();
            }

            narrativeBox.value = cleanText;
        }
    }

    // Set Update State
    isUpdating = true;
    currentUpdateId = id;

    // Setup Edit Gallery UI
    currentEditGallery = (p.gallery && Array.isArray(p.gallery) && p.gallery.length > 0)
        ? [...p.gallery]
        : (p.image_url ? [p.image_url] : []);
    renderEditGallery();

    // Update UI
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerText = "Update Masterpiece";
    submitBtn.style.background = "#4aa0ff"; // Blue for update
    document.querySelector('.form-section .section-title').innerText = "Update Collection Item";

    // Make image optional
    document.getElementById('image').required = false;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.renderEditGallery = () => {
    const preview = document.getElementById('edit-image-preview');
    if (!preview) return;
    if (currentEditGallery.length === 0) {
        preview.innerHTML = '<span style="color:#888; font-size:0.9rem;">No existing images. You must upload at least one below.</span>';
        return;
    }
    preview.innerHTML = currentEditGallery.map((imgUrl, idx) => `
        <div class="edit-thumb-wrapper" style="position:relative; display:inline-block;">
            <img src="${imgUrl}" style="width:80px; height:80px; object-fit:cover; border-radius:4px; border:1px solid var(--glass-border);">
            <button type="button" onclick="removeEditImage(${idx})" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center;">X</button>
        </div>
    `).join('');
};

window.removeEditImage = async (idx) => {
    const urlToRemove = currentEditGallery[idx];
    if (urlToRemove && urlToRemove.includes('supabase.co')) {
        try {
            const urlParts = urlToRemove.split('/');
            const fileName = urlParts[urlParts.length - 1];
            if (fileName) {
                await db.storage.from(BUCKET_NAME).remove([fileName]);
            }
        } catch (e) {
            console.warn("Could not delete from storage bucket:", e);
        }
    }
    currentEditGallery.splice(idx, 1);
    renderEditGallery();
};

// 6. Product Details (Single-Page Modal Logic)
let modalGalleryImages = [];
let currentModalImageIndex = 0;

window.openProductModal = async (id) => {
    if (!id || !db) return;

    // Show loading state or skeleton if desired, here we just show the modal immediately
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    const { data: p } = await db.from('products').select('*').eq('id', id).single();
    if (p) {
        document.getElementById('modal-name').innerText = p.name;
        document.getElementById('modal-price').innerText = "PKR " + p.price;

        const catEl = document.getElementById('modal-category');
        if (catEl) catEl.innerText = p.category;

        const descEl = document.getElementById('modal-desc');
        if (descEl && p.description) {
            let descHtml = p.description;

            // Check if it's plain text from the new system, wrap in narrative class
            if (!descHtml.includes('<table') && !descHtml.includes('<div')) {
                descHtml = `<div class="product-narrative">${descHtml}</div>`;
            }
            descEl.innerHTML = descHtml;
        }

        // Gallery Handling
        modalGalleryImages = (p.gallery && Array.isArray(p.gallery) && p.gallery.length > 0) ? p.gallery : [p.image_url];
        currentModalImageIndex = 0;
        document.getElementById('modal-img').src = modalGalleryImages[0];

        // Hide/Show arrows based on count
        const nextBtn = document.getElementById('modal-next');
        const prevBtn = document.getElementById('modal-prev');
        if (modalGalleryImages.length > 1) {
            if (nextBtn) nextBtn.style.display = 'flex';
            if (prevBtn) prevBtn.style.display = 'flex';
        } else {
            if (nextBtn) nextBtn.style.display = 'none';
            if (prevBtn) prevBtn.style.display = 'none';
        }

        // Build Thumbnails
        const thumbContainer = document.getElementById('modal-thumbnails');
        if (thumbContainer) {
            if (modalGalleryImages.length > 1) {
                thumbContainer.innerHTML = modalGalleryImages.map((img, idx) => `
                    <img src="${img}" class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="setModalMainImage(${idx})">
                `).join('');
            } else {
                thumbContainer.innerHTML = ''; // Clear if only 1 image
            }
        }
    }
}

window.closeProductModal = (event) => {
    // If event is passed, ensure we click the background or the close button, not the content
    if (event && event.target.closest('.modal-content') && !event.target.classList.contains('modal-close')) {
        return;
    }
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

window.setModalMainImage = (index) => {
    currentModalImageIndex = index;
    document.getElementById('modal-img').src = modalGalleryImages[index];

    const thumbnails = document.querySelectorAll('#modal-thumbnails .thumb-item');
    thumbnails.forEach((thumb, i) => {
        if (i === index) thumb.classList.add('active');
        else thumb.classList.remove('active');
    });
};

window.changeImageModal = (direction) => {
    if (!modalGalleryImages || modalGalleryImages.length <= 1) return;

    let newIndex = currentModalImageIndex + direction;
    if (newIndex < 0) newIndex = modalGalleryImages.length - 1;
    if (newIndex >= modalGalleryImages.length) newIndex = 0;

    window.setModalMainImage(newIndex);
};

// Start System
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    startDauranSystem();
    const form = document.getElementById('product-form');
    if (form) form.addEventListener('submit', handleAdminSubmission);
    const delBtn = document.getElementById('confirm-delete-btn');
    if (delBtn) delBtn.onclick = confirmEradication;
});

// UI Interactions
window.toggleDrawer = () => {
    const drawer = document.getElementById('side-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer) drawer.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
};

// --- PREMIUM THEME TOGGLE LOGIC ---
function initTheme() {
    const savedTheme = localStorage.getItem('dauraan-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

window.toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dauraan-theme', newTheme);
    updateThemeIcon(newTheme);
};

function updateThemeIcon(theme) {
    // Update all sun/moon icons across the page
    const icons = document.querySelectorAll('#theme-toggle i');
    icons.forEach(icon => {
        if (theme === 'light') {
            icon.className = 'fas fa-moon'; // Show moon when light
        } else {
            icon.className = 'fas fa-sun'; // Show sun when dark
        }
    });
}

// --- Product Details Logic ---
async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId || !db) return;

    const { data: p, error } = await db.from('products').select('*').eq('id', productId).single();
    if (error || !p) {
        const container = document.getElementById('product-detail-container');
        if (container) container.innerHTML = '<h2 style="text-align:center; padding: 100px;">Product not found</h2>';
        return;
    }

    document.getElementById('product-name').innerText = p.name;
    document.getElementById('product-price').innerText = "PKR " + p.price;
    document.getElementById('product-category').innerText = p.category;

    if (p.description) {
        let descHtml = p.description;

        if (!descHtml.includes('<table') && !descHtml.includes('<div')) {
            descHtml = `<div class="product-narrative">${descHtml}</div>`;
        }
        document.getElementById('product-desc').innerHTML = descHtml;
    }

    window.currentCheckoutProduct = p;

    productGalleryImages = (p.gallery && Array.isArray(p.gallery) && p.gallery.length > 0) ? p.gallery : [p.image_url];
    currentImageIndex = 0;

    document.getElementById('product-img').src = productGalleryImages[0];

    const thumbContainer = document.getElementById('thumbnail-container');
    const sliderPrev = document.getElementById('slider-prev');
    const sliderNext = document.getElementById('slider-next');

    if (thumbContainer && productGalleryImages.length > 1) {
        thumbContainer.innerHTML = productGalleryImages.map((img, idx) => `
            <img src="${img}" class="detail-thumb ${idx === 0 ? 'active' : ''}" onclick="setMainImage(${idx})">
        `).join('');
        if (sliderPrev) sliderPrev.style.display = 'flex';
        if (sliderNext) sliderNext.style.display = 'flex';
    } else {
        if (thumbContainer) thumbContainer.innerHTML = '';
        if (sliderPrev) sliderPrev.style.display = 'none';
        if (sliderNext) sliderNext.style.display = 'none';
    }
}

window.setMainImage = (index) => {
    currentImageIndex = index;
    const mainImg = document.getElementById('product-img');
    if (mainImg) mainImg.src = productGalleryImages[index];

    const thumbs = document.querySelectorAll('#thumbnail-container .detail-thumb');
    thumbs.forEach((t, i) => {
        if (i === index) t.classList.add('active');
        else t.classList.remove('active');
    });
};

window.changeImage = (dir) => {
    if (!productGalleryImages || productGalleryImages.length <= 1) return;
    let newIndex = currentImageIndex + dir;
    if (newIndex < 0) newIndex = productGalleryImages.length - 1;
    if (newIndex >= productGalleryImages.length) newIndex = 0;
    window.setMainImage(newIndex);
};

// --- Checkout Form Logic ---
window.openCheckoutForm = () => {
    const isProductPage = window.location.pathname.includes('product.html');

    if (!isProductPage) {
        const modalName = document.getElementById('modal-name')?.innerText;
        const modalPrice = document.getElementById('modal-price')?.innerText;
        if (modalName && modalName !== '...') {
            window.currentCheckoutProduct = {
                name: modalName,
                price: modalPrice?.replace('PKR ', '') || ''
            };
        }
    }

    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeCheckoutForm = (event) => {
    if (event && event.target && event.target.closest && event.target.closest('.modal-content') && !event.target.classList.contains('modal-close')) {
        return;
    }
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
    }

    const productModal = document.getElementById('product-modal');
    if (!productModal || productModal.style.display === 'none' || productModal.style.display === '') {
        document.body.style.overflow = 'auto';
    }
};

// 5. THE LIFETIME FREE CHECKOUT (Background Notification + window.open WhatsApp)
window.submitCheckout = async (event) => {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Securing Order...";
    submitBtn.disabled = true;

    try {
        const name = document.getElementById('checkout-name').value.trim();
        const email = document.getElementById('checkout-email').value.trim();
        const phone = document.getElementById('checkout-phone').value.trim();
        const address = document.getElementById('checkout-address').value.trim();

        const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

        let productDetails = "";
        let pName = "N/A";
        let pPrice = "0";
        if (window.currentCheckoutProduct) {
            const p = window.currentCheckoutProduct;
            pName = p.name;
            pPrice = p.price;
            productDetails = `
*Product:* ${p.name}
*Price:* PKR ${p.price}`;
        }

        const orderData = {
            name: name,
            email: email,
            phone: phone,
            address: address,
            product: pName,
            price: pPrice,
            orderId: orderId
        };

        // Send to Google Sheet & Gmail via Web App URL (Background)
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });

        alert("Thank you! Your order has been placed successfully. We will contact you shortly.");
        document.getElementById('checkout-form').reset();
        window.closeCheckoutForm();

    } catch (err) {
        console.error("Order submission error:", err);
        alert("There was an issue processing your order. Please try again.");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
};

