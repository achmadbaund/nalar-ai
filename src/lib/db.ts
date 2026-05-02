import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Initialize database tables
export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create sources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS print_media_sources (
        id SERIAL PRIMARY KEY,
        newspaper_name VARCHAR(255) NOT NULL,
        publication_date DATE NOT NULL,
        file_path TEXT,
        original_filename TEXT,
        file_size BIGINT,
        file_type VARCHAR(100),
        ocr_status VARCHAR(50) DEFAULT 'pending',
        ocr_started_at TIMESTAMP,
        ocr_completed_at TIMESTAMP,
        ocr_error_message TEXT,
        page_count INTEGER,
        article_count INTEGER DEFAULT 0,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processing_duration INTEGER,
        metadata JSONB DEFAULT '{}'
      )
    `);

    // Create articles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS print_media_articles (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        category TEXT,
        page_number INTEGER,
        publication_date DATE NOT NULL,
        newspaper_name VARCHAR(255) NOT NULL,
        confidence_score DECIMAL(5,4) DEFAULT 0.5,
        sentiment_analysis VARCHAR(50),
        validated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        content TEXT,
        source_id INTEGER REFERENCES print_media_sources(id) ON DELETE CASCADE,
        avatar_explanation TEXT,
        avatar_model VARCHAR(100),
        metadata JSONB DEFAULT '{}'
      )
    `);

    // Create processing logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS print_media_logs (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES print_media_sources(id) ON DELETE CASCADE,
        level VARCHAR(20) DEFAULT 'info',
        message TEXT NOT NULL,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_source ON print_media_articles(source_id);
      CREATE INDEX IF NOT EXISTS idx_articles_sentiment ON print_media_articles(sentiment_analysis);
      CREATE INDEX IF NOT EXISTS idx_articles_publication ON print_media_articles(publication_date);
      CREATE INDEX IF NOT EXISTS idx_logs_source ON print_media_logs(source_id);
      CREATE INDEX IF NOT EXISTS idx_logs_created ON print_media_logs(created_at);
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool };

// Helper to execute queries
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows;
}

// Helper to get single row
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}
