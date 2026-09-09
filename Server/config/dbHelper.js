import { getDb, getDbType } from '../config/db.js';

// Convert SQLite ? syntax to PostgreSQL $1, $2 syntax
function convertSqlSyntax(sql, params) {
  const dbType = getDbType();
  
  if (dbType === 'postgres') {
    // Replace ? with $1, $2, etc.
    let paramIndex = 1;
    const postgresSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    return postgresSql;
  }
  
  return sql; // SQLite uses ? syntax
}

// Database query helper that works with both SQLite and PostgreSQL
export async function query(sql, params = []) {
  const db = await getDb();
  const dbType = getDbType();
  const convertedSql = convertSqlSyntax(sql, params);

  if (dbType === 'postgres') {
    // PostgreSQL uses $1, $2 syntax
    const result = await db.query(convertedSql, params);
    return result.rows;
  } else {
    // SQLite uses ? syntax
    const result = await db.all(convertedSql, params);
    return result;
  }
}

export async function queryOne(sql, params = []) {
  const db = await getDb();
  const dbType = getDbType();
  const convertedSql = convertSqlSyntax(sql, params);

  if (dbType === 'postgres') {
    const result = await db.query(convertedSql, params);
    return result.rows[0] || null;
  } else {
    const result = await db.get(convertedSql, params);
    return result;
  }
}

export async function execute(sql, params = []) {
  const db = await getDb();
  const dbType = getDbType();
  const convertedSql = convertSqlSyntax(sql, params);

  if (dbType === 'postgres') {
    const result = await db.query(convertedSql, params);
    return result.rowCount;
  } else {
    const result = await db.run(convertedSql, params);
    return result.changes;
  }
}

export async function executeWithId(sql, params = []) {
  const db = await getDb();
  const dbType = getDbType();
  const convertedSql = convertSqlSyntax(sql, params);

  if (dbType === 'postgres') {
    // For PostgreSQL, we need to return the ID from the INSERT
    const result = await db.query(`${convertedSql} RETURNING id`, params);
    return result.rows[0]?.id || null;
  } else {
    const result = await db.run(convertedSql, params);
    return result.lastID;
  }
}