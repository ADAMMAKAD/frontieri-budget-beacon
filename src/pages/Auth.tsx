import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, Building2, Eye, EyeOff, Sparkles, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [businessUnits, setBusinessUnits] = useState<{id: string, name: string}[]>([]);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    department: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize with hardcoded business units (no API call needed for auth page)
  useEffect(() => {
    // Use hardcoded values for the auth page since API requires authentication
    setBusinessUnits([
      { id: '1', name: 'Elixone' },
      { id: '2', name: 'Capra' },
      { id: '3', name: 'Vasta' },
      { id: '4', name: 'Wash' }
    ]);
  }, []);

  const fetchBusinessUnits = async () => {
    try {
      const data = await apiClient.getBusinessUnits();
      setBusinessUnits(data.business_units || []);
    } catch (error) {
      console.error('Error fetching business units:', error);
      // Fallback to hardcoded values if API fails
      setBusinessUnits([
        { id: '1', name: 'Elixone' },
        { id: '2', name: 'Capra' },
        { id: '3', name: 'Vasta' },
        { id: '4', name: 'Wash' }
      ]);
    }
  };

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 rounded-2xl mx-auto opacity-20 animate-ping"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Frontieri PBMS</h2>
          <p className="text-gray-600 animate-pulse">Initializing your workspace...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is authenticated
  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in."
      });
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Registration failed",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (!registerData.department) {
      toast({
        title: "Registration failed",
        description: "Please select a department",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(
      registerData.email, 
      registerData.password, 
      registerData.fullName,
      registerData.department
    );
    
    if (error) {
      toast({
        title: "Registration failed",
        description: error.message || error.error || 'Registration failed',
        variant: "destructive"
      });
    } else {
      toast({
        title: "Registration successful!",
        description: "Welcome! You can now access the system."
      });
      
      // Auto-login after successful registration
      const loginResult = await signIn(registerData.email, registerData.password);
      if (!loginResult.error) {
        navigate('/');
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full opacity-5 animate-spin" style={{animationDuration: '20s'}}></div>
      </div>
      
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 shadow-2xl border-0 relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div className="absolute inset-0 w-12 h-12 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 rounded-2xl opacity-20 animate-ping"></div>
            </div>
            <div>
              <h1 className="font-bold text-2xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Frontieri</h1>
              <p className="text-sm text-gray-500 font-medium">Project Budget Management</p>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</CardTitle>
          <CardDescription className="text-gray-600">Access your workspace with secure authentication</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="login" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 p-1 rounded-xl">
              <TabsTrigger 
                value="login" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 transition-all duration-200"
              >
                <Mail className="w-4 h-4 mr-2" />
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 transition-all duration-200"
              >
                <User className="w-4 h-4 mr-2" />
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-orange-700 hover:to-red-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Sign In Securely
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium text-gray-700">Business Unit</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                    <Select
                      value={registerData.department}
                      onValueChange={(value) => setRegisterData(prev => ({ ...prev, department: value }))}
                      required
                    >
                      <SelectTrigger className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg transition-all duration-200">
                        <SelectValue placeholder="Select your business unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessUnits.map(unit => (
                          <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                        ))}
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerEmail" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="registerEmail"
                      type="email"
                      placeholder="Enter your email address"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPassword" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="registerPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a secure password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:via-orange-700 hover:to-amber-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
