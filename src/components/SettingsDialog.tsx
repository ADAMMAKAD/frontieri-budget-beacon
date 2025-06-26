
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, User, Palette, Bell, Globe, Shield, Sparkles, Monitor, Moon, Sun, Mail, AlertTriangle, CheckCircle, Tag, DollarSign, Camera, TrendingUp, Zap, Lock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PasswordChangeDialog } from './PasswordChangeDialog';
import { TwoFactorDialog } from './TwoFactorDialog';
import ProfileManagement from './ProfileManagement';
import ExpenseManagement from './ExpenseManagement';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    budgetAlerts: true,
    expenseApprovals: true
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:from-orange-100 hover:to-red-100 hover:border-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Settings className="h-4 w-4 text-orange-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-red-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto bg-gradient-to-br from-gray-50 to-orange-50/30 border-orange-200">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center space-x-3 text-2xl font-bold">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Advanced Settings</span>
              <p className="text-sm font-normal text-gray-600 mt-1">Customize your experience and preferences</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white/70 backdrop-blur-sm border border-orange-200 shadow-lg rounded-xl p-1">
            <TabsTrigger 
              value="profile" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Theme</span>
            </TabsTrigger>
            <TabsTrigger 
              value="currency" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Currency</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Alerts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <ProfileManagement />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-3 text-orange-700">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  <span>Appearance & Theme</span>
                </CardTitle>
                <CardDescription className="text-orange-600/80">Customize the visual experience of your workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-xl p-6 border border-orange-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label htmlFor="theme" className="text-lg font-semibold text-gray-800">Theme Mode</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Switch between light and dark interface themes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                      theme === 'light' 
                        ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-orange-300'
                    }`}>
                      <Sun className="h-6 w-6 text-orange-500" />
                      <div>
                        <p className="font-medium text-gray-800">Light Mode</p>
                        <p className="text-xs text-gray-600">Bright & clean</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2">
                      <Switch
                        id="theme"
                        checked={theme === 'dark'}
                        onCheckedChange={toggleTheme}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500"
                      />
                      <span className="text-xs text-gray-500 font-medium">Toggle</span>
                    </div>
                    
                    <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'border-orange-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-orange-300'
                    }`}>
                      <Moon className="h-6 w-6 text-orange-500" />
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Dark Mode</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Easy on eyes</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Monitor className="h-5 w-5 text-orange-600" />
                    <h4 className="font-semibold text-orange-700">Display Preferences</h4>
                  </div>
                  <p className="text-sm text-orange-600/80 mb-4">Additional customization options coming soon</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/60 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-gray-700">Compact Mode</p>
                      <p className="text-xs text-gray-500">Coming Soon</p>
                    </div>
                    <div className="p-3 bg-white/60 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-gray-700">Color Accent</p>
                      <p className="text-xs text-gray-500">Coming Soon</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="currency" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-3 text-orange-700">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <span>Currency & Localization</span>
                </CardTitle>
                <CardDescription className="text-orange-600/80">Configure your preferred currency and regional settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-xl p-6 border border-orange-100">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currency" className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-orange-600" />
                        <span>Default Currency</span>
                      </Label>
                      <p className="text-sm text-gray-600 mt-1 mb-3">
                        This currency will be used for all budget calculations and displays
                      </p>
                    </div>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="bg-white border-orange-200 focus:border-orange-500 focus:ring-orange-500/20">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-orange-200">
                        {availableCurrencies.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code} className="hover:bg-orange-50">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{curr.symbol}</span>
                              <div>
                                <span className="font-medium">{curr.name}</span>
                                <span className="text-gray-500 ml-2">({curr.code})</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                  <h4 className="font-semibold text-orange-700 mb-3">Regional Settings</h4>
                  <p className="text-sm text-orange-600/80 mb-4">Additional localization options</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/60 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-gray-700">Date Format</p>
                      <p className="text-xs text-gray-500">MM/DD/YYYY (Default)</p>
                    </div>
                    <div className="p-3 bg-white/60 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-gray-700">Number Format</p>
                      <p className="text-xs text-gray-500">1,234.56 (Default)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-3 text-orange-700">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <span>Notification Center</span>
                </CardTitle>
                <CardDescription className="text-orange-600/80">Control how and when you receive important updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-xl p-6 border border-orange-100 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <Label htmlFor="email-notifications" className="text-base font-semibold text-gray-800">Email Notifications</Label>
                        <p className="text-sm text-gray-600">
                          Receive important updates and alerts via email
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications.email}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, email: checked }))
                      }
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <Label htmlFor="budget-alerts" className="text-base font-semibold text-gray-800">Budget Alerts</Label>
                        <p className="text-sm text-gray-600">
                          Get notified when budgets approach or exceed limits
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="budget-alerts"
                      checked={notifications.budgetAlerts}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, budgetAlerts: checked }))
                      }
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <Label htmlFor="expense-approvals" className="text-base font-semibold text-gray-800">Expense Approvals</Label>
                        <p className="text-sm text-gray-600">
                          Notifications for expense status changes and approvals
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="expense-approvals"
                      checked={notifications.expenseApprovals}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, expenseApprovals: checked }))
                      }
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500"
                    />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                  <h4 className="font-semibold text-orange-700 mb-3 flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Smart Notifications</span>
                  </h4>
                  <p className="text-sm text-orange-600/80 mb-4">AI-powered notification preferences coming soon</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/60 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-gray-700">Smart Timing</p>
                      <p className="text-xs text-gray-500">Optimal delivery times</p>
                    </div>
                    <div className="p-3 bg-white/60 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-gray-700">Priority Filtering</p>
                      <p className="text-xs text-gray-500">Important alerts only</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-3 text-orange-700">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span>Expense Management</span>
                </CardTitle>
                <CardDescription className="text-orange-600/80">Streamline your expense workflow and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-xl p-6 border border-orange-100 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <Label htmlFor="default-category" className="text-base font-semibold text-gray-800">Default Expense Category</Label>
                    </div>
                    <Select>
                      <SelectTrigger className="bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 h-12">
                        <SelectValue placeholder="Select your preferred default category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">📋 Office Supplies</SelectItem>
                        <SelectItem value="travel">✈️ Travel & Transportation</SelectItem>
                        <SelectItem value="meals">🍽️ Meals & Entertainment</SelectItem>
                        <SelectItem value="equipment">💻 Equipment & Technology</SelectItem>
                        <SelectItem value="marketing">📢 Marketing & Advertising</SelectItem>
                        <SelectItem value="training">📚 Training & Development</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600">This category will be pre-selected when creating new expenses</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                        <Globe className="h-4 w-4 text-white" />
                      </div>
                      <Label htmlFor="approval-limit" className="text-base font-semibold text-gray-800">Auto-approval Limit</Label>
                    </div>
                    <input
                      id="approval-limit"
                      type="number"
                      placeholder="Enter maximum auto-approval amount"
                      className="w-full bg-white border border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 h-12 px-3 rounded-md"
                    />
                    <p className="text-sm text-gray-600">Expenses below this amount will be automatically approved</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                  <h4 className="font-semibold text-orange-700 mb-3 flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Smart Expense Features</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Settings className="h-4 w-4 text-orange-600" />
                        <p className="text-sm font-medium text-gray-700">Receipt Scanning</p>
                      </div>
                      <p className="text-xs text-gray-500">AI-powered receipt data extraction</p>
                    </div>
                    <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="h-4 w-4 text-orange-600" />
                        <p className="text-sm font-medium text-gray-700">Spending Analytics</p>
                      </div>
                      <p className="text-xs text-gray-500">Intelligent spending pattern insights</p>
                    </div>
                    <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="h-4 w-4 text-orange-600" />
                        <p className="text-sm font-medium text-gray-700">Quick Submit</p>
                      </div>
                      <p className="text-xs text-gray-500">One-click expense submission</p>
                    </div>
                    <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-4 w-4 text-orange-600" />
                        <p className="text-sm font-medium text-gray-700">Policy Compliance</p>
                      </div>
                      <p className="text-xs text-gray-500">Automatic policy validation</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-3 text-orange-700">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <span>Security Center</span>
                </CardTitle>
                <CardDescription className="text-orange-600/80">Protect your account with advanced security features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-xl p-6 border border-orange-100 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-base font-semibold text-gray-800">Password Management</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <PasswordChangeDialog />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <Label className="text-base font-semibold text-gray-800">Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-600">
                          Add an extra layer of security to your account
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-xs text-red-600 font-medium">Not Enabled</span>
                        </div>
                      </div>
                    </div>
                    <TwoFactorDialog />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-xl p-6 border border-orange-100">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                        <Monitor className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-base font-semibold text-gray-800">Session Management</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Active Sessions</Label>
                      <Button variant="outline" className="w-full bg-white border-orange-200 hover:bg-orange-50 hover:border-orange-300">
                        Manage Sessions
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                  <h4 className="font-semibold text-orange-700 mb-3 flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Security Insights</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium text-gray-700">Password Strength</p>
                      </div>
                      <p className="text-xs text-gray-500">Strong password detected</p>
                    </div>
                    <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Monitor className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium text-gray-700">Last Login</p>
                      </div>
                      <p className="text-xs text-gray-500">2 hours ago from Chrome</p>
                    </div>
                    <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-4 w-4 text-orange-600" />
                        <p className="text-sm font-medium text-gray-700">Security Score</p>
                      </div>
                      <p className="text-xs text-gray-500">85/100 - Good</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
