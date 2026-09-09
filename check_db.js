const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
console.log('Tables:');
db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, tables) => {
  if (err) console.error(err);
  else {
    console.log(tables.map(t => t.name).join(', '));
    
    // Check Customers table structure
    db.all('PRAGMA table_info(Customers)', (err, cols) => {
      if (err) console.error(err);
      else {
        console.log('\nCustomers columns:');
        console.log(cols.map(c => `${c.name} (${c.type})`).join(', '));
        
        // Check for google_id column
        const hasGoogleId = cols.some(c => c.name === 'google_id');
        console.log('\ngoogle_id column exists:', hasGoogleId);
        
        // Show sample customers
        db.all('SELECT id, name, email, google_id FROM Customers LIMIT 5', (err, rows) => {
          if (err) console.error(err);
          else {
            console.log('\nSample Customers:');
            console.table(rows);
            db.close();
          }
        });
      }
    });
  }
});