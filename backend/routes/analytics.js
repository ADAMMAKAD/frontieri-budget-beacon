const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get comprehensive analytics data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    let userFilter = '';
    const params = [];
    
    if (req.user.role !== 'admin') {
      userFilter = `WHERE (p.project_manager_id = $1 OR EXISTS (
        SELECT 1 FROM project_teams pt WHERE pt.project_id = p.id AND pt.user_id = $1
      ))`;
      params.push(req.user.id);
    }

    // Get comprehensive metrics
    const metricsQuery = `
      WITH project_metrics AS (
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_projects,
          COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN p.status = 'on_hold' THEN 1 END) as on_hold_projects,
          COUNT(CASE WHEN p.end_date < CURRENT_DATE AND p.status != 'completed' THEN 1 END) as delayed_projects,
          COALESCE(SUM(total_budget), 0) as total_budget,
          COALESCE(SUM(spent_budget), 0) as total_spent,
          COALESCE(SUM(allocated_budget), 0) as total_allocated,
          AVG(CASE WHEN total_budget > 0 THEN (spent_budget / total_budget * 100) END) as avg_budget_utilization
        FROM projects p
        ${userFilter}
      ),
      expense_metrics AS (
        SELECT 
          COUNT(*) as total_expenses,
          COUNT(CASE WHEN e.status = 'pending' THEN 1 END) as pending_expenses,
          COUNT(CASE WHEN e.status = 'approved' THEN 1 END) as approved_expenses,
          COUNT(CASE WHEN e.status = 'rejected' THEN 1 END) as rejected_expenses,
          COALESCE(SUM(CASE WHEN e.status = 'approved' THEN amount END), 0) as total_expense_amount,
          AVG(CASE WHEN e.status = 'approved' THEN amount END) as avg_expense_amount
        FROM expenses e
        ${userFilter ? `JOIN projects p ON e.project_id = p.id ${userFilter}` : ''}
      ),
      milestone_metrics AS (
        SELECT 
          COUNT(*) as total_milestones,
          COUNT(CASE WHEN pm.status = 'completed' THEN 1 END) as completed_milestones,
          COUNT(CASE WHEN pm.status = 'in_progress' THEN 1 END) as in_progress_milestones,
          COUNT(CASE WHEN pm.due_date < CURRENT_DATE AND pm.status != 'completed' THEN 1 END) as overdue_milestones
        FROM project_milestones pm
        ${userFilter ? `JOIN projects p ON pm.project_id = p.id ${userFilter}` : ''}
      ),
      team_metrics AS (
        SELECT 
          COUNT(DISTINCT pt.user_id) as total_team_members,
          COUNT(DISTINCT pt.project_id) as projects_with_teams
        FROM project_teams pt
        ${userFilter ? `JOIN projects p ON pt.project_id = p.id ${userFilter}` : ''}
      )
      SELECT 
        pm.*,
        em.*,
        mm.*,
        tm.*
      FROM project_metrics pm
      CROSS JOIN expense_metrics em
      CROSS JOIN milestone_metrics mm
      CROSS JOIN team_metrics tm
    `;
    
    const result = await pool.query(metricsQuery, params);
    const metrics = result.rows[0];
    
    // Calculate derived metrics
    const budgetUtilization = metrics.total_allocated > 0 
      ? (metrics.total_spent / metrics.total_allocated * 100)
      : 0;
    
    const projectCompletionRate = metrics.total_projects > 0
      ? (metrics.completed_projects / metrics.total_projects * 100)
      : 0;
    
    const milestoneCompletionRate = metrics.total_milestones > 0
      ? (metrics.completed_milestones / metrics.total_milestones * 100)
      : 0;
    
    const expenseApprovalRate = metrics.total_expenses > 0
      ? (metrics.approved_expenses / metrics.total_expenses * 100)
      : 0;
    
    // Calculate efficiency score (composite metric)
    const efficiencyScore = (
      (projectCompletionRate * 0.3) +
      (milestoneCompletionRate * 0.3) +
      (expenseApprovalRate * 0.2) +
      (Math.max(0, 100 - budgetUtilization) * 0.2)
    );
    
    // Calculate risk score
    const riskScore = (
      (metrics.delayed_projects / Math.max(1, metrics.active_projects) * 30) +
      (metrics.overdue_milestones / Math.max(1, metrics.total_milestones) * 25) +
      (Math.max(0, budgetUtilization - 90) * 0.5) +
      (metrics.pending_expenses / Math.max(1, metrics.total_expenses) * 20)
    );
    
    // Calculate ROI estimate
    const roi = metrics.total_budget > 0
      ? ((metrics.total_budget - metrics.total_spent) / metrics.total_budget * 100)
      : 0;
    
    // Team utilization estimate
    const teamUtilization = metrics.total_team_members > 0
      ? Math.min(100, (metrics.active_projects / metrics.total_team_members) * 25)
      : 0;
    
    // Cost per milestone
    const costPerMilestone = metrics.completed_milestones > 0
      ? (metrics.total_spent / metrics.completed_milestones)
      : 0;
    
    // Calculate monthly burn rate (Budget Velocity)
    const monthlyBurnRate = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as monthly_expenses
      FROM expenses e
      ${userFilter ? `JOIN projects p ON e.project_id = p.id ${userFilter}` : ''}
      ${userFilter ? 'AND' : 'WHERE'} e.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND e.status = 'approved'
    `, params);
    
    // Calculate completion rate (Project Momentum) - percentage of milestones completed in last 30 days
    const completionRate = await pool.query(`
      WITH recent_milestones AS (
        SELECT 
          COUNT(*) as total_recent,
          COUNT(CASE WHEN pm.status = 'completed' THEN 1 END) as completed_recent
        FROM project_milestones pm
        ${userFilter ? `JOIN projects p ON pm.project_id = p.id ${userFilter}` : ''}
        ${userFilter ? 'AND' : 'WHERE'} pm.updated_at >= CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT 
        CASE 
          WHEN total_recent > 0 THEN (completed_recent::float / total_recent * 100)
          ELSE ${Math.round(projectCompletionRate)}
        END as completion_velocity
      FROM recent_milestones
    `, params);
    
    res.json({
      ...metrics,
      budget_utilization: Math.round(budgetUtilization * 100) / 100,
      project_completion_rate: Math.round(projectCompletionRate * 100) / 100,
      milestone_completion_rate: Math.round(milestoneCompletionRate * 100) / 100,
      expense_approval_rate: Math.round(expenseApprovalRate * 100) / 100,
      efficiency_score: Math.round(efficiencyScore * 100) / 100,
      risk_score: Math.min(100, Math.round(riskScore * 100) / 100),
      roi: Math.round(roi * 100) / 100,
      team_utilization: Math.round(teamUtilization * 100) / 100,
      cost_per_milestone: Math.round(costPerMilestone * 100) / 100,
      projected_spend: Math.round((metrics.total_spent * 1.15) * 100) / 100,
      monthly_burn_rate: Math.round(monthlyBurnRate.rows[0].monthly_expenses * 100) / 100,
      completion_rate: Math.round(completionRate.rows[0].completion_velocity * 100) / 100
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics data' });
  }
});

// Get risk analysis
router.get('/risks', authenticateToken, async (req, res) => {
  try {
    let userFilter = '';
    const params = [];
    
    if (req.user.role !== 'admin') {
      userFilter = `WHERE (p.project_manager_id = $1 OR EXISTS (
        SELECT 1 FROM project_teams pt WHERE pt.project_id = p.id AND pt.user_id = $1
      ))`;
      params.push(req.user.id);
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
      SELECT * FROM (
        SELECT * FROM project_risks
        UNION ALL
        SELECT * FROM timeline_risks
      ) combined_risks
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
    
    const result = await pool.query(risksQuery, params);
    
    res.json({
      risks: result.rows.map((risk, index) => ({
        id: `risk_${index + 1}`,
        ...risk
      }))
    });
  } catch (error) {
    console.error('Get risks error:', error);
    res.status(500).json({ error: 'Failed to get risk analysis' });
  }
});

// Get predictive insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    let userFilter = '';
    const params = [];
    
    if (req.user.role !== 'admin') {
      userFilter = `WHERE p.project_manager_id = $1 OR EXISTS (
        SELECT 1 FROM project_teams pt WHERE pt.project_id = p.id AND pt.user_id = $1
      )`;
      params.push(req.user.id);
    }

    const insightsQuery = `
      WITH budget_trends AS (
        SELECT 
          AVG(spent_budget / NULLIF(total_budget, 0) * 100) as avg_utilization,
          COUNT(*) as project_count
        FROM projects p
        ${userFilter ? userFilter + ' AND' : 'WHERE'} total_budget > 0
      ),
      completion_trends AS (
        SELECT 
          COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed,
          COUNT(*) as total,
          AVG(EXTRACT(DAYS FROM (COALESCE(p.end_date, CURRENT_DATE) - p.start_date))) as avg_duration
        FROM projects p
        ${userFilter}
      ),
      expense_trends AS (
        SELECT 
          COUNT(CASE WHEN e.status = 'approved' THEN 1 END) as approved,
          COUNT(*) as total,
          AVG(e.amount) as avg_amount
        FROM expenses e
        ${userFilter ? `JOIN projects p ON e.project_id = p.id ${userFilter}` : ''}
      )
      SELECT 
        bt.avg_utilization,
        bt.project_count,
        ct.completed,
        ct.total as total_projects,
        ct.avg_duration,
        et.approved as approved_expenses,
        et.total as total_expenses,
        et.avg_amount
      FROM budget_trends bt
      CROSS JOIN completion_trends ct
      CROSS JOIN expense_trends et
    `;
    
    const result = await pool.query(insightsQuery, params);
    const data = result.rows[0];
    
    const insights = [];
    
    // Budget prediction
    if (data.avg_utilization < 85) {
      insights.push({
        id: 'budget_1',
        category: 'budget',
        prediction: `Based on current spending patterns, you're likely to finish ${Math.round(100 - data.avg_utilization)}% under budget`,
        confidence: Math.min(95, 60 + (100 - data.avg_utilization)),
        timeframe: 'End of current projects',
        actionable: true
      });
    } else if (data.avg_utilization > 95) {
      insights.push({
        id: 'budget_2',
        category: 'budget',
        prediction: `Current spending trends indicate potential budget overrun of ${Math.round(data.avg_utilization - 100)}%`,
        confidence: Math.min(95, data.avg_utilization - 50),
        timeframe: 'Next 30-60 days',
        actionable: true
      });
    }
    
    // Timeline prediction
    const completionRate = data.total_projects > 0 ? (data.completed / data.total_projects * 100) : 0;
    if (completionRate > 70) {
      insights.push({
        id: 'timeline_1',
        category: 'timeline',
        prediction: `Strong completion rate suggests upcoming projects will finish on time or early`,
        confidence: Math.min(90, completionRate + 10),
        timeframe: 'Next quarter',
        actionable: false
      });
    }
    
    // Performance prediction
    const expenseApprovalRate = data.total_expenses > 0 ? (data.approved_expenses / data.total_expenses * 100) : 0;
    if (expenseApprovalRate > 80) {
      insights.push({
        id: 'performance_1',
        category: 'performance',
        prediction: `High expense approval rate indicates efficient budget management processes`,
        confidence: Math.min(85, expenseApprovalRate),
        timeframe: 'Ongoing',
        actionable: false
      });
    }
    
    // Add more insights based on data patterns
    if (data.avg_duration && data.avg_duration < 90) {
      insights.push({
        id: 'timeline_2',
        category: 'timeline',
        prediction: `Projects are completing faster than industry average, suggesting efficient execution`,
        confidence: 75,
        timeframe: 'Current trend',
        actionable: false
      });
    }
    
    res.json({
      insights: insights
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Failed to get predictive insights' });
  }
});

// Get performance analytics
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    let userFilter = '';
    const params = [];
    
    if (req.user.role !== 'admin') {
      userFilter = `WHERE p.project_manager_id = $1 OR EXISTS (
        SELECT 1 FROM project_teams pt WHERE pt.project_id = p.id AND pt.user_id = $1
      )`;
      params.push(req.user.id);
    }

    const performanceQuery = `
      WITH monthly_performance AS (
        SELECT 
          DATE_TRUNC('month', p.created_at) as month,
          COUNT(*) as projects_started,
          COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as projects_completed,
          AVG(p.spent_budget / NULLIF(p.total_budget, 0) * 100) as avg_budget_utilization
        FROM projects p
        ${userFilter}
        AND p.created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', p.created_at)
        ORDER BY month DESC
        LIMIT 6
      ),
      expense_performance AS (
        SELECT 
          DATE_TRUNC('month', e.created_at) as month,
          COUNT(*) as expenses_submitted,
          COUNT(CASE WHEN e.status = 'approved' THEN 1 END) as expenses_approved,
          AVG(e.amount) as avg_expense_amount
        FROM expenses e
        ${userFilter ? 'JOIN projects p ON e.project_id = p.id ' + userFilter : ''}
        AND e.created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', e.created_at)
        ORDER BY month DESC
        LIMIT 6
      )
      SELECT 
        'monthly_trends' as metric_type,
        json_agg(mp.*) as monthly_data
      FROM monthly_performance mp
      UNION ALL
      SELECT 
        'expense_trends' as metric_type,
        json_agg(ep.*) as monthly_data
      FROM expense_performance ep
    `;
    
    const result = await pool.query(performanceQuery, params);
    
    const performanceData = {};
    result.rows.forEach(row => {
      performanceData[row.metric_type] = row.monthly_data;
    });
    
    res.json(performanceData);
  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({ error: 'Failed to get performance analytics' });
  }
});

module.exports = router;