import { initDatabase, dbRun, closeDatabase } from './db';

/**
 * Seed master_industries table with comprehensive industry data
 */
async function seedMasterIndustries() {
  try {
    console.log('Seeding master_industries table...');

    await initDatabase();

    // Comprehensive list of industries categorized by sector
    const industries = [
      // IT・通信
      { name: 'IT・インターネット', category: 'IT・通信', display_order: 1 },
      { name: 'ソフトウェア開発', category: 'IT・通信', display_order: 2 },
      { name: 'システムインテグレーション', category: 'IT・通信', display_order: 3 },
      { name: '通信・キャリア', category: 'IT・通信', display_order: 4 },
      { name: 'Web サービス', category: 'IT・通信', display_order: 5 },
      { name: 'ゲーム開発', category: 'IT・通信', display_order: 6 },

      // 金融
      { name: '銀行', category: '金融', display_order: 10 },
      { name: '証券', category: '金融', display_order: 11 },
      { name: '保険', category: '金融', display_order: 12 },
      { name: 'クレジットカード', category: '金融', display_order: 13 },
      { name: 'リース・ファイナンス', category: '金融', display_order: 14 },
      { name: 'フィンテック', category: '金融', display_order: 15 },

      // 製造
      { name: '自動車・輸送機器', category: '製造', display_order: 20 },
      { name: '電気・電子機器', category: '製造', display_order: 21 },
      { name: '機械・重工業', category: '製造', display_order: 22 },
      { name: '化学・素材', category: '製造', display_order: 23 },
      { name: '食品・飲料', category: '製造', display_order: 24 },
      { name: '医薬品・医療機器', category: '製造', display_order: 25 },
      { name: '半導体', category: '製造', display_order: 26 },

      // 流通・小売
      { name: 'EC・通販', category: '流通・小売', display_order: 30 },
      { name: '百貨店・スーパー', category: '流通・小売', display_order: 31 },
      { name: 'コンビニエンスストア', category: '流通・小売', display_order: 32 },
      { name: '専門小売', category: '流通・小売', display_order: 33 },
      { name: '商社・卸売', category: '流通・小売', display_order: 34 },

      // サービス
      { name: '広告・マーケティング', category: 'サービス', display_order: 40 },
      { name: '人材サービス', category: 'サービス', display_order: 41 },
      { name: 'コンサルティング', category: 'サービス', display_order: 42 },
      { name: '教育・学習支援', category: 'サービス', display_order: 43 },
      { name: '旅行・観光', category: 'サービス', display_order: 44 },
      { name: 'ホテル・宿泊', category: 'サービス', display_order: 45 },
      { name: '飲食サービス', category: 'サービス', display_order: 46 },

      // 医療・福祉
      { name: '医療機関', category: '医療・福祉', display_order: 50 },
      { name: '介護・福祉', category: '医療・福祉', display_order: 51 },
      { name: 'ヘルスケア', category: '医療・福祉', display_order: 52 },

      // インフラ・エネルギー
      { name: '電力・ガス', category: 'インフラ・エネルギー', display_order: 60 },
      { name: '鉄道・航空', category: 'インフラ・エネルギー', display_order: 61 },
      { name: '物流・運輸', category: 'インフラ・エネルギー', display_order: 62 },
      { name: '建設・不動産', category: 'インフラ・エネルギー', display_order: 63 },

      // メディア・エンターテイメント
      { name: '放送・出版', category: 'メディア・エンターテイメント', display_order: 70 },
      { name: 'エンターテイメント', category: 'メディア・エンターテイメント', display_order: 71 },
      { name: 'スポーツ', category: 'メディア・エンターテイメント', display_order: 72 },

      // 公共・官公庁
      { name: '官公庁・自治体', category: '公共・官公庁', display_order: 80 },
      { name: '教育機関', category: '公共・官公庁', display_order: 81 },

      // その他
      { name: 'その他', category: 'その他', display_order: 999 },
    ];

    for (const industry of industries) {
      await dbRun(
        `INSERT OR IGNORE INTO master_industries (name, category, display_order)
         VALUES (?, ?, ?)`,
        [industry.name, industry.category, industry.display_order]
      );
    }

    console.log(`✓ Seeded ${industries.length} industries`);

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding master_industries:', error);
    await closeDatabase();
    process.exit(1);
  }
}

seedMasterIndustries();
