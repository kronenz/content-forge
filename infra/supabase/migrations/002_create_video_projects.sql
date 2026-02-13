-- Video projects table for the scene-based multimodal video editor
CREATE TABLE video_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  material_id TEXT NOT NULL DEFAULT '',
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  scenes JSONB NOT NULL DEFAULT '[]',
  global_style JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'editing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_projects_status ON video_projects(status);
CREATE INDEX idx_video_projects_created_at ON video_projects(created_at DESC);

-- Auto-update updated_at on row modification
CREATE TRIGGER update_video_projects_updated_at
  BEFORE UPDATE ON video_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
