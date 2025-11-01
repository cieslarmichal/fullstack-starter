import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');

  const activeTab = tab === 'register' ? 'register' : 'login';
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);

  const handleTabChange = (newTab: 'login' | 'register') => {
    const params: Record<string, string> = { tab: newTab };
    setSearchParams(params);
    setIsRegistrationSuccess(false);
  };

  const handleRegistrationSuccess = () => {
    setIsRegistrationSuccess(true);
  };

  const handleBackToLogin = () => {
    setIsRegistrationSuccess(false);
    const params: Record<string, string> = { tab: 'login' };
    setSearchParams(params);
  };

  const getTabContent = () => {
    if (activeTab === 'login') {
      return {
        title: 'Log into your account',
        content: <LoginForm />,
      };
    }

    if (activeTab === 'register') {
      if (isRegistrationSuccess) {
        return {
          title: 'Account Created Successfully!',
          content: (
            <div className="px-6 text-center space-y-6">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto border-2 border-black">
                  <svg
                    className="w-8 h-8 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-black">Welcome aboard!</h3>
                <p className="text-gray-600">
                  Your account has been created successfully. You can now sign in with your credentials.
                </p>
              </div>
              <Button
                onClick={handleBackToLogin}
                variant="default"
                size="lg"
                className="w-full h-11 rounded-lg shadow-sm hover:shadow-md"
                data-testid="back-to-sign-in-button"
              >
                Back to Sign In
              </Button>
            </div>
          ),
        };
      }
      return {
        title: 'Create Account',
        content: <RegisterForm onSuccess={handleRegistrationSuccess} />,
      };
    }

    return { title: '', content: null };
  };

  const { title, content } = getTabContent();

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center pt-32">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center flex flex-col justify-end pb-3">
          <h2 className="text-3xl font-bold text-black leading-tight tracking-tight">{title}</h2>
        </div>

        {/* Tab Navigation */}
        {!isRegistrationSuccess && (
          <div className="flex justify-center">
            <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
              <Button
                variant={activeTab === 'login' ? 'default' : 'ghost'}
                size="sm"
                className="px-6 py-3 text-sm font-semibold rounded-lg"
                onClick={() => handleTabChange('login')}
                data-testid="login-tab-button"
              >
                Sign In
              </Button>
              <Button
                variant={activeTab === 'register' ? 'default' : 'ghost'}
                size="sm"
                className="px-6 py-3 text-sm font-semibold rounded-lg"
                onClick={() => handleTabChange('register')}
                data-testid="register-tab-button"
              >
                Sign Up
              </Button>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">{content}</div>
      </div>
    </div>
  );
}
