const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

(async () => {
  const db = await open({
    filename: path.join(__dirname, 'ecommerce.db'),
    driver: sqlite3.Database
  });

  await db.run(`
    INSERT INTO products (name, price, category)
    VALUES ('iPhone 14', 799, 'mobiles'),
           ('MacBook Air M2', 1199, 'laptops'),
           ('Boat Rockerz 450', 29, 'headphones');
  `);

  console.log('✅ Products inserted successfully');
})();
