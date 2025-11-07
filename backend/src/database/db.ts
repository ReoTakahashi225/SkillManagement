import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../database.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// SQLiteデータベース接続
let db: sqlite3.Database;

// データベース接続の初期化
export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');

        // パフォーマンス最適化: WALモードとその他のプラグマを有効化
        const pragmas = [
          'PRAGMA foreign_keys = ON',
          'PRAGMA journal_mode = WAL',           // Write-Ahead Loggingを有効化
          'PRAGMA synchronous = NORMAL',         // 安全性と速度のバランス
          'PRAGMA cache_size = -64000',          // 64MBキャッシュ
          'PRAGMA temp_store = MEMORY',          // 一時テーブルをメモリに保存
          'PRAGMA mmap_size = 30000000000',      // メモリマップドI/O
          'PRAGMA page_size = 4096',             // 最適なページサイズ
          'PRAGMA busy_timeout = 5000'           // ロック待機時間5秒
        ];

        let completed = 0;
        let hasError = false;

        pragmas.forEach((pragma) => {
          db.run(pragma, (err) => {
            if (err && !hasError) {
              console.error(`Error running ${pragma}:`, err);
              hasError = true;
              reject(err);
            } else {
              completed++;
              if (completed === pragmas.length && !hasError) {
                console.log('Database performance optimizations applied');
                resolve();
              }
            }
          });
        });
      }
    });
  });
};

// Run schema to create tables
export const runMigrations = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

    db.exec(schema, (err) => {
      if (err) {
        console.error('Error running migrations:', err);
        reject(err);
      } else {
        console.log('Database migrations completed successfully');
        resolve();
      }
    });
  });
};

// Get database instance
export const getDatabase = (): sqlite3.Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Helper functions for promisified database operations
export const dbRun = (sql: string, params?: any[]): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

export const dbGet = <T = any>(sql: string, params?: any[]): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params || [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T);
      }
    });
  });
};

export const dbAll = <T = any>(sql: string, params?: any[]): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
};

// Close database connection
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};
