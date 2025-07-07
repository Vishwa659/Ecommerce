async function getProducts() {
  const response = await fetch('http://localhost:3001/products');
  const data = await response.json();

  const productsDiv = document.getElementById('products');
  productsDiv.innerHTML = '';

  data.forEach(product => {
    productsDiv.innerHTML += `
      <p><strong>${product.name}</strong> - $${product.price}</p>
    `;
  });
}
