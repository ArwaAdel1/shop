let settings = {};
let categories = [];
let products = [];
let currentCategory = null;
let cart = JSON.parse(localStorage.getItem('shop_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('shop_wishlist') || '[]');

// ===== THEME =====
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
}
function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ===== INIT =====
async function init() {
  initTheme();
  try {
    [settings, categories] = await Promise.all([
      api.get("/settings"),
      api.get("/categories"),
    ]);
    applySiteSettings();
    renderCategories();
    await loadProducts();
    updateCartBadge();
    initScrollReveal();
  } catch (err) {
    console.error("Init error:", err);
  }
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ===== SETTINGS =====
function applySiteSettings() {
  document.querySelectorAll(".site-name").forEach(el => el.textContent = settings.siteName_ar || "متجرنا");
  document.title = settings.siteName_ar || "متجرنا";

  if (settings.heroTitle_ar) {
    const el = document.getElementById("heroTitle");
    if (el) el.textContent = settings.heroTitle_ar;
  }
  if (settings.heroSubtitle_ar) {
    const el = document.getElementById("heroSubtitle");
    if (el) el.textContent = settings.heroSubtitle_ar;
  }

  const c = settings.contact || {};
  if (c.whatsapp) {
    document.querySelectorAll(".whatsapp-btn").forEach(el => {
      el.href = whatsappLink(c.whatsapp, "مرحباً، أريد الاستفسار");
    });
  }

  const setContact = (id, val, prefix = "") => {
    const el = document.getElementById(id);
    if (el && val) { el.textContent = val; if (prefix) el.href = prefix + val; }
  };
  setContact("contactPhone", c.phone, "tel:");
  setContact("contactEmail", c.email, "mailto:");
  if (c.address_ar) { const el = document.getElementById("contactAddress"); if (el) el.textContent = c.address_ar; }

  const showSocial = (id, href) => { if (!href) return; const el = document.getElementById(id); if (el) { el.href = href; el.style.display = "flex"; } };
  showSocial("socialFacebook", c.facebook);
  showSocial("socialInstagram", c.instagram);
  showSocial("socialTiktok", c.tiktok);

  renderPaymentSection(settings.payment || {});
  if (settings.footerText_ar) { const el = document.getElementById("footerText"); if (el) el.textContent = settings.footerText_ar; }
}

// ===== CATEGORIES =====
function renderCategoriesSkeleton() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;
  grid.innerHTML = Array(8).fill(`
    <div class="cat-skeleton">
      <div class="skeleton cat-skeleton-icon"></div>
      <div class="skeleton cat-skeleton-name" style="margin-top:10px"></div>
    </div>`).join("");
}

function renderCategories() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;
  grid.innerHTML = categories.map(cat => `
    <div class="category-card reveal" data-id="${cat._id}" onclick="filterByCategory('${cat._id}', this)">
      <span class="category-icon">${cat.icon || "📦"}</span>
      <div class="category-name">${cat.name_ar}</div>
    </div>`).join("");
  initScrollReveal();
}

function filterByCategory(id, el) {
  if (currentCategory === id) {
    currentCategory = null;
    el.classList.remove("active");
  } else {
    currentCategory = id;
    document.querySelectorAll(".category-card").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
  }
  loadProducts(1);
}

// ===== PRODUCTS =====
function renderProductsSkeleton() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  grid.innerHTML = Array(8).fill(`
    <div class="product-skeleton">
      <div class="skeleton product-skeleton-img"></div>
      <div class="product-skeleton-body">
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line full" style="margin-top:6px"></div>
        <div class="skeleton skeleton-line medium" style="margin-top:6px"></div>
        <div class="skeleton skeleton-line short" style="margin-top:12px;height:32px;border-radius:8px"></div>
      </div>
    </div>`).join("");
}

async function loadProducts(page = 1) {
  renderProductsSkeleton();
  try {
    const params = new URLSearchParams({ page, limit: 12, active: "true" });
    if (currentCategory) params.set("category", currentCategory);
    // Sort
    const sort = document.getElementById("sortSelect")?.value || "";
    if (sort === "price_asc") { params.set("sortBy", "price"); params.set("sortOrder", "asc"); }
    else if (sort === "price_desc") { params.set("sortBy", "price"); params.set("sortOrder", "desc"); }
    else if (sort === "name_asc") { params.set("sortBy", "name_ar"); params.set("sortOrder", "asc"); }
    // Price filter
    const minP = document.getElementById("priceMin")?.value;
    const maxP = document.getElementById("priceMax")?.value;
    if (minP) params.set("priceMin", minP);
    if (maxP) params.set("priceMax", maxP);
    const res = await api.get(`/products?${params}`);
    products = res.products;
    renderProducts(products);
    renderPagination(res);
  } catch {
    document.getElementById("productsGrid").innerHTML =
      `<p style="color:var(--text-muted);text-align:center;padding:40px;grid-column:1/-1">تعذر تحميل المنتجات</p>`;
  }
}

function renderProducts(list) {
  const grid = document.getElementById("productsGrid");
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🛍️</div><h3>لا توجد منتجات</h3></div>`;
    return;
  }

  grid.innerHTML = list.map((p, idx) => {
    const imgs = p.images || [];
    const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const inCart = cart.find(i => String(i._id) === String(p._id));

    let imageHTML = "";
    if (imgs.length > 1) {
      imageHTML = `
        <div class="img-slider" id="slider-${p._id}">
          ${imgs.map((src, i) => `<img src="${src}" alt="${p.name_ar}" class="${i===0?'active':''}" loading="lazy">`).join("")}
          <button class="slider-btn prev" onclick="sliderPrev(event,'${p._id}')">‹</button>
          <button class="slider-btn next" onclick="sliderNext(event,'${p._id}')">›</button>
          <div class="slider-dots">${imgs.map((_,i)=>`<span class="dot ${i===0?'active':''}" onclick="sliderGo(event,'${p._id}',${i})"></span>`).join("")}</div>
        </div>`;
    } else if (imgs.length === 1) {
      imageHTML = `<img src="${imgs[0]}" alt="${p.name_ar}" loading="lazy">`;
    } else {
      imageHTML = `<div class="no-image">${p.category?.icon||"📦"}</div>`;
    }

    return `
      <div class="product-card reveal reveal-delay-${(idx%3)+1}" onclick="openProductDetail('${p._id}')">
        <div class="product-image">
          ${imageHTML}
          ${discount>0?`<span class="badge badge-danger product-badge">-${discount}%</span>`:""}
        </div>
        <div class="product-info">
          <div class="product-category">${p.category?.name_ar||""}</div>
          <div class="product-name">${p.name_ar}</div>
          <div class="product-price-row">
            <div>
              ${p.oldPrice?`<span class="product-old-price">${formatPrice(p.oldPrice)}</span>`:""}
              <span class="product-price">${formatPrice(p.price)}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <button class="product-cart-btn ${inCart?'in-cart':''}" id="cartbtn-${p._id}"
                onclick="event.stopPropagation();toggleCart('${p._id}')">
                ${inCart?"✓ في السلة":"🛒 أضف"}
              </button>
              <button class="wishlist-btn ${wishlist.find(w=>String(w._id)===String(p._id))?'active':''}"
                id="wishbtn-${p._id}"
                onclick="event.stopPropagation();toggleWishlist('${p._id}')">
                ${wishlist.find(w=>String(w._id)===String(p._id))?"❤️":"🤍"}
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }).join("");
  initScrollReveal();
}

// ===== PRODUCT DETAIL MODAL =====
function openProductDetail(id) {
  const product = products.find(p => String(p._id) === String(id));
  if (!product) { console.warn('Product not found:', id); return; }

  const overlay = document.getElementById("productDetailOverlay");
  const body = document.getElementById("productDetailBody");
  const imgs = product.images || [];
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const inCart = cart.find(i => String(i._id) === String(product._id));
  const whatsapp = settings.contact?.whatsapp || "";
  const msg = `مرحباً، أريد الاستفسار عن: ${product.name_ar}\nالسعر: ${formatPrice(product.price)}`;

  const mainImg = imgs[0] || "";
  const thumbsHTML = imgs.length > 1 ? `
    <div class="product-modal-thumbs">
      ${imgs.map((src,i) => `
        <div class="product-modal-thumb ${i===0?'active':''}" onclick="switchModalImg('${id}',${i},this)">
          <img src="${src}" alt="" loading="lazy">
        </div>`).join("")}
    </div>` : "";

  body.innerHTML = `
    <div class="product-modal-grid">
      <div class="product-modal-images">
        <div class="product-modal-main-img" id="modalMainImg-${id}">
          ${mainImg ? `<img src="${mainImg}" alt="${product.name_ar}" id="modalMainImgEl-${id}">` :
            `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem">${product.category?.icon||"📦"}</div>`}
        </div>
        ${thumbsHTML}
      </div>
      <div>
        <div style="font-size:0.78rem;color:var(--accent-gold);font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">
          ${product.category?.name_ar||""}
        </div>
        <div class="product-modal-name">${product.name_ar}</div>
        ${product.name_en ? `<div style="color:var(--text-muted);font-size:0.85rem;margin-bottom:4px">${product.name_en}</div>` : ""}
        <div class="product-modal-price">
          ${product.oldPrice ? `<span class="product-modal-old-price">${formatPrice(product.oldPrice)}</span>` : ""}
          ${formatPrice(product.price)}
          ${discount > 0 ? `<span class="badge badge-danger" style="font-size:0.8rem;margin-right:8px">وفّر ${discount}%</span>` : ""}
        </div>
        ${product.description_ar ? `<div class="product-modal-desc">${product.description_ar}</div>` : ""}
        ${product.brand ? `<div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px">الماركة: <strong>${product.brand}</strong></div>` : ""}
        <div style="font-size:0.85rem;color:${product.stock>0?'var(--success)':'var(--danger)'};margin-bottom:16px;font-weight:700">
          ${product.stock > 0 ? `✅ متاح (${product.stock} قطعة)` : "❌ غير متاح حالياً"}
        </div>
        <div class="product-modal-actions">
          <button class="btn btn-gold" id="modalCartBtn-${id}"
            onclick="toggleCartFromModal('${id}')">
            ${inCart ? "✓ في السلة" : "🛒 أضف للسلة"}
          </button>
          <a href="${whatsappLink(whatsapp, msg)}" target="_blank"
            class="btn" style="background:rgba(37,211,102,0.1);color:#25d366;border:1.5px solid rgba(37,211,102,0.25)">
            💬 استفسار
          </a>
        </div>
      </div>
    </div>`;

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeProductDetail() {
  document.getElementById("productDetailOverlay")?.classList.remove("active");
  document.body.style.overflow = "";
}

function switchModalImg(productId, idx, thumbEl) {
  const product = products.find(p => p._id === productId);
  if (!product) return;
  const imgEl = document.getElementById(`modalMainImgEl-${productId}`);
  if (imgEl) imgEl.src = product.images[idx];
  document.querySelectorAll(".product-modal-thumb").forEach((t,i) => t.classList.toggle("active", i===idx));
}

function toggleCartFromModal(id) {
  toggleCart(id);
  const inCart = cart.find(i => i._id === id);
  const btn = document.getElementById(`modalCartBtn-${id}`);
  if (btn) { btn.textContent = inCart ? "✓ في السلة" : "🛒 أضف للسلة"; }
}

// ===== IMAGE SLIDER =====
function getSliderState(id) {
  const slider = document.getElementById("slider-"+id);
  if (!slider) return null;
  const imgs = slider.querySelectorAll("img");
  const dots = slider.querySelectorAll(".dot");
  const current = [...imgs].findIndex(img => img.classList.contains("active"));
  return { slider, imgs, dots, current };
}
function sliderGo(e, id, idx) {
  e.stopPropagation();
  const s = getSliderState(id);
  if (!s) return;
  s.imgs[s.current].classList.remove("active"); s.dots[s.current].classList.remove("active");
  s.imgs[idx].classList.add("active"); s.dots[idx].classList.add("active");
}
function sliderNext(e, id) { e.stopPropagation(); const s=getSliderState(id); if(!s) return; sliderGo(e,id,(s.current+1)%s.imgs.length); }
function sliderPrev(e, id) { e.stopPropagation(); const s=getSliderState(id); if(!s) return; sliderGo(e,id,(s.current-1+s.imgs.length)%s.imgs.length); }

// ===== CART =====
function toggleCart(productId) {
  const idx = cart.findIndex(i => String(i._id) === String(productId));
  const product = products.find(p => String(p._id) === String(productId));
  if (!product) return;
  if (idx > -1) {
    cart.splice(idx, 1);
  } else {
    cart.push({ _id: product._id, name: product.name_ar, price: product.price, qty: 1, image: product.images?.[0]||"" });
  }
  saveCart(); updateCartBadge();
  const btn = document.getElementById("cartbtn-"+productId);
  if (btn) { const inCart = cart.find(i=>i._id===productId); btn.textContent=inCart?"✓ في السلة":"🛒 أضف"; btn.classList.toggle("in-cart",!!inCart); }
}
function saveCart() { localStorage.setItem("shop_cart", JSON.stringify(cart)); }
function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  const total = cart.reduce((s,i)=>s+i.qty,0);
  if (badge) { badge.textContent=total; badge.style.display=total>0?"flex":"none"; }
}
function openCart() { renderCartPanel(); document.getElementById("cartPanel")?.classList.add("open"); document.getElementById("cartOverlay")?.classList.add("active"); document.body.style.overflow="hidden"; }
function closeCart() { document.getElementById("cartPanel")?.classList.remove("open"); document.getElementById("cartOverlay")?.classList.remove("active"); document.body.style.overflow=""; }

function renderCartPanel() {
  const el = document.getElementById("cartItems");
  if (!el) return;
  if (!cart.length) {
    el.innerHTML=`<div class="empty-state" style="padding:40px"><div class="empty-state-icon">🛒</div><h3>السلة فارغة</h3><p>أضف منتجات أولاً</p></div>`;
    document.getElementById("cartFooter").style.display="none"; return;
  }
  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">${item.image?`<img src="${item.image}" alt="">`:`<span style="font-size:1.4rem">📦</span>`}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
      </div>
      <div class="cart-item-qty">
        <button onclick="changeQty('${item._id}',-1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty('${item._id}',1)">+</button>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item._id}')">✕</button>
    </div>`).join("");
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  document.getElementById("cartTotalAmount").textContent = formatPrice(total);
  document.getElementById("cartFooter").style.display="block";
}

function changeQty(id, delta) {
  const item = cart.find(i=>i._id===id);
  if (!item) return;
  item.qty = Math.max(1, item.qty+delta);
  saveCart(); updateCartBadge(); renderCartPanel();
}
function removeFromCart(id) {
  cart = cart.filter(i=>i._id!==id);
  saveCart(); updateCartBadge(); renderCartPanel();
  const btn = document.getElementById("cartbtn-"+id);
  if (btn) { btn.textContent="🛒 أضف"; btn.classList.remove("in-cart"); }
}
function clearCart() {
  cart = []; saveCart(); updateCartBadge(); renderCartPanel();
  document.querySelectorAll(".product-cart-btn.in-cart").forEach(btn=>{ btn.textContent="🛒 أضف"; btn.classList.remove("in-cart"); });
}

// ===== CHECKOUT =====
let selectedMethod = null;

function openCheckout() {
  renderCheckoutContent();
  document.getElementById("checkoutModal")?.classList.add("active");
}
function closeCheckout() { document.getElementById("checkoutModal")?.classList.remove("active"); }

function renderCheckoutContent() {
  const el = document.getElementById("checkoutContent");
  if (!el) return;
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const p = settings.payment || {};
  const whatsapp = settings.contact?.whatsapp || "";
  const methods = [
    p.vodafoneCash?.isActive  && { id:"vodafone",  icon:"📱", name:"فودافون كاش",  color:"#e60000", bg:"rgba(230,0,0,0.1)",    detail:`رقم: ${p.vodafoneCash.number} — باسم: ${p.vodafoneCash.name}` },
    p.etisalatCash?.isActive  && { id:"etisalat",  icon:"📲", name:"اتصالات كاش", color:"#ff6600", bg:"rgba(255,102,0,0.1)",  detail:`رقم: ${p.etisalatCash.number} — باسم: ${p.etisalatCash.name}` },
    p.fawry?.isActive         && { id:"fawry",     icon:"🏪", name:"فوري",          color:"#f5a623", bg:"rgba(245,166,35,0.1)", detail:p.fawry.instructions_ar },
    p.instaPay?.isActive      && { id:"instapay",  icon:"💳", name:"إنستا باي",    color:"#7c3aed", bg:"rgba(124,58,237,0.1)", detail:p.instaPay.instructions_ar?.replace(/https?:\/\/\S+/g,"").trim() },
    p.cashOnDelivery?.isActive && { id:"cod",      icon:"🚪", name:"الدفع عند الاستلام", color:"#2ecc71", bg:"rgba(46,204,113,0.1)", detail:p.cashOnDelivery.instructions_ar || "سيتم تحصيل المبلغ عند استلام الطلب" },
  ].filter(Boolean);
  const orderLines = cart.map(i=>`${i.name} x${i.qty} = ${i.price*i.qty} جنيه`).join("\n");

  el.innerHTML = `
    <!-- ملخص الطلب -->
    <div style="background:var(--bg-secondary);border-radius:var(--radius);padding:14px;margin-bottom:20px">
      <div style="font-weight:800;margin-bottom:8px">📋 ملخص الطلب</div>
      <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.9">
        ${cart.map(i=>`${i.name} × ${i.qty} = <strong>${formatPrice(i.price*i.qty)}</strong>`).join("<br>")}
      </div>
      <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px;font-size:1.05rem;font-weight:900;color:var(--accent-gold)">
        الإجمالي: ${formatPrice(total)}
      </div>
    </div>

    <!-- بيانات العميل -->
    <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:20px">
      <div style="font-weight:800;margin-bottom:14px;font-size:0.95rem">👤 بياناتك</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <div class="form-label" style="font-size:0.8rem;margin-bottom:6px">الاسم الكامل *</div>
          <input id="coName" class="form-input" placeholder="محمد أحمد" style="font-size:0.9rem;padding:10px 12px">
        </div>
        <div>
          <div class="form-label" style="font-size:0.8rem;margin-bottom:6px">رقم الهاتف *</div>
          <input id="coPhone" class="form-input" placeholder="01xxxxxxxxx" dir="ltr" style="font-size:0.9rem;padding:10px 12px">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <div class="form-label" style="font-size:0.8rem;margin-bottom:6px">المحافظة *</div>
          <select id="coGov" class="form-input" style="font-size:0.9rem;padding:10px 12px">
            <option value="">اختر المحافظة</option>
            ${["القاهرة","الجيزة","الإسكندرية","الدقهلية","البحر الأحمر","البحيرة","الفيوم","الغربية","الإسماعيلية","المنوفية","المنيا","القليوبية","الوادي الجديد","السويس","أسوان","أسيوط","بني سويف","بورسعيد","دمياط","الشرقية","جنوب سيناء","كفر الشيخ","مطروح","الأقصر","قنا","شمال سيناء","سوهاج"].map(g=>`<option value="${g}">${g}</option>`).join("")}
          </select>
        </div>
        <div>
          <div class="form-label" style="font-size:0.8rem;margin-bottom:6px">المدينة / المركز *</div>
          <input id="coCity" class="form-input" placeholder="مثال: المعادي" style="font-size:0.9rem;padding:10px 12px">
        </div>
      </div>
      <div style="margin-bottom:12px">
        <div class="form-label" style="font-size:0.8rem;margin-bottom:6px">الشارع والعنوان بالتفصيل *</div>
        <input id="coStreet" class="form-input" placeholder="مثال: شارع التحرير، بجوار مسجد النور، عمارة 5 شقة 3" style="font-size:0.9rem;padding:10px 12px">
      </div>
      <div>
        <div class="form-label" style="font-size:0.8rem;margin-bottom:6px">علامة مميزة (اختياري)</div>
        <input id="coLandmark" class="form-input" placeholder="مثال: بجوار محطة المترو، أمام البنك" style="font-size:0.9rem;padding:10px 12px">
      </div>
    </div>

    <!-- طريقة الدفع -->
    <div style="font-weight:700;margin-bottom:12px;font-size:0.95rem">💳 طريقة الدفع:</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${methods.map(m=>`
        <div class="checkout-method" id="method-${m.id}" onclick="selectPaymentMethod('${m.id}')">
          <div style="width:42px;height:42px;border-radius:50%;background:${m.bg};color:${m.color};display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">${m.icon}</div>
          <div style="flex:1">
            <div style="font-weight:800;margin-bottom:3px">${m.name}</div>
            <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5">${m.detail||""}</div>
          </div>
          <div id="check-${m.id}" style="width:22px;height:22px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:0.8rem;flex-shrink:0"></div>
        </div>`).join("")}
    </div>

    <!-- زرار الإرسال -->
    <div id="checkoutWhatsappBtn" style="margin-top:18px;display:none">
      <button class="btn btn-gold" style="width:100%;justify-content:center;font-size:0.95rem;padding:13px" onclick="sendOrderWhatsapp()">
        💬 إرسال الطلب على واتساب
      </button>
      <p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:8px">ستنتقل لواتساب لإتمام الطلب وإرسال إيصال الدفع</p>
    </div>`;

  window._checkoutData = { total, orderLines, whatsapp, methods };
  selectedMethod = null;
}

function selectPaymentMethod(id) {
  selectedMethod = id;
  document.querySelectorAll(".checkout-method").forEach(m => m.classList.remove("selected"));
  document.querySelectorAll("[id^='check-']").forEach(c => { c.innerHTML=""; c.style.borderColor="var(--border)"; });
  const el = document.getElementById("method-"+id);
  const check = document.getElementById("check-"+id);
  if (el) el.classList.add("selected");
  if (check) { check.innerHTML="✓"; check.style.borderColor="var(--accent-gold)"; check.style.color="var(--accent-gold)"; }
  document.getElementById("checkoutWhatsappBtn").style.display="block";
}

async function sendOrderWhatsapp() {
  if (!selectedMethod || !window._checkoutData) return;
  const { total, orderLines, whatsapp, methods } = window._checkoutData;
  const method = methods.find(m=>m.id===selectedMethod);
  if (!method) return;

  // ── التحقق من بيانات العميل ──────────────────────────────────
  const name    = document.getElementById("coName")?.value.trim();
  const phone   = document.getElementById("coPhone")?.value.trim();
  const gov     = document.getElementById("coGov")?.value;
  const city    = document.getElementById("coCity")?.value.trim();
  const street  = document.getElementById("coStreet")?.value.trim();
  const landmark= document.getElementById("coLandmark")?.value.trim();

  if (!name)   { showToast("من فضلك أدخل اسمك الكامل", "error"); document.getElementById("coName").focus(); return; }
  if (!phone)  { showToast("من فضلك أدخل رقم الهاتف", "error"); document.getElementById("coPhone").focus(); return; }
  if (!gov)    { showToast("من فضلك اختر المحافظة", "error"); document.getElementById("coGov").focus(); return; }
  if (!city)   { showToast("من فضلك أدخل المدينة أو المركز", "error"); document.getElementById("coCity").focus(); return; }
  if (!street) { showToast("من فضلك أدخل العنوان بالتفصيل", "error"); document.getElementById("coStreet").focus(); return; }

  const btn = document.querySelector("#checkoutWhatsappBtn button");
  if (btn) { btn.textContent="⏳ جاري الحفظ..."; btn.disabled=true; }

  // ── حفظ الطلب في الـ DB ──────────────────────────────────────
  let orderNumber = "";
  try {
    const res = await api.post("/orders", {
      items: cart.map(i=>({ productId:i._id, name:i.name, price:i.price, qty:i.qty, image:i.image })),
      total,
      paymentMethod: method.id,
      paymentMethodName: method.name,
      customerName: name,
      customerPhone: phone,
      customerAddress: { governorate: gov, city, street, landmark },
    });
    orderNumber = res.orderNumber;
  } catch (err) {
    showToast(err.message || "حصل خطأ أثناء الحفظ", "error");
    if (btn) { btn.textContent="💬 إرسال الطلب على واتساب"; btn.disabled=false; }
    return;
  }

  // ── رسالة واتساب ──────────────────────────────────────────────
  const addressLine = `${gov}، ${city}، ${street}${landmark ? "، " + landmark : ""}`;
  const isCOD = method.id === "cod";

  const msg = `🛍️ *طلب جديد - على ضمانتي*\n`
    + (orderNumber ? `📋 *رقم الطلب:* ${orderNumber}\n` : "")
    + `\n👤 *بيانات العميل:*\n`
    + `• الاسم: ${name}\n`
    + `• الهاتف: ${phone}\n`
    + `• العنوان: ${addressLine}\n`
    + `\n📦 *المنتجات:*\n${orderLines}\n\n`
    + `💰 *الإجمالي:* ${total} جنيه\n\n`
    + `💳 *طريقة الدفع:* ${method.name}\n`
    + (isCOD
        ? `✅ الدفع عند الاستلام`
        : `📌 *التفاصيل:* ${method.detail}\n\n⬆️ من فضلك أرسل صورة إيصال الدفع بعد التحويل`);

  window.open(whatsappLink(whatsapp, msg), "_blank");
  closeCheckout(); closeCart(); clearCart();
  showToast(`تم إرسال الطلب ${orderNumber} ✅`, "success");
}

// ===== PAYMENT SECTION =====
function renderPaymentSection(payment) {
  const grid = document.getElementById("paymentGrid");
  if (!grid) return;
  const methods = [
    { v:payment.vodafoneCash, icon:"📱", name:"فودافون كاش", color:"#e60000", bg:"rgba(230,0,0,0.1)",
      render: v => `<div class="payment-number">${v.number}</div><div class="payment-holder">${v.name}</div>` },
    { v:payment.etisalatCash, icon:"📲", name:"اتصالات كاش", color:"#ff6600", bg:"rgba(255,102,0,0.1)",
      render: v => `<div class="payment-number">${v.number}</div><div class="payment-holder">${v.name}</div>` },
    { v:payment.fawry, icon:"🏪", name:"فوري", color:"#f5a623", bg:"rgba(245,166,35,0.1)",
      render: v => `<div class="payment-number" style="font-size:.9rem">كود: ${v.code}</div><div class="payment-instructions">${v.instructions_ar}</div>` },
    { v:payment.instaPay, icon:"💳", name:"إنستا باي", color:"#7c3aed", bg:"rgba(124,58,237,0.1)",
      render: v => {
        const urlMatch = (v.instructions_ar||"").match(/https?:\/\/\S+/);
        const url = urlMatch ? urlMatch[0] : null;
        const text = (v.instructions_ar||"").replace(/https?:\/\/\S+/g,"").replace(/—/g,"").trim();
        return `<div class="payment-number" style="font-size:.9rem">@${v.username}</div>
          ${text?`<div class="payment-instructions">${text}</div>`:""}
          ${url?`<a href="${url}" target="_blank" class="instapay-link-btn">💳 ادفع الآن</a>`:""}`;
      }
    },
  ];
  grid.innerHTML = methods.filter(m=>m.v?.isActive).map(m=>`
    <div class="payment-card">
      <div class="payment-icon" style="background:${m.bg};color:${m.color}">${m.icon}</div>
      <div class="payment-name">${m.name}</div>
      ${m.render(m.v)}
    </div>`).join("");
}

// ===== PAGINATION =====
function renderPagination(res) {
  const el = document.getElementById("productsPagination");
  if (!el || res.pages <= 1) { if(el) el.innerHTML=""; return; }
  let btns = "";
  for (let i=1; i<=res.pages; i++) btns+=`<button class="filter-btn ${i===res.page?"active":""}" onclick="loadProducts(${i})">${i}</button>`;
  el.innerHTML=`<div style="display:flex;justify-content:center;gap:8px;margin-top:32px">${btns}</div>`;
}


// ===== FILTERS =====
function toggleFilters() {
  const bar = document.getElementById("filterBar");
  if (bar) bar.style.display = bar.style.display === "none" ? "block" : "none";
}

let filterTimer;
function applyFilters() {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => loadProducts(1), 500);
}

function resetFilters() {
  const sort = document.getElementById("sortSelect");
  const min = document.getElementById("priceMin");
  const max = document.getElementById("priceMax");
  if (sort) sort.value = "";
  if (min) min.value = "";
  if (max) max.value = "";
  loadProducts(1);
}

// ===== WISHLIST =====
function toggleWishlist(productId) {
  const idx = wishlist.findIndex(i => String(i._id) === String(productId));
  const product = products.find(p => String(p._id) === String(productId));
  if (!product) return;

  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast("تم الإزالة من قائمة الأمنيات", "info");
  } else {
    wishlist.push({ _id: product._id, name: product.name_ar, price: product.price, image: product.images?.[0] || "", category: product.category?.name_ar || "" });
    showToast("تم الإضافة لقائمة الأمنيات ❤️", "success");
  }

  localStorage.setItem("shop_wishlist", JSON.stringify(wishlist));
  updateWishlistBadge();

  const btn = document.getElementById("wishbtn-" + productId);
  if (btn) {
    const inWish = wishlist.find(i => String(i._id) === String(productId));
    btn.textContent = inWish ? "❤️" : "🤍";
    btn.classList.toggle("active", !!inWish);
  }
}

function updateWishlistBadge() {
  const badge = document.getElementById("wishlistBadge");
  if (badge) { badge.textContent = wishlist.length; badge.style.display = wishlist.length > 0 ? "flex" : "none"; }
}

function openWishlist() {
  renderWishlistPanel();
  document.getElementById("wishlistPanel")?.classList.add("open");
  document.getElementById("wishlistOverlay")?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeWishlist() {
  document.getElementById("wishlistPanel")?.classList.remove("open");
  document.getElementById("wishlistOverlay")?.classList.remove("active");
  document.body.style.overflow = "";
}

function renderWishlistPanel() {
  const el = document.getElementById("wishlistItems");
  if (!el) return;

  if (!wishlist.length) {
    el.innerHTML = `<div class="empty-state" style="padding:40px">
      <div class="empty-state-icon">🤍</div>
      <h3>قائمة الأمنيات فارغة</h3>
      <p>اضغط على 🤍 على أي منتج لإضافته</p>
    </div>`;
    return;
  }

  el.innerHTML = wishlist.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image ? `<img src="${item.image}" alt="">` : `<span style="font-size:1.4rem">📦</span>`}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="action-btn" style="background:rgba(201,168,76,0.1);color:var(--accent-gold);border:1px solid rgba(201,168,76,0.2);width:32px;height:32px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;cursor:pointer"
          onclick="moveToCart('${item._id}')">🛒</button>
        <button class="cart-item-remove" onclick="removeFromWishlist('${item._id}')">✕</button>
      </div>
    </div>`).join("");
}

function removeFromWishlist(id) {
  wishlist = wishlist.filter(i => String(i._id) !== String(id));
  localStorage.setItem("shop_wishlist", JSON.stringify(wishlist));
  updateWishlistBadge();
  renderWishlistPanel();
  const btn = document.getElementById("wishbtn-" + id);
  if (btn) { btn.textContent = "🤍"; btn.classList.remove("active"); }
}

function moveToCart(id) {
  const item = wishlist.find(i => String(i._id) === String(id));
  if (!item) return;
  const inCart = cart.find(c => String(c._id) === String(id));
  if (!inCart) {
    cart.push({ _id: item._id, name: item.name, price: item.price, qty: 1, image: item.image });
    saveCart();
    updateCartBadge();
  }
  removeFromWishlist(id);
  closeWishlist();
  openCart();
  showToast("تم نقله للسلة 🛒", "success");
}

// ===== SEARCH =====
let searchTimer;

// ===== DOM READY =====
document.addEventListener("DOMContentLoaded", () => {
  renderCategoriesSkeleton();

  document.getElementById("navSearch")?.addEventListener("input", e => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    searchTimer = setTimeout(async () => {
      if (!q) { loadProducts(1); return; }
      try {
        renderProductsSkeleton();
        const res = await api.get(`/products?search=${encodeURIComponent(q)}&active=true&limit=20`);
        renderProducts(res.products);
      } catch {}
    }, 400);
  });

  window.addEventListener("scroll", () => {
    document.getElementById("navbar")?.classList.toggle("scrolled", window.scrollY > 50);
  });

  document.querySelectorAll('.modal-overlay, .product-detail-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if(e.target===overlay) { overlay.classList.remove('active'); document.body.style.overflow=""; } });
  });

  init();
});