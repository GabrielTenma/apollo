-- User utama (identity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- null untuk login via Telegram/Google
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Multi-provider auth (Telegram, Google, etc)
CREATE TABLE user_auth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'telegram', 'google', 'email'
    provider_user_id VARCHAR(255) NOT NULL, -- telegram_id atau google_sub
    provider_data JSONB, -- metadata tambahan (avatar, username)
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(provider, provider_user_id)
);

-- Session management (JWT refresh token atau session cookie)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- TELEGRAM

-- Bot yg terhubung ke sistem (bisa lebih dari 1 bot)
CREATE TABLE telegram_bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_token_hash VARCHAR(255) NOT NULL, -- simpan hash, token asli di vault
    bot_username VARCHAR(100) UNIQUE,
    webhook_secret UUID DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}' -- allowed updates, max connections, etc
);

-- Chat/grup/user Telegram yg berinteraksi dgn bot
CREATE TABLE telegram_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES telegram_bots(id),
    telegram_chat_id BIGINT NOT NULL, -- chat_id asli dari Telegram
    chat_type VARCHAR(20), -- 'private', 'group', 'supergroup', 'channel'
    title VARCHAR(255),
    username VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    linked_user_id UUID REFERENCES users(id), -- jika chat di-linked ke akun user internal
    settings JSONB DEFAULT '{}', -- per-chat preferences
    UNIQUE(bot_id, telegram_chat_id)
);

-- Pesan / update incoming dari webhook (untuk audit & async processing)
CREATE TABLE telegram_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES telegram_bots(id),
    update_id BIGINT NOT NULL,
    telegram_chat_id BIGINT,
    message_date TIMESTAMPTZ,
    raw_update JSONB NOT NULL, -- full update dari Telegram
    processed_at TIMESTAMPTZ,
    processed_by VARCHAR(100), -- nama handler/scenario
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bot_id, update_id)
);

-- SCRAPING RESULT

-- Sumber scraping (website, API, RSS, S3, etc)
CREATE TABLE scraping_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'webpage', 'api_json', 'rss', 's3_csv'
    connection_config JSONB NOT NULL, -- { url, headers, pagination, auth }
    schedule_cron VARCHAR(100), -- jika dijadwalkan
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Hasil scrape (satu sumber bisa menghasilkan banyak record)
CREATE TABLE scraped_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES scraping_sources(id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ DEFAULT now(),
    raw_content TEXT, -- HTML / JSON / CSV as string
    parsed_data JSONB, -- hasil parsing yang terstruktur (sudah dinormalisasi)
    data_hash VARCHAR(64) GENERATED ALWAYS AS (encode(sha256(raw_content::bytea), 'hex')) STORED, -- untuk deduplikasi
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'processed', 'failed'
    processing_log TEXT,
    UNIQUE(source_id, data_hash) -- optional: hindari duplikat sempurna
);

-- Index untuk pencarian cepat di JSONB
CREATE INDEX idx_scraped_parsed ON scraped_data USING GIN (parsed_data);

-- CONFIGURATION BY FEATURE

-- Feature flag / system config
CREATE TABLE feature_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key VARCHAR(255) NOT NULL, -- e.g., "scraping.max_concurrent", "telegram.greeting_message"
    value_type VARCHAR(20) DEFAULT 'string', -- 'string', 'integer', 'boolean', 'json', 'duration'
    value_string TEXT,
    value_integer BIGINT,
    value_boolean BOOLEAN,
    value_json JSONB,
    description TEXT,
    -- scope: global, per-user, per-telegram-chat, per-scraping-source
    scope_type VARCHAR(50), -- 'global', 'user', 'telegram_chat', 'scraping_source'
    scope_id UUID, -- ID dari tabel terkait (users.id, telegram_chats.id, dll)
    priority INT DEFAULT 0, -- makin besar makin tinggi override
    is_enabled BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Gunakan partial unique index agar hanya 1 default per (feature_key, scope_type, scope_id)
CREATE UNIQUE INDEX idx_feature_configs_unique 
ON feature_configs (feature_key, scope_type, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'))
WHERE is_enabled = true AND priority = 0;

-- Helper view untuk mendapatkan value dengan fallback
-- (bisa diimplementasikan di aplikasi atau dengan query window function)