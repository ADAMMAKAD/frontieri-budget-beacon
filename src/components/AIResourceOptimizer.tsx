import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Zap,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  ArrowRight,
  Star,
  Cpu,
  Database,
  Network,
  Gauge
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface OptimizationRecommendation {
  id: string;
  category: 'budget' | 'team' | 'timeline' | 'resource';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    savings?: number;
    efficiency?: number;
    timeReduction?: number;
    riskReduction?: number;
  };
  confidence: number;
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
  estimatedROI: number;
}

interface ResourceAllocation {
  id: string;
  name: string;
  currentAllocation: number;
  recommendedAllocation: number;
  utilizationRate: number;
  efficiency: number;
  cost: number;
  type: 'human' | 'financial' | 'technical';
}

interface AIInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'prediction' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  dataPoints: number;
}

export function AIResourceOptimizer() {
  const { formatCurrency } = useCurrency();
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [resourceAllocations, setResourceAllocations] = useState<ResourceAllocation[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [optimizationScore, setOptimizationScore] = useState(0);

  useEffect(() => {
    generateRecommendations();
    generateResourceAllocations();
    generateAIInsights();
    calculateOptimizationScore();
    setLoading(false);
  }, []);

  const generateRecommendations = () => {
    const mockRecommendations: OptimizationRecommendation[] = [
      {
        id: '1',
        category: 'budget',
        priority: 'high',
        title: 'Reallocate Marketing Budget to High-ROI Channels',
        description: 'AI analysis shows 23% better ROI potential by shifting $50K from traditional to digital marketing.',
        impact: {
          savings: 50000,
          efficiency: 23,
          riskReduction: 15
        },
        confidence: 87,
        effort: 'medium',
        implementation: [
          'Analyze current marketing channel performance',
          'Identify top-performing digital channels',
          'Gradually shift budget allocation',
          'Monitor and adjust based on results'
        ],
        estimatedROI: 145
      },
      {
        id: '2',
        category: 'team',
        priority: 'critical',
        title: 'Optimize Team Composition for Project Alpha',
        description: 'Current team structure shows 31% underutilization. Recommend restructuring for optimal efficiency.',
        impact: {
          efficiency: 31,
          timeReduction: 2.5,
          savings: 75000
        },
        confidence: 92,
        effort: 'high',
        implementation: [
          'Conduct skills assessment',
          'Identify role overlaps and gaps',
          'Restructure team composition',
          'Implement new workflow processes'
        ],
        estimatedROI: 220
      },
      {
        id: '3',
        category: 'resource',
        priority: 'medium',
        title: 'Automate Repetitive Budget Reporting Tasks',
        description: 'ML analysis identifies 40+ hours/week of manual work that can be automated.',
        impact: {
          efficiency: 67,
          timeReduction: 40,
          savings: 25000
        },
        confidence: 78,
        effort: 'low',
        implementation: [
          'Identify automation opportunities',
          'Select appropriate tools',
          'Implement automated workflows',
          'Train team on new processes'
        ],
        estimatedROI: 180
      },
      {
        id: '4',
        category: 'timeline',
        priority: 'high',
        title: 'Accelerate Project Beta Delivery',
        description: 'Predictive analysis suggests 3-week acceleration possible with resource reallocation.',
        impact: {
          timeReduction: 3,
          efficiency: 18,
          savings: 35000
        },
        confidence: 84,
        effort: 'medium',
        implementation: [
          'Analyze critical path dependencies',
          'Reallocate high-impact resources',
          'Implement parallel processing',
          'Monitor progress closely'
        ],
        estimatedROI: 165
      }
    ];
    setRecommendations(mockRecommendations);
  };

  const generateResourceAllocations = () => {
    const allocations: ResourceAllocation[] = [
      {
        id: '1',
        name: 'Development Team',
        currentAllocation: 75,
        recommendedAllocation: 85,
        utilizationRate: 92,
        efficiency: 87,
        cost: 450000,
        type: 'human'
      },
      {
        id: '2',
        name: 'Marketing Budget',
        currentAllocation: 60,
        recommendedAllocation: 45,
        utilizationRate: 68,
        efficiency: 72,
        cost: 120000,
        type: 'financial'
      },
      {
        id: '3',
        name: 'Infrastructure',
        currentAllocation: 40,
        recommendedAllocation: 55,
        utilizationRate: 85,
        efficiency: 91,
        cost: 80000,
        type: 'technical'
      },
      {
        id: '4',
        name: 'QA Team',
        currentAllocation: 50,
        recommendedAllocation: 65,
        utilizationRate: 78,
        efficiency: 83,
        cost: 200000,
        type: 'human'
      },
      {
        id: '5',
        name: 'Research & Development',
        currentAllocation: 30,
        recommendedAllocation: 40,
        utilizationRate: 95,
        efficiency: 89,
        cost: 300000,
        type: 'financial'
      }
    ];
    setResourceAllocations(allocations);
  };

  const generateAIInsights = () => {
    const insights: AIInsight[] = [
      {
        id: '1',
        type: 'pattern',
        title: 'Seasonal Budget Variance Pattern Detected',
        description: 'Q4 consistently shows 15% higher spending. Consider adjusting quarterly allocations.',
        confidence: 89,
        actionable: true,
        dataPoints: 156
      },
      {
        id: '2',
        type: 'anomaly',
        title: 'Unusual Resource Utilization in Project Gamma',
        description: 'Resource consumption 34% above similar projects. Investigate potential inefficiencies.',
        confidence: 76,
        actionable: true,
        dataPoints: 89
      },
      {
        id: '3',
        type: 'prediction',
        title: 'Budget Overrun Risk for Q4 Projects',
        description: 'Current trajectory suggests 12% budget overrun risk. Early intervention recommended.',
        confidence: 82,
        actionable: true,
        dataPoints: 234
      },
      {
        id: '4',
        type: 'optimization',
        title: 'Cross-Project Resource Sharing Opportunity',
        description: 'AI identifies potential for 20% efficiency gain through resource sharing between Projects A and C.',
        confidence: 71,
        actionable: true,
        dataPoints: 67
      }
    ];
    setAiInsights(insights);
  };

  const calculateOptimizationScore = () => {
    // Mock calculation based on various factors
    const score = 73; // This would be calculated based on actual metrics
    setOptimizationScore(score);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'human': return <Users className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'technical': return <Cpu className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'prediction': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'optimization': return <Target className="h-4 w-4 text-green-500" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Resource Optimizer
          </h1>
          <p className="text-gray-600 mt-1">Intelligent recommendations for optimal resource allocation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Analysis
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure AI
          </Button>
        </div>
      </div>

      {/* Optimization Score */}
      <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Overall Optimization Score</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{optimizationScore}/100</div>
                <div className="flex-1">
                  <Progress value={optimizationScore} className="h-3 bg-white/20" />
                  <p className="text-sm mt-1 text-purple-100">
                    {optimizationScore >= 80 ? 'Excellent' : 
                     optimizationScore >= 60 ? 'Good' : 
                     optimizationScore >= 40 ? 'Fair' : 'Needs Improvement'} optimization level
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Gauge className="h-16 w-16 text-white/80 mb-2" />
              <p className="text-sm text-purple-100">AI Confidence: 87%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="allocation">Resource Allocation</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{rec.category}</Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm text-gray-500">{rec.confidence}% confidence</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{rec.title}</h3>
                      <p className="text-gray-600 mb-4">{rec.description}</p>
                      
                      {/* Impact Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {rec.impact.savings && (
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(rec.impact.savings)}
                            </div>
                            <div className="text-xs text-gray-600">Potential Savings</div>
                          </div>
                        )}
                        {rec.impact.efficiency && (
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-blue-600">
                              +{rec.impact.efficiency}%
                            </div>
                            <div className="text-xs text-gray-600">Efficiency Gain</div>
                          </div>
                        )}
                        {rec.impact.timeReduction && (
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <Clock className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-purple-600">
                              -{rec.impact.timeReduction}w
                            </div>
                            <div className="text-xs text-gray-600">Time Saved</div>
                          </div>
                        )}
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <Target className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                          <div className="text-lg font-bold text-orange-600">
                            {rec.estimatedROI}%
                          </div>
                          <div className="text-xs text-gray-600">Est. ROI</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        Effort: <span className={`font-medium ${getEffortColor(rec.effort)}`}>
                          {rec.effort.toUpperCase()}
                        </span>
                      </span>
                      <Progress value={rec.confidence} className="w-24 h-2" />
                    </div>
                    <Button size="sm">
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <div className="grid gap-4">
            {resourceAllocations.map((resource) => (
              <Card key={resource.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getResourceTypeIcon(resource.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{resource.name}</h3>
                        <p className="text-sm text-gray-500">{formatCurrency(resource.cost)} annual cost</p>
                      </div>
                    </div>
                    <Badge variant="outline">{resource.type}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Current Allocation</div>
                      <div className="text-lg font-bold">{resource.currentAllocation}%</div>
                      <Progress value={resource.currentAllocation} className="h-2 mt-1" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Recommended</div>
                      <div className="text-lg font-bold text-blue-600">{resource.recommendedAllocation}%</div>
                      <Progress value={resource.recommendedAllocation} className="h-2 mt-1" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Utilization</div>
                      <div className="text-lg font-bold">{resource.utilizationRate}%</div>
                      <Progress value={resource.utilizationRate} className="h-2 mt-1" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Efficiency</div>
                      <div className="text-lg font-bold text-green-600">{resource.efficiency}%</div>
                      <Progress value={resource.efficiency} className="h-2 mt-1" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {resource.recommendedAllocation > resource.currentAllocation ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : resource.recommendedAllocation < resource.currentAllocation ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-600">
                        {resource.recommendedAllocation > resource.currentAllocation ? 'Increase recommended' :
                         resource.recommendedAllocation < resource.currentAllocation ? 'Decrease recommended' :
                         'Optimal allocation'}
                      </span>
                    </div>
                    <Button size="sm" variant="outline">
                      Apply Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {aiInsights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getInsightTypeIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{insight.type}</Badge>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm text-gray-500">{insight.confidence}% confidence</span>
                        </div>
                        <span className="text-xs text-gray-400">{insight.dataPoints} data points</span>
                        {insight.actionable && (
                          <Badge className="bg-green-100 text-green-800">Actionable</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                      <p className="text-gray-600 mb-3">{insight.description}</p>
                      <div className="flex items-center justify-between">
                        <Progress value={insight.confidence} className="w-32 h-2" />
                        {insight.actionable && (
                          <Button size="sm" variant="outline">
                            Take Action
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={rec.id} className="border-l-4 border-blue-400 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <div className="ml-8">
                      <div className="space-y-2">
                        {rec.implementation.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{step}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                        <span>Effort: <span className={getEffortColor(rec.effort)}>{rec.effort}</span></span>
                        <span>ROI: <span className="text-green-600">{rec.estimatedROI}%</span></span>
                        <span>Confidence: {rec.confidence}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIResourceOptimizer;