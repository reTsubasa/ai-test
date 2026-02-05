import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { authService, type ApiError } from '../../services/AuthService';
import { Loader2, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { cn } from '../../utils/cn';

// Forgot password form schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

type FormState = 'email' | 'success' | 'error';

export function ForgotPasswordPage() {
  const [formState, setFormState] = useState<FormState>('email');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      await authService.forgotPassword(values.email);
      setFormState('success');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to send reset email. Please try again.');
      setFormState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
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
              <Mail className="h-6 w-6 text-primary" />
            </div>

            <div className="space-y-1">
              {formState === 'success' ? (
                <>
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Check your email
                  </CardTitle>
                  <CardDescription className="text-base">
                    We've sent you a password reset link
                  </CardDescription>
                </>
              ) : (
                <>
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Forgot password?
                  </CardTitle>
                  <CardDescription className="text-base">
                    Enter your email to reset your password
                  </CardDescription>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {formState === 'success' ? (
              <div className="space-y-5">
                {/* Success message */}
                <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-500">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Reset link sent!</p>
                    <p className="text-muted-foreground">
                      We've sent a password reset link to your email address. Please check your inbox and
                      follow the instructions to create a new password.
                    </p>
                  </div>
                </div>

                {/* Additional info */}
                <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Didn't receive the email?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>The link expires in 24 hours</li>
                  </ul>
                </div>

                {/* Back to login button */}
                <Button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full h-10 text-base transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 border-t pt-4">
            <div className="text-center text-sm">
              Remember your password?{' '}
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
          Need help? Contact{' '}
          <a
            href="mailto:support@vyos.local"
            className="underline underline-offset-4 hover:text-foreground"
          >
            support@vyos.local
          </a>
        </p>
      </div>
    </div>
  );
}