import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../database.sqlite');
const INDEX_SQL_PATH = path.join(__dirname, 'add_performance_indexes.sql');

const addPerformanceIndexes = async () => {
  console.log('Adding performance indexes to database...');

  const db = new sqlite3.Database(DB_PATH);

  const sql = fs.readFileSync(INDEX_SQL_PATH, 'utf-8');

  db.exec(sql, (err) => {
    if (err) {
      console.error('Error adding indexes:', err);
      process.exit(1);
    } else {
      console.log('Performance indexes added successfully');
      db.close();
      process.exit(0);
    }
  });
};

addPerformanceIndexes();
