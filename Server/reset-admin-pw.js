import { getDb } from './config/db.js';

async function resetPassword() {
  const db = await getDb();
  const bcrypt = await import('bcrypt');
  const hash = await bcrypt.hash('admin123', 10);
  await db.run('UPDATE Users SET password_hash = ? WHERE username = ?', [hash, 'admin']);
  const row = await db.get('SELECT username, email, role FROM Users WHERE username = ?', ['admin']);
  console.log('Admin user:', JSON.stringify(row));
  console.log('Password hash set to:', hash);
  process.exit(0);
}

resetPassword().catch(e => { console.error(e); process.exit(1); });