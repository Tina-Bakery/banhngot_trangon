// ======================================
// 🌸 TINA BAKERY – SCRIPT TOÀN HỆ THỐNG
// ======================================

// 🔹 CẤU HÌNH CHUNG
const CART_KEY = "cart"; // ✅ đồng bộ toàn trang
const ORDER_KEY = "tb_orders";

// 🔸 HÀM TIỆN ÍCH CHUNG
const read = (k) => {
    try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const formatVND = (n) => (n || 0).toLocaleString("vi-VN") + " ₫";

// 🔹 TOAST THÔNG BÁO ĐẸP
function showToast(msg, type = "success") {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

// 🔹 CẬP NHẬT SỐ TRÊN ICON GIỎ
function updateCartCount() {
    const count = read(CART_KEY).reduce((a, b) => a + (b.qty || 1), 0);
    document.querySelectorAll("#cartCount").forEach((e) => (e.textContent = count));
}

// ================================
// 🍰 GIỎ HÀNG
// ================================
function addToCart(name, price, img) {
    let cart = read(CART_KEY);
    const found = cart.find((i) => i.name === name);
    if (found) found.qty++;
    else cart.push({ name, price, img, qty: 1 });
    save(CART_KEY, cart);
    updateCartCount();
    showToast(`🧁 Đã thêm "${name}" vào giỏ hàng!`);
}

function renderCart() {
    const tbody = document.querySelector("#cartBody");
    if (!tbody) return;

    let cart = read(CART_KEY);
    tbody.innerHTML = "";
    let total = 0;

    cart.forEach((i, x) => {
        let s = i.price * i.qty;
        total += s;
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${i.name}</td>
      <td>${formatVND(i.price)}</td>
      <td>
        <button class="qty-btn" onclick="chg(${x}, -1)">−</button>
        <span>${i.qty}</span>
        <button class="qty-btn" onclick="chg(${x}, 1)">+</button>
      </td>
      <td>${formatVND(s)}</td>
      <td><button class="del-btn" onclick="del(${x})">Xóa</button></td>
    `;
        row.classList.add("fade-in");
        tbody.appendChild(row);
    });

    document.querySelector("#cartTotal").textContent = formatVND(total);
}

function chg(i, d) {
    let cart = read(CART_KEY);
    cart[i].qty = Math.max(1, cart[i].qty + d);
    save(CART_KEY, cart);
    renderCart();
    updateCartCount();

    const rows = document.querySelectorAll("#cartBody tr");
    if (rows[i]) {
        rows[i].classList.add("shake");
        setTimeout(() => rows[i].classList.remove("shake"), 400);
    }
}

function del(i) {
    let cart = read(CART_KEY);
    if (!confirm("❌ Bạn có chắc muốn xóa sản phẩm này?")) return;
    const item = cart[i].name;
    cart.splice(i, 1);
    save(CART_KEY, cart);
    renderCart();
    updateCartCount();
    showToast(`Đã xóa ${item} khỏi giỏ hàng`, "error");
}

// ================================
// 💳 THANH TOÁN
// ================================
function renderOrderSummary() {
    const orderDiv = document.getElementById("order-summary");
    if (!orderDiv) return;
    const cart = read(CART_KEY);
    if (!cart.length) {
        orderDiv.innerHTML = "<p>Không có sản phẩm nào trong giỏ hàng 🍰</p>";
        return;
    }

    let total = 0;
    let html = "<ul>";
    cart.forEach((i) => {
        const sum = i.price * i.qty;
        total += sum;
        html += `<li>${i.name} × ${i.qty} — ${formatVND(sum)}</li>`;
    });
    html += `</ul><p><strong>Tổng cộng:</strong> ${formatVND(total)}</p>`;
    orderDiv.innerHTML = html;
}

function handleCheckout() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = form.fullname.value.trim();
        const phone = form.phone.value.trim();
        const addr = form.address.value.trim();

        if (!name || !phone || !addr) {
            showToast("⚠️ Vui lòng nhập đầy đủ thông tin!", "error");
            return;
        }

        const cart = read(CART_KEY);
        if (!cart.length) {
            showToast("🛒 Giỏ hàng trống!", "error");
            return;
        }

        const loader = document.createElement("div");
        loader.className = "loader";
        loader.innerHTML = "🧁<span>Đang xử lý đơn hàng...</span>";
        document.body.appendChild(loader);

        setTimeout(() => {
            loader.remove();

            const order = {
                id: "TB" + Date.now(),
                at: new Date().toLocaleString("vi-VN"),
                name,
                phone,
                addr,
                items: cart,
                total: cart.reduce((s, i) => s + i.price * i.qty, 0),
                status: "Đang xử lý",
            };

            const orders = read(ORDER_KEY);
            orders.push(order);
            save(ORDER_KEY, orders);
            localStorage.removeItem(CART_KEY);
            updateCartCount();

            const popup = document.getElementById("popup");
            if (popup) {
                popup.querySelector("h3").textContent = `🎉 Cảm ơn ${name}!`;
                popup.querySelector("p").innerHTML = `
          Mã đơn: <strong>${order.id}</strong><br>
          Tổng tiền: <strong>${formatVND(order.total)}</strong><br><br>
          Giao đến: <em>${addr}</em>
        `;
                popup.classList.add("show");
            }
            showToast("🎂 Đặt hàng thành công!");
        }, 1500);
    });
}

function closePopup() {
    const popup = document.getElementById("popup");
    if (popup) popup.classList.remove("show");
    window.location.href = "index.html";
}

// ================================
// 📜 LỊCH SỬ ĐƠN HÀNG
// ================================
function renderOrders() {
    const wrap = document.querySelector("#ordersWrap");
    if (!wrap) return;
    const orders = read(ORDER_KEY);
    wrap.innerHTML = "";
    orders.forEach((o) => {
        const items = o.items.map((i) => `${i.name} (${i.qty})`).join(", ");
        wrap.innerHTML += `
      <tr class="fade-in">
        <td>${o.id}</td>
        <td>${o.at}</td>
        <td>${o.name}</td>
        <td>${o.phone}</td>
        <td>${o.addr}</td>
        <td>${items}</td>
        <td>${formatVND(o.total)}</td>
        <td>${o.status}</td>
      </tr>
    `;
    });
}

// ================================
// 💌 LIÊN HỆ
// ================================
function sendMsg() {
    showToast("💌 Cảm ơn bạn đã gửi tin nhắn! Chúng tôi sẽ phản hồi sớm.", "success");
    document.querySelectorAll(".contact-form input, .contact-form textarea")
        .forEach((el) => (el.value = ""));
}

// ================================
// 🌿 HIỆU ỨNG SCROLL + TUYẾT GIÁNG SINH
// ================================
function initScrollAnimations() {
    const elements = document.querySelectorAll(".fade-in, .zoom-in");
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add("visible");
        });
    }, { threshold: 0.2 });
    elements.forEach(el => observer.observe(el));
}

// ❄️ CHỈ GIÁNG SINH MỚI CÓ TUYẾT
function initSnowEffect() {
    if (!window.location.pathname.includes("giangsinh.html")) return; // ✅ chỉ chạy trên trang Giáng Sinh
    const snowContainer = document.createElement('div');
    snowContainer.classList.add('snow-container');
    document.body.appendChild(snowContainer);

    function createSnowflake() {
        const s = document.createElement('span');
        s.classList.add('snowflake');
        s.textContent = '❄';
        s.style.left = Math.random() * 100 + 'vw';
        s.style.animationDuration = 4 + Math.random() * 6 + 's';
        s.style.fontSize = 12 + Math.random() * 14 + 'px';
        s.style.opacity = Math.random();
        snowContainer.appendChild(s);
        setTimeout(() => s.remove(), 10000);
    }

    setInterval(createSnowflake, 200);
}

// ================================
// 🚀 KHỞI CHẠY TOÀN BỘ
// ================================
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    renderCart();
    renderOrderSummary();
    renderOrders();
    handleCheckout();
    initScrollAnimations();
    initSnowEffect(); // ✅ chỉ tuyết ở Giáng Sinh

    document.querySelectorAll(".add-to-cart").forEach(btn => {
        btn.addEventListener("click", () => {
            addToCart(btn.dataset.name, parseInt(btn.dataset.price), btn.dataset.img);
        });
    });
});