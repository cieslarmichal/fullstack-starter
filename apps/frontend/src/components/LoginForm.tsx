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
    } catch {
      form.setError('root', {
        message: 'Invalid email or password',
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
                <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
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

          <Button
            type="submit"
            className="w-full h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 font-medium transition-all duration-200 shadow-sm hover:shadow-md mt-6"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
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
