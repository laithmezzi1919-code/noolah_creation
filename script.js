const products = [
  {
    id: 1,
    name: 'The Dune Set',
    category: 'Set',
    price: 120,
    imageClass: 'first',
    description: 'Soft layering essentials in warm sand, oat, and cocoa tones.'
  },
  {
    id: 2,
    name: 'Velvet Drift',
    category: 'Wrap',
    price: 88,
    imageClass: 'second',
    description: 'A textured statement layer designed for movement and warmth.'
  },
  {
    id: 3,
    name: 'Harvest Tones',
    category: 'Edition',
    price: 95,
    imageClass: 'third',
    description: 'Limited color stories inspired by quiet mornings and golden light.'
  },
  {
    id: 4,
    name: 'Golden Hour',
    category: 'Accessory',
    price: 64,
    imageClass: 'fourth',
    description: 'A soft statement accent for elevated day-to-day styling.'
  },
  {
    id: 5,
    name: 'Sienna Flow',
    category: 'Layer',
    price: 110,
    imageClass: 'fifth',
    description: 'Minimal, warm, and beautifully balanced for all-season wear.'
  },
  {
    id: 6,
    name: 'Mila Essentials',
    category: 'Gift Box',
    price: 140,
    imageClass: 'sixth',
    description: 'An elegant gift set for meaningful moments and thoughtful giving.'
  }
];

const cart = [];
const productGrid = document.getElementById('product-grid');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalLabel = document.getElementById('cart-total-label');
const subtotalPrice = document.getElementById('subtotal-price');
const totalPrice = document.getElementById('total-price');
const form = document.getElementById('checkout-form');
const formMessage = document.getElementById('form-message');
const paymentInputs = document.querySelectorAll('input[name="paymentMethod"]');
const cardField = document.getElementById('card-field');

const DELIVERY_FEE = 15;

function getApiUrl() {
  const candidateOrigin = window.NOOLAH_API_URL || window.location.origin;

  if (window.location.protocol === 'file:') {
    return 'http://localhost:3001/api/orders';
  }

  return new URL('/api/orders', candidateOrigin).toString();
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return { error: 'The server returned an empty response.' };
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      error: text.length > 120 ? `${text.slice(0, 120)}...` : text
    };
  }
}

function renderProducts() {
  productGrid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-image ${product.imageClass}"></div>
          <div class="product-body">
            <div class="product-topline">
              <span>${product.category}</span>
              <span>${product.id}</span>
            </div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-actions">
              <span class="product-price">$${product.price}</span>
              <button class="add-btn" type="button" data-id="${product.id}">Add</button>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('.add-btn').forEach((button) => {
    button.addEventListener('click', () => addToCart(Number(button.dataset.id)));
  });
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
    cartCount.textContent = '0';
    cartTotalLabel.textContent = '0 items';
    subtotalPrice.textContent = '$0';
    totalPrice.textContent = '$15';
    return;
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <strong>${item.name}</strong>
            <span>$${item.price} each</span>
          </div>
          <div class="cart-item-controls">
            <button class="qty-btn" type="button" data-action="decrease" data-id="${item.id}">-</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" type="button" data-action="increase" data-id="${item.id}">+</button>
          </div>
        </div>
      `
    )
    .join('');

  cartCount.textContent = String(totalItems);
  cartTotalLabel.textContent = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
  subtotalPrice.textContent = `$${subtotal}`;
  totalPrice.textContent = `$${total}`;

  document.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => updateQuantity(Number(button.dataset.id), button.dataset.action));
  });
}

function updateQuantity(productId, action) {
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;

  if (action === 'increase') {
    item.quantity += 1;
  } else if (action === 'decrease') {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      const index = cart.findIndex((entry) => entry.id === productId);
      cart.splice(index, 1);
    }
  }

  renderCart();
}

function toggleCardField() {
  const selected = document.querySelector('input[name="paymentMethod"]:checked')?.value;
  if (selected === 'visa') {
    cardField.classList.add('visible');
    cardField.querySelector('input').setAttribute('required', 'required');
  } else {
    cardField.classList.remove('visible');
    const input = cardField.querySelector('input');
    input.removeAttribute('required');
    input.value = '';
  }
}

paymentInputs.forEach((input) => {
  input.addEventListener('change', toggleCardField);
});

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  if (cart.length === 0) {
    formMessage.textContent = 'Please add at least one product before placing your order.';
    formMessage.className = 'form-message error';
    return;
  }

  const formData = new FormData(form);
  const payload = {
    customer: {
      fullName: formData.get('fullName'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      city: formData.get('city'),
      area: formData.get('area'),
      postalCode: formData.get('postalCode'),
      address: formData.get('address'),
      notes: formData.get('notes') || ''
    },
    paymentMethod: formData.get('paymentMethod'),
    cardNumber: formData.get('cardNumber') || '',
    deliveryFee: DELIVERY_FEE,
    items: cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  };

  formMessage.textContent = 'Submitting your order...';
  formMessage.className = 'form-message';

  try {
    const apiUrl = getApiUrl();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(result.error || 'Unable to place order.');
    }

    formMessage.textContent = result.message || 'Order placed successfully.';
    formMessage.className = 'form-message success';

    form.reset();
    cart.length = 0;
    renderCart();
    toggleCardField();
  } catch (error) {
    const message = error instanceof Error && error.message === 'Failed to fetch'
      ? 'The order service is unavailable. Start the app server and try again.'
      : error.message || 'Something went wrong. Please try again.';

    formMessage.textContent = message;
    formMessage.className = 'form-message error';
  }
});

renderProducts();
renderCart();
toggleCardField();
