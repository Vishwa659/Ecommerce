document.addEventListener('DOMContentLoaded', getCart);

async function getCart() {
  const token = localStorage.getItem('jwtToken'); 
  if (!token) {
    alert('Please login first.');
    window.location.href = 'login.html'; 
    return;
  }

  const response = await fetch('http://localhost:3001/cart', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const cartItems = await response.json();

  const cartDiv = document.getElementById('cart');
  cartDiv.innerHTML = '';

  cartItems.forEach(item => {
    cartDiv.innerHTML += `
      <div class="cart-item">
        <p><strong>${item.name}</strong> - ₹${item.price}</p>
        <p>Quantity: ${item.quantity}</p>
        <button onclick="removeItem(${item.id})">Remove</button>
        <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
        <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
        <button onclick="buyItem(${item.id})">Buy</button>
      </div>
    `;
  });
}

async function removeItem(id) {
  const token = localStorage.getItem('jwtToken');

  const res = await fetch(`http://localhost:3001/cart/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.text();
  alert(data);
  getCart(); 
}

async function updateQuantity(id, quantity) {
  if (quantity <= 0) {
    removeItem(id);
    return;
  }

  const token = localStorage.getItem('jwtToken');

  const res = await fetch(`http://localhost:3001/cart/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ quantity })
  });

  const data = await res.text();
  alert(data);
  getCart(); 
}

function buyItem(id) {
  alert(`Buying item with id ${id}. Implement order creation here.`);
}
