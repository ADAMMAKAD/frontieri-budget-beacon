// Debug SQL query generation

function generateRisksQuery(userRole, userId) {
  let userFilter = '';
  const params = [];
  
  if (userRole !== 'admin') {
    userFilter = `WHERE (p.project_manager_id = $1 OR EXISTS (
      SELECT 1 FROM project_teams pt WHERE pt.project_id = p.id AND pt.user_id = $1
    ))`;
    params.push(userId);
  }

  const risksQuery = `
    WITH project_risks AS (
      SELECT 
        'budget' as type,
        CASE 
          WHEN (spent_budget / NULLIF(total_budget, 0) * 100) > 95 THEN 'critical'
          WHEN (spent_budget / NULLIF(total_budget, 0) * 100) > 85 THEN 'high'
          WHEN (spent_budget / NULLIF(total_budget, 0) * 100) > 75 THEN 'medium'
          ELSE 'low'
        END as severity,
        'Project "' || name || '" budget utilization at ' || 
        ROUND((spent_budget / NULLIF(total_budget, 0) * 100), 1) || '%' as message,
        'Potential budget overrun of $' || 
        ROUND((spent_budget - total_budget), 0) as impact,
        'Review spending patterns and adjust scope if necessary' as recommendation,
        ROUND((spent_budget / NULLIF(total_budget, 0) * 100), 0) as probability
      FROM projects p
      ${userFilter || 'WHERE 1=1'} AND total_budget > 0 AND (spent_budget / total_budget) > 0.75
    ),
    timeline_risks AS (
      SELECT 
        'timeline' as type,
        CASE 
          WHEN end_date < CURRENT_DATE THEN 'critical'
          WHEN end_date < CURRENT_DATE + INTERVAL '7 days' THEN 'high'
          WHEN end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'medium'
          ELSE 'low'
        END as severity,
        'Project "' || name || '" deadline approaching or overdue' as message,
        CASE 
          WHEN end_date < CURRENT_DATE THEN 'Project is overdue by ' || (CURRENT_DATE - end_date) || ' days'
          ELSE 'Deadline in ' || (end_date - CURRENT_DATE) || ' days'
        END as impact,
        'Accelerate development or negotiate deadline extension' as recommendation,
        CASE 
          WHEN end_date < CURRENT_DATE THEN 100
          WHEN end_date < CURRENT_DATE + INTERVAL '7 days' THEN 85
          WHEN end_date < CURRENT_DATE + INTERVAL '30 days' THEN 60
          ELSE 30
        END as probability
      FROM projects p
      ${userFilter || 'WHERE 1=1'} AND p.status = 'active' AND p.end_date < CURRENT_DATE + INTERVAL '30 days'
    )
    SELECT * FROM project_risks
    UNION ALL
    SELECT * FROM timeline_risks
    ORDER BY 
      CASE severity 
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      probability DESC
    LIMIT 10
  `;
  
  return { query: risksQuery, params };
}

console.log('=== Testing SQL Query Generation ===\n');

// Test for admin user
console.log('1. Admin user query:');
const adminQuery = generateRisksQuery('admin', null);
console.log(adminQuery.query);
console.log('Params:', adminQuery.params);
console.log('\n');

// Test for non-admin user
console.log('2. Non-admin user query:');
const userQuery = generateRisksQuery('manager', 'user-123');
console.log(userQuery.query);
console.log('Params:', userQuery.params);