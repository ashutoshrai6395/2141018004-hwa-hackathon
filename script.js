const CHARCOAL_IMG = 'images/charcoal.png';
const SAGE_IMG = 'images/main.png';

let state = {
  color: 'charcoal',
  colorImg: CHARCOAL_IMG,
  addon: true,
  qty: 1,
  items: [],
};

const PRODUCT = { id: 'sniffvault', name: 'SniffVault 4-Drawer Timed Dog Puzzle', price: 79 };
const ADDON = { id: 'silicone-lick-insert', name: 'Silicone Lick Insert', price: 14 };

function itemPrice(color, addon) {
  return PRODUCT.price + (addon ? ADDON.price : 0);
}

function findItemIndex(color, addon) {
  return state.items.findIndex(i => i.color === color && i.addon === addon);
}

function updateMainImage() {
  document.getElementById('main-img').src = state.colorImg;
  document.querySelectorAll('.thumb').forEach(t => {
    t.classList.toggle('active', t.dataset.src === state.colorImg);
  });
}

function setThumb(el) {
  state.colorImg = el.dataset.src;
  const color = el.dataset.src.includes('charcoal') || el.dataset.src === CHARCOAL_IMG ? 'charcoal' : 'sage';
  state.color = color;
  updateSwatches();
  updateMainImage();
  renderCart();
}

function updateSwatches() {
  document.querySelectorAll('.color-swatch').forEach(s => {
    const isSel = s.dataset.color === state.color;
    s.classList.toggle('selected', isSel);
  });
}

function selectColor(el) {
  state.color = el.dataset.color;
  state.colorImg = el.dataset.img;
  updateSwatches();
  updateMainImage();
  renderCart();
}

function cartKey() { return state.color + '|' + state.addon; }

function renderCart() {
  const container = document.getElementById('cart-items');
  const badge = document.getElementById('cart-badge');
  const totalEl = document.getElementById('cart-total');
  const btn = document.getElementById('add-to-cart');

  const totalQty = state.items.reduce((s, i) => s + i.qty, 0);
  badge.textContent = totalQty;

  let total = 0;
  container.innerHTML = '';
  state.items.forEach((item, idx) => {
    total += item.price * item.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.img || CHARCOAL_IMG}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}${item.addon ? ' + Silicone Lick Insert' : ''}</div>
        <div class="cart-item-price">$${item.price} &times; ${item.qty}</div>
        <div class="qty-controls">
          <button onclick="changeQty(${idx}, -1)">&#8722;</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${idx}, 1)">&#43;</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeItem(${idx})">Remove</button>
    `;
    container.appendChild(div);
  });
  totalEl.textContent = '$' + total;

  const inCart = findItemIndex(state.color, state.addon) >= 0;
  btn.textContent = inCart ? 'In Cart' : 'Add to Cart';
  btn.disabled = inCart;
}

function addToCart() {
  const qty = parseInt(document.getElementById('qty').value) || 1;
  const price = itemPrice(state.color, state.addon);
  const idx = findItemIndex(state.color, state.addon);
  const item = {
    ...PRODUCT,
    price,
    qty,
    color: state.color,
    addon: state.addon,
    img: state.colorImg,
  };
  if (idx >= 0) {
    state.items[idx].qty += qty;
  } else {
    state.items.push(item);
  }
  renderCart();
  openCart();
}

function changeQty(idx, delta) {
  const item = state.items[idx];
  item.qty += delta;
  if (item.qty <= 0) removeItem(idx);
  else renderCart();
}

function removeItem(idx) {
  state.items.splice(idx, 1);
  renderCart();
}

function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-drawer').setAttribute('aria-hidden', 'false');
}

function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-drawer').setAttribute('aria-hidden', 'true');
}

function openCheckout() {
  if (state.items.length === 0) return;
  closeCart();
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('checkout').classList.remove('hidden');
  document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
}

async function placeOrder(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('checkout-msg');
  msg.textContent = 'Placing order...';
  msg.style.color = '';

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    address: form.address.value.trim(),
    items: state.items.map(i => ({ name: i.name, price: i.price, qty: i.qty, color: i.color, addon: i.addon })),
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
      showConfirmation(payload, data.orderId);
    } else {
      msg.textContent = data.error || 'Order failed';
      msg.style.color = '#c00';
    }
  } catch (err) {
    msg.textContent = 'Could not reach server';
    msg.style.color = '#c00';
  }
}

function showConfirmation(payload, orderId) {
  document.getElementById('checkout').classList.add('hidden');
  document.getElementById('confirmation').classList.remove('hidden');
  document.getElementById('confirm-order-id').querySelector('span').textContent = orderId;
  const list = document.getElementById('confirm-items-list');
  list.innerHTML = '';
  payload.items.forEach(i => {
    const d = document.createElement('div');
    d.className = 'confirm-items-list-item';
    d.textContent = i.name + (i.addon ? ' + Silicone Lick Insert' : '');
    const span = document.createElement('span');
    span.textContent = '$' + i.price + ' x ' + i.qty;
    d.appendChild(span);
    list.appendChild(d);
  });
  document.getElementById('confirm-total').textContent = '$' + payload.total;
  document.getElementById('confirm-shipping').innerHTML = payload.name + '<br>' + payload.address;

  state.items = [];
  renderCart();

  document.getElementById('confirmation').scrollIntoView({ behavior: 'smooth' });
}

function continueShopping() {
  document.getElementById('confirmation').classList.add('hidden');
}

document.getElementById('add-to-cart').addEventListener('click', addToCart);
document.getElementById('checkout-btn').addEventListener('click', openCheckout);
document.getElementById('checkout-form').addEventListener('submit', placeOrder);
document.getElementById('continue-shopping').addEventListener('click', continueShopping);
document.getElementById('open-cart').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
document.getElementById('cart-backdrop').addEventListener('click', closeCart);

document.getElementById('addon').addEventListener('change', (e) => { state.addon = e.target.checked; renderCart(); });
document.getElementById('qty').addEventListener('input', (e) => { state.qty = parseInt(e.target.value) || 1; });

renderCart();