-- Analytics Queries for Join Method Tracking
-- Use these to get insights on how users are joining groups

-- 1. Overall join method distribution
SELECT 
  join_method,
  COUNT(*) as member_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM group_members
GROUP BY join_method
ORDER BY member_count DESC;

-- 2. Join methods by group
SELECT 
  g.name as group_name,
  gm.join_method,
  COUNT(*) as member_count
FROM group_members gm
JOIN groups g ON g.id = gm.group_id
GROUP BY g.name, gm.join_method
ORDER BY g.name, member_count DESC;

-- 3. Invite link effectiveness (link vs code)
SELECT 
  join_method,
  COUNT(*) as joins,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM group_members WHERE join_method IN ('link', 'code')) as percentage
FROM group_members
WHERE join_method IN ('link', 'code')
GROUP BY join_method;

-- 4. Recent joins by method (last 7 days)
SELECT 
  DATE(joined_at) as join_date,
  join_method,
  COUNT(*) as joins
FROM group_members
WHERE joined_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(joined_at), join_method
ORDER BY join_date DESC, joins DESC;

-- 5. Most viral groups (highest link join rate)
SELECT 
  g.name,
  g.invite_code,
  COUNT(CASE WHEN gm.join_method = 'link' THEN 1 END) as link_joins,
  COUNT(*) as total_members,
  ROUND(
    COUNT(CASE WHEN gm.join_method = 'link' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(*), 0), 
    2
  ) as link_join_percentage
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
GROUP BY g.id, g.name, g.invite_code
HAVING COUNT(*) > 1  -- Exclude single-member groups
ORDER BY link_joins DESC
LIMIT 10;

-- 6. User acquisition funnel
SELECT 
  'Total Groups' as stage,
  COUNT(DISTINCT group_id) as count
FROM group_members
UNION ALL
SELECT 
  'Groups with Link Joins',
  COUNT(DISTINCT group_id)
FROM group_members
WHERE join_method = 'link'
UNION ALL
SELECT 
  'Total Members',
  COUNT(*)
FROM group_members
UNION ALL
SELECT 
  'Members via Link',
  COUNT(*)
FROM group_members
WHERE join_method = 'link';

-- 7. Average group size by primary join method
SELECT 
  primary_method,
  AVG(member_count) as avg_members,
  COUNT(*) as group_count
FROM (
  SELECT 
    g.id,
    COUNT(gm.id) as member_count,
    MODE() WITHIN GROUP (ORDER BY gm.join_method) as primary_method
  FROM groups g
  JOIN group_members gm ON g.id = gm.group_id
  GROUP BY g.id
) subquery
GROUP BY primary_method
ORDER BY avg_members DESC;
