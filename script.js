const CHARCOAL_IMG = 'images/charcoal.png';
const SAGE_IMG = 'images/sage.png';

let state = {
  color: 'charcoal',
  addon: true,
  qty: 1,
  items: [],
};

const PRODUCT = { id: 'sniffvault', name: 'SniffVault 4-Drawer Timed Dog Puzzle', price: 79 };
const ADDON = { id: 'silicone-insert', name: 'Silicone Link Insert', price: 14 };

function updateColorImage() {
  const img = document.getElementById('main-img');
  img.src = CHARCOAL_IMG;
  img.classList.toggle('sage-tint', state.color === 'sage');
}

function setThumb(el, src) {
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('main-img').src = src;
}

function selectColor(el, color) {
  state.color = color;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  updateColorImage();
}

function cartKey() {
  return state.color + (state.addon ? '+insert' : '');
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const badge = document.getElementById('cart-badge');
  const totalEl = document.getElementById('cart-total');
  const btn = document.getElementById('add-to-cart');

  badge.textContent = state.items.reduce((s, i) => s + i.qty, 0);

  let total = 0;
  container.innerHTML = '';
  state.items.forEach((item, idx) => {
    total += item.price * item.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${CHARCOAL_IMG}" alt="${item.name}" class="${item.color === 'sage' ? 'sage-tint' : ''}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}${item.addon ? ' + Silicone Link Insert' : ''}</div>
        <div class="cart-item-price">$${item.price} &times; ${item.qty}</div>
      </div>
      <button class="cart-item-remove" onclick="removeItem(${idx})">Remove</button>
    `;
    container.appendChild(div);
  });
  totalEl.textContent = '$' + total;

  const inCart = state.items.some(i => i.color === state.color && i.addon === state.addon);
  btn.textContent = inCart ? 'In Cart' : 'Add to Cart';
  btn.disabled = inCart;
}

function addToCart() {
  const qty = parseInt(document.getElementById('qty').value) || 1;
  const price = PRODUCT.price + (state.addon ? ADDON.price : 0);
  const key = cartKey();
  const existing = state.items.find(i => i.color === state.color && i.addon === state.addon);
  if (existing) {
    existing.qty += qty;
  } else {
    state.items.push({ ...PRODUCT, price, qty, color: state.color, addon: state.addon });
  }
  renderCart();
}

function removeItem(idx) {
  state.items.splice(idx, 1);
  renderCart();
}

function openCheckout() {
  if (state.items.length === 0) return;
  document.getElementById('cart').classList.add('hidden');
  document.getElementById('checkout').classList.remove('hidden');
}

async function placeOrder(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('checkout-msg');
  msg.textContent = 'Placing order...';
  msg.style.color = '';

  const payload = {
    name: form.name.value,
    email: form.email.value,
    address: form.address.value,
    items: state.items,
    total: state.items.reduce((s, i) => s + i.price * i.qty, 0),
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      msg.textContent = 'Order placed! Order # ' + (data.orderId || 'received');
      msg.style.color = 'var(--sage)';
      state.items = [];
      renderCart();
      form.reset();
      setTimeout(() => {
        document.getElementById('checkout').classList.add('hidden');
        document.getElementById('cart').classList.remove('hidden');
      }, 1500);
    } else {
      msg.textContent = data.error || 'Order failed';
      msg.style.color = '#c00';
    }
  } catch (err) {
    msg.textContent = 'Could not reach server';
    msg.style.color = '#c00';
  }
}

document.getElementById('add-to-cart').addEventListener('click', addToCart);
document.getElementById('checkout-btn').addEventListener('click', openCheckout);
document.getElementById('checkout-form').addEventListener('submit', placeOrder);

document.getElementById('addon').addEventListener('change', (e) => { state.addon = e.target.checked; renderCart(); });
document.getElementById('qty').addEventListener('input', (e) => { state.qty = parseInt(e.target.value) || 1; });

renderCart();
