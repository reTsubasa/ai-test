import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuthStore, type User, type AuthTokens } from '../../stores/authStore';
import { authService, type ApiError } from '../../services/AuthService';
import { Loader2, User, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

// Password strength indicator
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = [
    '',
    'bg-destructive',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ];

  return {
    score: Math.min(score, 5),
    label: labels[score],
    color: colors[score],
  };
};

// Register form schema
const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username is required')
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be less than 30 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password || ''));
  }, [password]);

  const onSubmit = async (values: RegisterFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const { user, tokens } = await authService.register({
        username: values.username,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      setAuth(user, tokens);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Registration failed. Please try again.');
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
              <User className="h-6 w-6 text-primary" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Create an account
              </CardTitle>
              <CardDescription className="text-base">
                Join VyOS Web UI to manage your network
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
                  <User
                    className={cn(
                      'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
                      errors.username ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary',
                    )}
                  />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
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

              {/* Email field */}
              <div className="space-y-2 group">
                <Label
                  htmlFor="email"
                  className={cn(
                    'transition-colors group-focus-within:text-primary',
                    errors.email ? 'text-destructive' : '',
                  )}
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className={cn(
                      'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
                      errors.email ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary',
                    )}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className={cn('pl-9 transition-all', errors.email && 'border-destructive focus-visible:ring-destructive')}
                    {...register('email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
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
                    placeholder="Create a strong password"
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

                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'h-full flex-1 transition-all duration-300',
                            level <= passwordStrength.score ? passwordStrength.color : 'bg-muted',
                          )}
                        />
                      ))}
                    </div>
                    {passwordStrength.label && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle2
                          className={cn(
                            'h-3 w-3',
                            passwordStrength.score >= 3 ? 'text-green-500' : 'text-muted-foreground',
                          )}
                        />
                        Password strength: {passwordStrength.label}
                      </p>
                    )}
                  </div>
                )}

                {errors.password && (
                  <p className="flex items-center gap-1 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2 group">
                <Label
                  htmlFor="confirmPassword"
                  className={cn(
                    'transition-colors group-focus-within:text-primary',
                    errors.confirmPassword ? 'text-destructive' : '',
                  )}
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock
                    className={cn(
                      'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
                      errors.confirmPassword ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary',
                    )}
                  />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className={cn(
                      'pl-9 pr-9 transition-all',
                      errors.confirmPassword && 'border-destructive focus-visible:ring-destructive',
                    )}
                    {...register('confirmPassword')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={cn(
                      'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    )}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="flex items-center gap-1 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword.message}
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
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 border-t pt-4">
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-foreground transition-colors hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
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