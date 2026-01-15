/*
  # 新增「關係聯絡人標籤」與「外觀設定」支援

  ## 1) relationship_tags
  - 讓使用者可自訂關係標籤（伴侶/同事/家人...），供 relationships.relationship_type 使用
  - value 建議存「穩定值」（這裡先用 label 同值，前端亦可這樣做）

  ## 2) profiles 外觀設定欄位
  - theme_mode: system | light | dark
  - theme_color: hex color string, e.g. #3B82F6
*/

-- 1) relationship_tags
CREATE TABLE IF NOT EXISTS relationship_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value text NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- unique per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'relationship_tags_user_value_unique'
  ) THEN
    ALTER TABLE relationship_tags
      ADD CONSTRAINT relationship_tags_user_value_unique UNIQUE (user_id, value);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_relationship_tags_user_id ON relationship_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_tags_sort ON relationship_tags(user_id, sort_order);

ALTER TABLE relationship_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relationship_tags"
  ON relationship_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relationship_tags"
  ON relationship_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationship_tags"
  ON relationship_tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own relationship_tags"
  ON relationship_tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2) profiles 外觀設定欄位
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme_mode'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme_mode text NOT NULL DEFAULT 'system';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme_color'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme_color text NOT NULL DEFAULT '#3B82F6';
  END IF;
END $$;


