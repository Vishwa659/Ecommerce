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
        request.users = payload; 
        next();
      }
    })
  }
}

function isAdmin(request, response, next) {
  const { role } = request.users; 
  if (role === 'admin') {
    next(); 
  } else {
    response.status(403).json({ message: 'Access denied. Admins only.' });
  }
}




app.post("/signup", async (request, response) => {
  try {
    const { name, email, username, password } = request.body;
    const hashedPassword = await password;
    const selectUserQuery = `SELECT * FROM users WHERE username = ?`;
    const dbUser = await db.get(selectUserQuery, [username]);
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO users (name, email, username, password)
        VALUES (?, ?, ?, ?)`;
      const dbResponse = await db.run(createUserQuery, [name, email, username, hashedPassword]);
      const newUserId = dbResponse.lastID;
      response.json({ message: `Created new user with ${newUserId}` });
    } else {
      response.status(400).json({ message: "User already exists" });
    }
  } catch (error) {
    console.error("Signup error:", error.message);
    response.status(500).json({ message: "Server error during signup" });
  }
});
// Login


app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM users WHERE username = ?`;
  const dbUser = await db.get(selectUserQuery, [username]);
  if (dbUser === undefined) {
    response.status(400).json({ message: "Invalid User" });
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = { id: dbUser.id, username: username, role: dbUser.role };
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN');
      response.json({ message: "Login Success!", jwtToken });
    } else {
      response.status(400).json({ message: "Invalid Password" });
    }
  }
});


app.get('/products', authenticateToken,isAdmin, async (request, response) => {
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
    const { id } = request.users;
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
    const { id: user_id } = request.users;

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

module.exports = app;
