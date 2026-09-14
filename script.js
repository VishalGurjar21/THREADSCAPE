/* ==========================================================
   ThreadScape — script.js
   Handles: Add to Cart, nav cart badge, and the cart page UI.
   Cart data is persisted in localStorage under "threadscape_cart".
   No HTML changes needed on index.html — cards are detected
   automatically. cart.html just needs a <div id="cart-app"></div>.
   ========================================================== */

(function () {
  const CART_KEY = "threadscape_cart";

  /* ---------------- Cart data helpers ---------------- */

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function parsePrice(text) {
    const cleaned = String(text).replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  }

  function formatPrice(num) {
    return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function addToCart(item) {
    if (!item.name || item.price <= 0) return;
    const cart = getCart();
    const existing = cart.find((p) => p.name === item.name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    saveCart(cart);
    showToast(item.name + " added to cart");
  }

  function removeFromCart(name) {
    saveCart(getCart().filter((p) => p.name !== name));
    renderCartPage();
  }

  function changeQty(name, delta) {
    const cart = getCart();
    const item = cart.find((p) => p.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(name);
      return;
    }
    saveCart(cart);
    renderCartPage();
  }

  function clearCart() {
    saveCart([]);
    renderCartPage();
  }

  function cartTotal() {
    return getCart().reduce((sum, p) => sum + p.price * p.qty, 0);
  }

  function cartCount() {
    return getCart().reduce((sum, p) => sum + p.qty, 0);
  }

  /* ---------------- Toast notification ---------------- */

  let toastTimer = null;
  function showToast(message) {
    let toast = document.getElementById("ts-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "ts-toast";
      Object.assign(toast.style, {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: "#222",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "8px",
        fontSize: "14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        zIndex: "9999",
        opacity: "0",
        transition: "opacity 0.25s ease",
        pointerEvents: "none",
      });
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    clearTimeout(toastTimer);
    requestAnimationFrame(() => (toast.style.opacity = "1"));
    toastTimer = setTimeout(() => {
      toast.style.opacity = "0";
    }, 2000);
  }

  /* ---------------- Nav cart link + badge ---------------- */

  function updateCartBadge() {
    document.querySelectorAll(".ts-cart-link").forEach((link) => {
      let badge = link.querySelector(".ts-cart-badge");
      const count = cartCount();
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "ts-cart-badge";
        Object.assign(badge.style, {
          display: "inline-block",
          minWidth: "16px",
          padding: "0 5px",
          marginLeft: "4px",
          fontSize: "11px",
          lineHeight: "16px",
          textAlign: "center",
          borderRadius: "999px",
          background: "#e63946",
          color: "#fff",
          verticalAlign: "top",
        });
        link.appendChild(badge);
      }
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-block" : "none";
    });
  }

  function wireNavCartLink() {
    document.querySelectorAll("nav a").forEach((a) => {
      if (a.querySelector(".fa-cart-shopping")) {
        a.href = "cart.html";
        a.classList.add("ts-cart-link");
      }
    });
    updateCartBadge();
  }

  /* ---------------- Product card wiring (index.html) ---------------- */

  function extractProductFromCard(card) {
    const name = (card.querySelector("h1") || {}).textContent?.trim() || "Product";
    const priceEl = card.querySelector("p");
    const price = priceEl ? parsePrice(priceEl.textContent) : 0;
    const image = card.querySelector("img")?.getAttribute("src") || "";
    return { name, price, image };
  }

  function wireProductCards() {
    const buttons = Array.from(document.querySelectorAll("button")).filter(
      (b) => b.textContent.trim().toLowerCase() === "buy now"
    );

    buttons.forEach((btn) => {
      const card = btn.closest("div");
      if (!card) return;
      const product = extractProductFromCard(card);

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        addToCart(product);
      });

      const cartIcon = card.querySelector(".fa-cart-shopping");
      if (cartIcon) {
        cartIcon.style.cursor = "pointer";
        cartIcon.addEventListener("click", (e) => {
          e.preventDefault();
          addToCart(product);
        });
      }
    });
  }

  /* ---------------- Cart page rendering (cart.html) ---------------- */

  function renderCartPage() {
    const app = document.getElementById("cart-app");
    if (!app) return;

    const cart = getCart();
    app.innerHTML = "";

    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, { maxWidth: "900px", margin: "40px auto", padding: "0 20px" });

    const heading = document.createElement("h1");
    heading.textContent = "Your Cart";
    wrapper.appendChild(heading);

    if (cart.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Your cart is empty.";
      wrapper.appendChild(empty);

      const backLink = document.createElement("a");
      backLink.href = "index.html";
      backLink.textContent = "Continue Shopping";
      Object.assign(backLink.style, {
        display: "inline-block",
        marginTop: "12px",
        padding: "10px 18px",
        background: "#222",
        color: "#fff",
        textDecoration: "none",
        borderRadius: "6px",
      });
      wrapper.appendChild(backLink);
      app.appendChild(wrapper);
      return;
    }

    const list = document.createElement("div");
    Object.assign(list.style, { display: "flex", flexDirection: "column", gap: "16px" });

    cart.forEach((item) => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "12px",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
        flexWrap: "wrap",
      });

      const img = document.createElement("img");
      img.src = item.image;
      Object.assign(img.style, { width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px" });

      const info = document.createElement("div");
      info.style.flex = "1";
      info.style.minWidth = "150px";
      info.innerHTML = `<strong>${item.name}</strong><br><span>${formatPrice(item.price)} each</span>`;

      const qtyBox = document.createElement("div");
      Object.assign(qtyBox.style, { display: "flex", alignItems: "center", gap: "8px" });

      const minusBtn = document.createElement("button");
      minusBtn.textContent = "−";
      const qtySpan = document.createElement("span");
      qtySpan.textContent = item.qty;
      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+";
      [minusBtn, plusBtn].forEach((b) =>
        Object.assign(b.style, {
          width: "28px",
          height: "28px",
          border: "1px solid #ccc",
          background: "#fff",
          borderRadius: "4px",
          cursor: "pointer",
        })
      );
      minusBtn.addEventListener("click", () => changeQty(item.name, -1));
      plusBtn.addEventListener("click", () => changeQty(item.name, 1));
      qtyBox.append(minusBtn, qtySpan, plusBtn);

      const subtotal = document.createElement("div");
      Object.assign(subtotal.style, { minWidth: "100px", textAlign: "right", fontWeight: "600" });
      subtotal.textContent = formatPrice(item.price * item.qty);

      const removeBtn = document.createElement("button");
      removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
      Object.assign(removeBtn.style, {
        background: "none",
        border: "none",
        color: "#e63946",
        cursor: "pointer",
        fontSize: "16px",
      });
      removeBtn.addEventListener("click", () => removeFromCart(item.name));

      row.append(img, info, qtyBox, subtotal, removeBtn);
      list.appendChild(row);
    });

    wrapper.appendChild(list);

    const summary = document.createElement("div");
    Object.assign(summary.style, {
      marginTop: "24px",
      paddingTop: "16px",
      borderTop: "2px solid #222",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "12px",
    });

    const totalText = document.createElement("h2");
    totalText.textContent = "Total: " + formatPrice(cartTotal());

    const actions = document.createElement("div");
    Object.assign(actions.style, { display: "flex", gap: "10px" });

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear Cart";
    Object.assign(clearBtn.style, {
      padding: "10px 16px",
      background: "#fff",
      border: "1px solid #222",
      borderRadius: "6px",
      cursor: "pointer",
    });
    clearBtn.addEventListener("click", clearCart);

    const checkoutBtn = document.createElement("button");
    checkoutBtn.textContent = "Checkout";
    Object.assign(checkoutBtn.style, {
      padding: "10px 16px",
      background: "#222",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    });
    checkoutBtn.addEventListener("click", () => {
      alert("Checkout isn't wired up to a payment gateway yet. Thanks for shopping with ThreadScape!");
    });

    actions.append(clearBtn, checkoutBtn);
    summary.append(totalText, actions);
    wrapper.appendChild(summary);

    app.appendChild(wrapper);
  }

  /* ---------------- Init ---------------- */

  document.addEventListener("DOMContentLoaded", () => {
    wireNavCartLink();
    wireProductCards();
    renderCartPage();
  });
})();
