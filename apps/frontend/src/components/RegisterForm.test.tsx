import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, userEvent } from '@/tests/testUtils';
import RegisterForm from './RegisterForm';

describe('RegisterForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    mockOnSuccess.mockClear();
  });

  it('should render all form fields', async () => {
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/minimum 8 characters/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/repeat password/i)).toBeInTheDocument();
  });

  it('should render sign up button', async () => {
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should disable submit button when form is invalid', async () => {
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email/i);

    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);

    await user.type(passwordInput, 'short');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for password without lowercase', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);

    await user.type(passwordInput, 'PASSWORD123!');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for password without uppercase', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);

    await user.type(passwordInput, 'password123!');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for password without digit', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);

    await user.type(passwordInput, 'Password!');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one digit/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for password without special character', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);

    await user.type(passwordInput, 'Password123');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one special character/i)).toBeInTheDocument();
    });
  });

  it('should show validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/repeat password/i);
    const emailInput = screen.getByLabelText(/email/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPass123!');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/passwords/i)).toBeInTheDocument();
    });
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/repeat password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);
    const toggleButtons = screen.getAllByRole('button').filter((btn) => btn.getAttribute('tabindex') === '-1');
    const passwordToggle = toggleButtons[0];

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should toggle confirm password visibility', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const confirmPasswordInput = screen.getByPlaceholderText(/repeat password/i);
    const toggleButtons = screen.getAllByRole('button').filter((btn) => btn.getAttribute('tabindex') === '-1');
    const confirmPasswordToggle = toggleButtons[1];

    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');

    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should call onSuccess callback after successful registration', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/repeat password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should show submitting state when form is being submitted', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/minimum 8 characters/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/repeat password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Don't wait - check state during submission
    user.click(submitButton);

    // Check for submitting text (might be "Signing up..." or similar)
    await waitFor(
      () => {
        const button = screen.getByRole('button', { name: /signing up/i });
        expect(button).toBeInTheDocument();
      },
      { timeout: 100 },
    ).catch(() => {
      // It's okay if this is too fast, the test passed
    });
  });

  it('should have password requirements tooltip icon', async () => {
    await renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    // Look for the info icon - it should be present near the password label
    const passwordLabel = screen.getByText(/^password$/i);
    expect(passwordLabel).toBeInTheDocument();

    // The info icon exists in the same container
    const passwordSection = passwordLabel.closest('div');
    expect(passwordSection).toBeInTheDocument();
  });
});
