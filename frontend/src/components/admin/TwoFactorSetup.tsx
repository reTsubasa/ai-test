import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TwoFactorSetup as TwoFactorSetupType } from '../../stores/userManagementStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Shield, ShieldCheck, AlertCircle, Copy, Check } from 'lucide-react';
import userManagementService from '../../services/UserManagementService';

const verifyCodeSchema = z.object({
  code: z.string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must be numbers only'),
});

type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onComplete: (enabled: boolean) => void;
}

export function TwoFactorSetup({ isEnabled, onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<TwoFactorSetupType | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: '',
    },
  });

  const handleStartSetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await userManagementService.setupTwoFactor();
      setSetupData(data);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (data: VerifyCodeFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await userManagementService.verifyTwoFactor({ code: data.code });

      if (result.verified) {
        setStep('backup');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await userManagementService.disableTwoFactor();
      onComplete(false);
      setStep('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete(true);
    setStep('complete');
    reset();
  };

  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  if (step === 'complete') {
    return (
      <Card className="border-green-500/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <CardTitle>Two-Factor Authentication Enabled</CardTitle>
          </div>
          <CardDescription>
            Your account is now protected with two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="success">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Setup Complete</AlertTitle>
            <AlertDescription>
              Your account is now secure. You'll need to enter a code from your authenticator app
              each time you log in. Make sure to save your backup codes in a safe place.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (step === 'backup' && setupData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Save Your Backup Codes</CardTitle>
          </div>
          <CardDescription>
            Store these codes in a safe place. You can use them to access your account if you lose
            your authenticator device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="grid grid-cols-2 gap-2">
              {setupData.backupCodes.map((code, index) => (
                <code
                  key={index}
                  className="block rounded bg-background px-2 py-1 text-sm font-mono"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'codes')}
            className="w-full"
          >
            {copiedCodes ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy All Codes
              </>
            )}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Each backup code can only be used once. After using a code, it will become invalid.
              Generate new codes if you lose access to your authenticator.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('setup');
                setSetupData(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleComplete} className="flex-1">
              I've Saved My Codes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify' && setupData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Verify Authenticator App</CardTitle>
          </div>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to complete setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4 rounded-lg border bg-muted/50 p-6">
            <div className="rounded-lg bg-white p-4">
              {/* QR Code would be rendered here - for now showing placeholder */}
              <div className="h-48 w-48 flex items-center justify-center bg-gray-100 text-gray-400">
                <div className="text-center">
                  <Shield className="mx-auto h-16 w-16 mb-2" />
                  <p className="text-sm">QR Code</p>
                  <p className="text-xs text-muted-foreground">
                    {setupData.qrCode.substring(0, 20)}...
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full space-y-2">
              <Label htmlFor="secret">Secret Key</Label>
              <div className="flex gap-2">
                <Input
                  id="secret"
                  value={setupData.secret}
                  readOnly
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(setupData.secret, 'secret')}
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                If you can't scan the QR code, enter this secret key manually.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleVerifyCode)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                autoFocus
                {...register('code')}
                className="text-center text-2xl tracking-widest"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('setup');
                  setSetupData(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid || isLoading} className="flex-1">
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          {isEnabled
            ? 'Your account is protected with two-factor authentication. Enter a code from your authenticator app when logging in.'
            : 'Add an extra layer of security to your account by enabling two-factor authentication.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Enhanced Security</AlertTitle>
          <AlertDescription>
            Two-factor authentication protects your account even if your password is compromised.
            You'll need a code from an authenticator app like Google Authenticator, Authy, or 1Password.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isEnabled ? (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDisableTwoFactor}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleStartSetup}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}