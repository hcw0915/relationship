/*
  # 關係管理助手資料庫架構

  ## 新建資料表
  
  ### 1. profiles
  用戶個人資料表
  - `id` (uuid, primary key) - 用戶 ID，關聯到 auth.users
  - `email` (text) - 用戶電子郵件
  - `partner_name` (text, nullable) - 伴侶名稱
  - `created_at` (timestamptz) - 建立時間

  ### 2. important_dates
  重要日期表
  - `id` (uuid, primary key) - 記錄 ID
  - `user_id` (uuid, foreign key) - 所屬用戶 ID
  - `title` (text) - 日期標題
  - `date` (date) - 日期
  - `type` (text) - 類型：birthday, anniversary, other
  - `reminder_days_before` (integer) - 提前幾天提醒
  - `notes` (text, nullable) - 備註
  - `created_at` (timestamptz) - 建立時間

  ### 3. action_memos
  行動備忘錄表
  - `id` (uuid, primary key) - 記錄 ID
  - `user_id` (uuid, foreign key) - 所屬用戶 ID
  - `title` (text) - 備忘標題
  - `description` (text, nullable) - 描述
  - `priority` (text) - 優先級：low, medium, high
  - `status` (text) - 狀態：pending, completed
  - `due_date` (date, nullable) - 截止日期
  - `completed_at` (timestamptz, nullable) - 完成時間
  - `created_at` (timestamptz) - 建立時間

  ### 4. partner_preferences
  伴侶偏好表
  - `id` (uuid, primary key) - 記錄 ID
  - `user_id` (uuid, foreign key) - 所屬用戶 ID
  - `category` (text) - 分類
  - `title` (text) - 標題
  - `description` (text, nullable) - 描述
  - `tags` (text[], nullable) - 標籤陣列
  - `created_at` (timestamptz) - 建立時間

  ## 安全性設置
  
  所有資料表都啟用 RLS（行級安全性）並設置以下政策：
  - 用戶只能查看自己的資料
  - 用戶只能新增自己的資料
  - 用戶只能更新自己的資料
  - 用戶只能刪除自己的資料

  ## 索引
  
  為常用查詢欄位建立索引以提高效能
*/

-- 建立 profiles 資料表
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  partner_name text,
  created_at timestamptz DEFAULT now()
);

-- 建立 important_dates 資料表
CREATE TABLE IF NOT EXISTS important_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  type text NOT NULL DEFAULT 'other',
  reminder_days_before integer DEFAULT 7,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 建立 action_memos 資料表
CREATE TABLE IF NOT EXISTS action_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 建立 partner_preferences 資料表
CREATE TABLE IF NOT EXISTS partner_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  tags text[],
  created_at timestamptz DEFAULT now()
);

-- 為 important_dates 建立索引
CREATE INDEX IF NOT EXISTS idx_important_dates_user_id ON important_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_important_dates_date ON important_dates(date);

-- 為 action_memos 建立索引
CREATE INDEX IF NOT EXISTS idx_action_memos_user_id ON action_memos(user_id);
CREATE INDEX IF NOT EXISTS idx_action_memos_status ON action_memos(status);
CREATE INDEX IF NOT EXISTS idx_action_memos_due_date ON action_memos(due_date);

-- 為 partner_preferences 建立索引
CREATE INDEX IF NOT EXISTS idx_partner_preferences_user_id ON partner_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_preferences_category ON partner_preferences(category);

-- 啟用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_preferences ENABLE ROW LEVEL SECURITY;

-- profiles 資料表的 RLS 政策
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- important_dates 資料表的 RLS 政策
CREATE POLICY "Users can view own dates"
  ON important_dates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dates"
  ON important_dates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dates"
  ON important_dates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dates"
  ON important_dates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- action_memos 資料表的 RLS 政策
CREATE POLICY "Users can view own memos"
  ON action_memos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memos"
  ON action_memos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memos"
  ON action_memos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memos"
  ON action_memos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- partner_preferences 資料表的 RLS 政策
CREATE POLICY "Users can view own preferences"
  ON partner_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON partner_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON partner_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON partner_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
