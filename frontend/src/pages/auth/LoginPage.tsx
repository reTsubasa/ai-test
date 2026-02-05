import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuthStore, type User, type AuthTokens } from '../../stores/authStore';
import { authService, type ApiError } from '../../services/AuthService';
import { Loader2, Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').min(3, 'Username must be at least 3 characters'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const { user, tokens } = await authService.login(values);
      setAuth(user, tokens);
      navigate(from, { replace: true });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Animated background gradient */}
      <div
        className={cn(
          'absolute inset-0 -z-10 transition-all duration-1000 ease-out',
          'bg-gradient-to-br from-primary/5 via-transparent to-primary/5',
          animateIn ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        className={cn(
          'w-full max-w-md transition-all duration-700 ease-out',
          animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        )}
      >
        <Card className="border-border/50 shadow-2xl shadow-black/5">
          <CardHeader className="space-y-3 text-center pb-2">
            {/* Logo/Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20">
              <Lock className="h-6 w-6 text-primary" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription className="text-base">
                Sign in to your VyOS Web UI account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username field */}
              <div className="space-y-2 group">
                <Label
                  htmlFor="username"
                  className={cn(
                    'transition-colors group-focus-within:text-primary',
                    errors.username ? 'text-destructive' : '',
                  )}
                >
                  Username
                </Label>
                <div className="relative">
                  <UserIcon
                    className={cn(
                      'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
                      errors.username ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary',
                    )}
                  />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className={cn('pl-9 transition-all', errors.username && 'border-destructive focus-visible:ring-destructive')}
                    {...register('username')}
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <p className="flex items-center gap-1 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3 w-3" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2 group">
                <Label
                  htmlFor="password"
                  className={cn(
                    'transition-colors group-focus-within:text-primary',
                    errors.password ? 'text-destructive' : '',
                  )}
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    className={cn(
                      'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
                      errors.password ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary',
                    )}
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={cn(
                      'pl-9 pr-9 transition-all',
                      errors.password && 'border-destructive focus-visible:ring-destructive',
                    )}
                    {...register('password')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    )}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-10 text-base transition-all hover:shadow-lg hover:shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 border-t pt-4">
            <div className="flex w-full justify-between text-sm">
              <Link
                to="/forgot-password"
                className="text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
              >
                Forgot password?
              </Link>
              {import.meta.env.VITE_ALLOW_REGISTRATION !== 'false' && (
                <Link
                  to="/register"
                  className="font-medium text-foreground transition-colors hover:underline underline-offset-4"
                >
                  Create account
                </Link>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}