-- Debug query to check prompt availability issues
-- Run this in Supabase SQL Editor to diagnose the "No prompt available" error

-- 1. Check if prompts table has data
SELECT 'Total prompts in database' as check_name, COUNT(*) as count FROM prompts;

-- 2. Check prompts by category
SELECT category, COUNT(*) as count 
FROM prompts 
GROUP BY category 
ORDER BY count DESC;

-- 3. Check if any groups exist
SELECT 'Total groups' as check_name, COUNT(*) as count FROM groups;

-- 4. Check which groups have category settings
SELECT 
  g.id,
  g.name,
  COUNT(gc.id) as enabled_categories_count,
  STRING_AGG(gc.category, ', ' ORDER BY gc.category) as enabled_categories
FROM groups g
LEFT JOIN group_categories gc ON g.id = gc.group_id
GROUP BY g.id, g.name
ORDER BY g.created_at DESC;

-- 5. Check if there are any recent rounds
SELECT 
  r.date,
  g.name as group_name,
  p.text as prompt_text,
  p.category
FROM rounds r
JOIN groups g ON r.group_id = g.id
JOIN prompts p ON r.prompt_id = p.id
ORDER BY r.date DESC
LIMIT 10;

-- 6. For a specific group, check what prompts would be available
-- Replace 'YOUR_GROUP_ID' with your actual group ID
-- SELECT p.id, p.text, p.category
-- FROM prompts p
-- WHERE NOT EXISTS (
--   SELECT 1 FROM group_categories gc 
--   WHERE gc.group_id = 'YOUR_GROUP_ID'
-- )
-- OR p.category IN (
--   SELECT category FROM group_categories 
--   WHERE group_id = 'YOUR_GROUP_ID'
-- );
