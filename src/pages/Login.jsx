// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Package } from 'lucide-react';

const roleRouteMap = {
  admin: '/admin/dashboard',
  superadmin: '/admin/dashboard',
  manager: '/manager/dashboard',
  i_manager: '/manager/dashboard',
  inventory_manager: '/manager/dashboard',
  w_staff: '/warehouse/dashboard',
  warehouse: '/warehouse/dashboard',
  warehouse_staff: '/warehouse/dashboard',
  user: '/', // fallback
};

function normalizeRole(rawRole) {
  if (!rawRole) return null;
  return String(rawRole).trim().toLowerCase();
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      const data = response?.data || response;

      const message = data?.message;
      const verificationRequired = data?.verificationRequired;
      const userFromServer = data?.user || null;
      const tokenFromServer = data?.token || null;

      if (verificationRequired) {
        toast.info('Please check your email for verification code');
        navigate('/verify', { state: { email: data?.email || email, context: data } });
        setLoading(false);
        return;
      }

      if (!message || !message.toLowerCase().includes('login successful')) {
        toast.error(message || 'Login failed');
        setLoading(false);
        return;
      }

      // Determine role from multiple possible locations
      const rawRole =
        data?.role ||
        data?.user?.role ||
        (Array.isArray(data?.user?.roles) ? data.user.roles[0] : null) ||
        null;

      const role = normalizeRole(rawRole);

      if (!role) {
        console.error('BACKEND DID NOT SEND ROLE!');
        toast.error('Login failed: No role returned from server.');
        setLoading(false);
        return;
      }

      const userData = userFromServer || {
        id: 1,
        name: 'User',
        email,
        role,
      };
      const authToken = tokenFromServer || 'demo-token-12345';

      login(userData, authToken);
      toast.success('Login successful!');

      // If a protected route wanted to return, go there (but ensure role allows it)
      if (from) {
        navigate(from, { replace: true });
        setLoading(false);
        return;
      }

      const target = roleRouteMap[role] || '/';
      navigate(target, { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Login failed. Please try again.';
      console.error('Login error:', error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome to StockMaster</CardTitle>
            <CardDescription>
              Enter your credentials to access the inventory system
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@stockmaster.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Login with your registered credentials
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
