'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { registerUser } from '../api/queries/register';
import { useState } from 'react';
import { z } from 'zod';
import { EyeIcon, EyeOffIcon, InfoIcon } from 'lucide-react';

const formSchema = z
  .object({
    email: z.string().email('Invalid email address').max(64),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(64)
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one digit')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords must match',
    path: ['passwordConfirmation'],
  });

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      passwordConfirmation: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await registerUser({
        email: values.email,
        password: values.password,
      });

      onSuccess?.();
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Registration error',
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
                <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@domain.com"
                    className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 placeholder:text-gray-400"
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
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs"
                    >
                      <p>
                        Password must contain at least 8 characters, one lowercase letter, one uppercase letter, one
                        digit and one special character.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Minimum 8 characters"
                      type={showPassword ? 'text' : 'password'}
                      className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 placeholder:text-gray-400"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Repeat password"
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 placeholder:text-gray-400"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      tabIndex={-1}
                    >
                      {showPasswordConfirmation ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 font-medium transition-all duration-200 shadow-sm hover:shadow-md mt-6"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
      </Form>
      {form.formState.errors.root && (
        <div className="text-red-600 text-sm mt-3 text-center bg-red-50 border border-red-200 rounded-lg p-3">
          {form.formState.errors.root.message}
        </div>
      )}
    </div>
  );
}
