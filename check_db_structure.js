const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('Checking database structure...');

// Get all tables
console.log('\n1. Tables in database:');
db.all('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name', (err, tables) => {
  if (err) console.error('Error:', err);
  else {
    console.log(tables.map(t => t.name).join(', '));
    
    // Check Customers table structure
    console.log('\n2. Checking Customers table structure:');
    db.all('PRAGMA table_info(Customers)', (err, cols) => {
      if (err) console.error('Error:', err);
      else {
        console.log('\nColumns in Customers table:');
        cols.forEach(col => {
          console.log(`  - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
        });
        
        // Check if google_id column exists
        const googleIdCol = cols.find(c => c.name === 'google_id');
        if (!googleIdCol) {
          console.log('\n❌ ERROR: google_id column is missing from Customers table!');
          console.log('   The google auth system requires this column to store Google user IDs.');
        } else {
          console.log('\n✅ google_id column exists in Customers table');
        }
        
        // Check sample data
        console.log('\n3. Sample Customers data:');
        db.all('SELECT id, name, email, google_id FROM Customers LIMIT 5', (err, rows) => {
          if (err) console.error('Error:', err);
          else {
            if (rows.length === 0) {
              console.log('No customers in database');
            } else {
              console.table(rows);
              const hasGoogleId = rows.some(r => r.google_id);
              console.log('\nHas any Google auth users:', hasGoogleId ? 'Yes' : 'No');
            }
            
            db.close();
          }
        });
      }
    });
  }
});