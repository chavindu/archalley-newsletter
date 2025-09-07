-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO '14f978d2fa7229e4b062be8eb8cb0a8e';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_lists table
CREATE TABLE IF NOT EXISTS email_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  email_list_id UUID REFERENCES email_lists(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  UNIQUE(email, email_list_id)
);

-- Create newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  selected_posts JSONB DEFAULT '[]',
  email_list_ids UUID[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter_analytics table
CREATE TABLE IF NOT EXISTS newsletter_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_email VARCHAR(255) NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default superadmin user
INSERT INTO users (email, name, role) 
VALUES ('chavindun@gmail.com', 'Super Admin', 'superadmin')
ON CONFLICT (email) DO UPDATE SET role = 'superadmin';

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Only superadmins can insert users" ON users FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'superadmin')
);

CREATE POLICY "Users can view all email lists" ON email_lists FOR SELECT USING (true);
CREATE POLICY "Users can manage email lists" ON email_lists FOR ALL USING (true);

CREATE POLICY "Users can view all subscribers" ON subscribers FOR SELECT USING (true);
CREATE POLICY "Users can manage subscribers" ON subscribers FOR ALL USING (true);

CREATE POLICY "Users can view all newsletters" ON newsletters FOR SELECT USING (true);
CREATE POLICY "Users can manage newsletters" ON newsletters FOR ALL USING (true);

CREATE POLICY "Users can view analytics" ON newsletter_analytics FOR SELECT USING (true);
CREATE POLICY "Users can insert analytics" ON newsletter_analytics FOR INSERT WITH CHECK (true);
-- Allow updates to tracking fields from public (needed for open/click tracking)
CREATE POLICY "Users can update analytics" ON newsletter_analytics FOR UPDATE USING (true) WITH CHECK (true);
