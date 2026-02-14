-- ContentForge Initial Schema Migration
-- Creates core tables for materials, contents, tasks, publications, and metrics

-- Create n8n database if not exists
SELECT 'CREATE DATABASE n8n' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n')\gexec

-- Ensure uuid-ossp extension can be created (supabase image requires explicit role handling)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    EXECUTE 'CREATE ROLE supabase_admin WITH LOGIN SUPERUSER PASSWORD ''postgres''';
  END IF;
END $$;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for better type safety
CREATE TYPE material_status AS ENUM ('new', 'scored', 'assigned', 'processed');
CREATE TYPE content_status AS ENUM ('draft', 'review', 'approved', 'published');
CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE task_type AS ENUM (
  'collect',
  'score',
  'research',
  'write',
  'visual',
  'video',
  'humanize',
  'guard',
  'publish',
  'analyze'
);
CREATE TYPE channel_type AS ENUM (
  'medium',
  'linkedin',
  'x',
  'threads',
  'brunch',
  'newsletter',
  'blog',
  'kakao',
  'youtube',
  'shorts',
  'reels',
  'tiktok',
  'ig_carousel',
  'ig_single',
  'ig_story',
  'webtoon'
);

-- Materials table: stores collected content from various sources
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL,
    url TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    score INTEGER CHECK (score >= 1 AND score <= 10),
    tags JSONB DEFAULT '[]'::jsonb,
    status material_status NOT NULL DEFAULT 'new',
    collected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contents table: stores generated content for various channels
CREATE TABLE contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    channel channel_type NOT NULL,
    format VARCHAR(50),
    body TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    status content_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table: tracks async tasks and agent work
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type task_type NOT NULL,
    status task_status NOT NULL DEFAULT 'pending',
    agent_id VARCHAR(100),
    input JSONB DEFAULT '{}'::jsonb,
    output JSONB DEFAULT '{}'::jsonb,
    error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Publications table: tracks published content across channels
CREATE TABLE publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    channel channel_type NOT NULL,
    external_url TEXT,
    external_id VARCHAR(255),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Metrics table: stores performance metrics for published content
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_materials_status ON materials(status);
CREATE INDEX idx_materials_score ON materials(score DESC);
CREATE INDEX idx_materials_source ON materials(source);
CREATE INDEX idx_materials_created_at ON materials(created_at DESC);
CREATE INDEX idx_materials_tags ON materials USING GIN(tags);

CREATE INDEX idx_contents_material_id ON contents(material_id);
CREATE INDEX idx_contents_channel ON contents(channel);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_created_at ON contents(created_at DESC);

CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

CREATE INDEX idx_publications_content_id ON publications(content_id);
CREATE INDEX idx_publications_channel ON publications(channel);
CREATE INDEX idx_publications_published_at ON publications(published_at DESC);
CREATE INDEX idx_publications_external_id ON publications(external_id);

CREATE INDEX idx_metrics_publication_id ON metrics(publication_id);
CREATE INDEX idx_metrics_measured_at ON metrics(measured_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
