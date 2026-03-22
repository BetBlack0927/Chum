-- Diagnostic query to find the exact issue
-- Run this to see what's happening with your specific group

-- First, find your group ID
SELECT id, name FROM groups ORDER BY created_at DESC LIMIT 5;

-- Then use your group ID below (replace YOUR_GROUP_ID_HERE)

-- Check what categories are enabled for your group
SELECT 
  'Enabled categories for this group' as info,
  category 
FROM group_categories 
WHERE group_id = 'YOUR_GROUP_ID_HERE';

-- Check all prompts and their categories
SELECT 
  COUNT(*) as total_prompts,
  COUNT(CASE WHEN category IS NULL THEN 1 END) as null_category,
  COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as with_category
FROM prompts;

-- Check category distribution
SELECT 
  COALESCE(category, 'NULL') as category,
  COUNT(*) as count
FROM prompts
GROUP BY category
ORDER BY count DESC;

-- The key diagnostic: See which prompts WOULD be available
-- Replace YOUR_GROUP_ID_HERE with your actual group ID
SELECT 
  p.id,
  p.category,
  p.text,
  CASE 
    WHEN gc.category IS NOT NULL THEN 'AVAILABLE (category enabled)'
    WHEN NOT EXISTS (SELECT 1 FROM group_categories WHERE group_id = 'YOUR_GROUP_ID_HERE') THEN 'AVAILABLE (no restrictions)'
    ELSE 'FILTERED OUT (category not enabled)'
  END as availability_status
FROM prompts p
LEFT JOIN group_categories gc ON gc.group_id = 'YOUR_GROUP_ID_HERE' AND p.category = gc.category
ORDER BY 
  CASE 
    WHEN gc.category IS NOT NULL THEN 1
    WHEN NOT EXISTS (SELECT 1 FROM group_categories WHERE group_id = 'YOUR_GROUP_ID_HERE') THEN 2
    ELSE 3
  END,
  p.category,
  p.text
LIMIT 20;
