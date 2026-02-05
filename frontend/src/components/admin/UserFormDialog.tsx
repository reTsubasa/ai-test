import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, UserRole } from '../../stores/userManagementStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, Shield, User as UserIcon } from 'lucide-react';

const userSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters'),
  role: z.enum(['admin', 'user', 'readonly', 'operator']),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.password && data.password !== data.confirmPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  },
).refine(
  (data) => {
    // Password is required only for new users
    return data.password !== undefined;
  },
  {
    message: 'Password is required for new users',
    path: ['password'],
  },
);

type UserFormData = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  user?: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => Promise<void>;
}

export function UserFormDialog({
  user,
  open,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'user',
      isActive: true,
    },
  });

  const watchedRole = watch('role');
  const watchedIsActive = watch('isActive');

  useEffect(() => {
    setIsNewUser(!user);
    if (user) {
      setValue('username', user.username);
      setValue('email', user.email);
      setValue('fullName', user.fullName || '');
      setValue('role', user.role);
      setValue('isActive', user.isActive);
    } else {
      reset({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: 'user',
        isActive: true,
      });
    }
    setError(null);
  }, [user, open, setValue, reset]);

  const handleFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // For existing users, don't send password if it's empty
      const submitData = isNewUser ? data : {
        ...data,
        password: data.password || undefined,
        confirmPassword: undefined,
      };

      await onSubmit(submitData as UserFormData);
      onOpenChange(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const roleOptions: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'admin',
      label: 'Administrator',
      description: 'Full access to all system features',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      value: 'operator',
      label: 'Operator',
      description: 'Can manage network configurations',
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      value: 'user',
      label: 'User',
      description: 'Can view and perform basic operations',
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      value: 'readonly',
      label: 'Read Only',
      description: 'View only access to the system',
      icon: <UserIcon className="h-4 w-4" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {user
              ? 'Update user information. Changes will be saved immediately.'
              : 'Create a new user account and assign their role and permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              placeholder="e.g., john_doe"
              disabled={!!user || isSubmitting}
              {...register('username')}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g., john.doe@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="e.g., John Doe"
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {isNewUser && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  {...register('password', {
                    onChange: () => {
                      trigger('confirmPassword');
                    },
                  })}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  {...register('confirmPassword', {
                    onChange: () => {
                      trigger('password');
                    },
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={watchedRole}
              onValueChange={(value) => setValue('role', value as UserRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-start gap-2">
                      {option.icon}
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="isActive" className="flex-1">
              Active Account
            </Label>
            <Switch
              id="isActive"
              checked={watchedIsActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Disabled accounts cannot log in to the system.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid || !isDirty}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                user ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}