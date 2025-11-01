import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders, userEvent } from '@/tests/testUtils';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('should render email and password fields', async () => {
    await renderWithProviders(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Password field has a wrapper div due to the show/hide icon
    expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument();
  });

  it('should render sign in button', async () => {
    await renderWithProviders(<LoginForm />);

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should disable submit button when form is invalid', async () => {
    await renderWithProviders(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<LoginForm />);

    const passwordInput = screen.getByPlaceholderText(/^password$/i);
    const toggleButton = screen.getByLabelText(/show password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
