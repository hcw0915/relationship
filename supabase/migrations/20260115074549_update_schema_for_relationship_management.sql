/*
  # 更新資料庫架構以支援關係人管理系統

  ## 概述
  將原有的單一伴侶系統改為支援多個關係人管理，包含同事、上司、下屬、朋友等各種關係類型。

  ## 新建資料表

  ### 1. relationships（關係人表）
  - `id` (uuid, primary key) - 關係人 ID
  - `user_id` (uuid, foreign key) - 所屬用戶 ID
  - `name` (text) - 關係人姓名
  - `relationship_type` (text) - 關係類型（伴侶、同事、上司、下屬、朋友、家人等）
  - `priority_order` (integer) - 優先順序（用於拖拽排序）
  - `met_date` (date, nullable) - 認識日期
  - `avatar_url` (text, nullable) - 頭像 URL
  - `notes` (text, nullable) - 備註
  - `created_at` (timestamptz) - 建立時間
  - `updated_at` (timestamptz) - 更新時間

  ### 2. events（統合行程表）
  - `id` (uuid, primary key) - 行程 ID
  - `user_id` (uuid, foreign key) - 所屬用戶 ID
  - `title` (text) - 行程標題
  - `description` (text, nullable) - 描述
  - `start_time` (timestamptz) - 開始時間
  - `end_time` (timestamptz, nullable) - 結束時間
  - `location` (text, nullable) - 地點
  - `relationship_ids` (uuid[], nullable) - 相關關係人 ID 陣列
  - `created_at` (timestamptz) - 建立時間

  ## 修改現有資料表

  ### important_dates
  - 新增 `relationship_id` (uuid, nullable, foreign key) - 關聯的關係人 ID

  ### action_memos
  - 新增 `relationship_id` (uuid, nullable, foreign key) - 關聯的關係人 ID

  ### partner_preferences -> preferences
  - 重新命名為 preferences
  - 新增 `relationship_id` (uuid, foreign key) - 關聯的關係人 ID

  ## 安全性設置
  
  所有資料表都啟用 RLS 並設置政策：
  - 用戶只能查看、新增、更新、刪除自己的資料
*/

-- 建立 relationships 資料表
CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship_type text NOT NULL DEFAULT 'friend',
  priority_order integer NOT NULL DEFAULT 0,
  met_date date,
  avatar_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 建立 events 資料表
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  location text,
  relationship_ids uuid[],
  created_at timestamptz DEFAULT now()
);

-- 為 important_dates 新增 relationship_id 欄位
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'important_dates' AND column_name = 'relationship_id'
  ) THEN
    ALTER TABLE important_dates ADD COLUMN relationship_id uuid REFERENCES relationships(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 為 action_memos 新增 relationship_id 欄位
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_memos' AND column_name = 'relationship_id'
  ) THEN
    ALTER TABLE action_memos ADD COLUMN relationship_id uuid REFERENCES relationships(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 將 partner_preferences 重新命名為 preferences 並新增 relationship_id
DO $$
BEGIN
  -- 如果 preferences 資料表不存在，則從 partner_preferences 重新命名
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'preferences') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_preferences') THEN
      ALTER TABLE partner_preferences RENAME TO preferences;
    ELSE
      -- 如果兩者都不存在，則建立新的 preferences 資料表
      CREATE TABLE preferences (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        relationship_id uuid NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
        category text NOT NULL,
        title text NOT NULL,
        description text,
        tags text[],
        created_at timestamptz DEFAULT now()
      );
    END IF;
  END IF;

  -- 新增 relationship_id 欄位到 preferences（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'preferences' AND column_name = 'relationship_id'
  ) THEN
    ALTER TABLE preferences ADD COLUMN relationship_id uuid REFERENCES relationships(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_priority ON relationships(user_id, priority_order);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_important_dates_relationship ON important_dates(relationship_id);
CREATE INDEX IF NOT EXISTS idx_action_memos_relationship ON action_memos(relationship_id);
CREATE INDEX IF NOT EXISTS idx_preferences_relationship ON preferences(relationship_id);

-- 啟用 RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- relationships 資料表的 RLS 政策
CREATE POLICY "Users can view own relationships"
  ON relationships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relationships"
  ON relationships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationships"
  ON relationships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own relationships"
  ON relationships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- events 資料表的 RLS 政策
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 如果 preferences 資料表沒有 RLS 政策，則新增
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'preferences' AND policyname = 'Users can view own preferences v2'
  ) THEN
    CREATE POLICY "Users can view own preferences v2"
      ON preferences FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'preferences' AND policyname = 'Users can insert own preferences v2'
  ) THEN
    CREATE POLICY "Users can insert own preferences v2"
      ON preferences FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'preferences' AND policyname = 'Users can update own preferences v2'
  ) THEN
    CREATE POLICY "Users can update own preferences v2"
      ON preferences FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'preferences' AND policyname = 'Users can delete own preferences v2'
  ) THEN
    CREATE POLICY "Users can delete own preferences v2"
      ON preferences FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;