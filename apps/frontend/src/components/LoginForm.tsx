'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { loginUser } from '../api/queries/login';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { ApiError } from '../api/ApiError';

const formSchema = z.object({
  email: z.string().email().max(64),
  password: z.string().min(8).max(64),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await loginUser({ email: values.email, password: values.password });

      navigate('/');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.isErrorType('TooManyRequestsError')) {
          form.setError('root', {
            message: 'Too many login attempts. Please try again in a few minutes.',
          });
          return;
        }

        if (error.isErrorType('ForbiddenAccessError')) {
          const reason = error.getContextValue<string>('reason');

          if (reason === 'User email is not verified.') {
            form.setError('root', {
              message:
                'Your account has not been activated yet. Check your email inbox (including spam folder) and click the activation link to complete registration and log in.',
            });
            return;
          }
        }

        if (error.isErrorType('UnauthorizedAccessError')) {
          form.setError('root', {
            message: 'Invalid email address or password',
          });
          return;
        }

        form.setError('root', {
          message: error.message || 'An error occurred during login',
        });
        return;
      }

      form.setError('root', {
        message: 'Invalid email address or password',
      });
    }
  }

  return (
    <div className="px-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    placeholder="name@domain.com"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="password">Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      id="password"
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      className="h-11"
                      aria-invalid={!!fieldState.error}
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 font-medium transition-all duration-200 shadow-sm hover:shadow-md mt-6"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            data-testid="login-submit-button"
          >
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Form>
      {form.formState.errors.root && (
        <div className="text-destructive text-sm mt-3 text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          {form.formState.errors.root.message}
        </div>
      )}
    </div>
  );
}
