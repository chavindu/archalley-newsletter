-- WordPress Posts Storage Table
CREATE TABLE IF NOT EXISTS wordpress_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wp_post_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  link VARCHAR(500) NOT NULL,
  featured_image_url VARCHAR(500),
  featured_image_alt TEXT,
  categories JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  author_name VARCHAR(255),
  published_date TIMESTAMP WITH TIME ZONE NOT NULL,
  modified_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_wp_id ON wordpress_posts(wp_post_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_published_date ON wordpress_posts(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_status ON wordpress_posts(status);
CREATE INDEX IF NOT EXISTS idx_wordpress_posts_featured ON wordpress_posts(is_featured);

-- Enable RLS
ALTER TABLE wordpress_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all wordpress posts" ON wordpress_posts FOR SELECT USING (true);
CREATE POLICY "Users can manage wordpress posts" ON wordpress_posts FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wordpress_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER wordpress_posts_updated_at
  BEFORE UPDATE ON wordpress_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_wordpress_posts_updated_at();
