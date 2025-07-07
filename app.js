const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const dbPath = path.join(__dirname, 'ecommerce.db')
const app = express()

app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(3001, () => {
      console.log('Server Running at http://localhost:3001/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(-1)
  }
}
initializeDBAndServer()

function authenticateToken(request, response, next) {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401).send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401).send('Invalid JWT Token')
      } else {
        request.user = payload; 
        next();
      }
    })
  }
}
app.get('/products', authenticateToken, async (request, response) => {
  try {
    const productsQuery = `SELECT * FROM products;`;
    const products = await db.all(productsQuery);
    response.json(products);
  } catch (error) {
    response.status(500).send('Error fetching products');
  }
});

app.get('/cart', authenticateToken, async (request, response) => {
  try {
    const { id } = request.user;
    const getCartQuery = `
      SELECT cart.id, products.name, products.price, cart.quantity
      FROM cart
      JOIN products ON cart.product_id = products.id
      WHERE cart.user_id = ?;
    `;
    const cartItems = await db.all(getCartQuery, [id]);
    response.json(cartItems);
  } catch (error) {
    response.status(500).send('Error fetching cart');
  }
});

app.put('/cart/:id', authenticateToken, async (request, response) => {
  try {
    const { id: cartId } = request.params;
    const { quantity } = request.body;
    const updateQuery = `
      UPDATE cart
      SET quantity = ?
      WHERE id = ?;
    `;
    await db.run(updateQuery, [quantity, cartId]);
    response.send('✅ Cart item quantity updated successfully');
  } catch (error) {
    response.status(500).send('Error updating cart item');
  }
});

app.delete('/cart/:id', authenticateToken, async (request, response) => {
  try {
    const { id: cartId } = request.params;
    const deleteQuery = `
      DELETE FROM cart
      WHERE id = ?;
    `;
    await db.run(deleteQuery, [cartId]);
    response.send('✅ Cart item removed successfully');
  } catch (error) {
    response.status(500).send('Error removing cart item');
  }
});

app.post('/cart', authenticateToken, async (request, response) => {
  try {
    const { product_id, quantity } = request.body;
    const { id: user_id } = request.user;

    const insertQuery = `
      INSERT INTO cart (user_id, product_id, quantity)
      VALUES (?, ?, ?);
    `;
    await db.run(insertQuery, [user_id, product_id, quantity]);
    response.send('✅ Item added to cart successfully');
  } catch (error) {
    console.error('❌ Error adding item to cart:', error.message);
    response.status(500).send('Error adding item to cart');
  }
});

module.exports = app
