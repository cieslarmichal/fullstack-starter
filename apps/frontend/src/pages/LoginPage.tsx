import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

export default function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(tab === 'register' ? 'register' : 'login');
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);

  useEffect(() => {
    if (tab === 'register') {
      setActiveTab('register');
    } else {
      setActiveTab('login');
    }
    // Reset registration success when changing tabs
    setIsRegistrationSuccess(false);
  }, [tab]);

  const handleTabChange = (newTab: 'login' | 'register') => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
    setIsRegistrationSuccess(false);
  };

  const handleRegistrationSuccess = () => {
    setIsRegistrationSuccess(true);
  };

  const handleBackToLogin = () => {
    setIsRegistrationSuccess(false);
    setActiveTab('login');
    setSearchParams({ tab: 'login' });
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
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Welcome aboard!</h3>
                <p className="text-slate-600">
                  Your account has been created successfully. You can now sign in with your credentials.
                </p>
              </div>
              <button
                onClick={handleBackToLogin}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Back to Sign In
              </button>
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 flex justify-center pt-40">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center flex flex-col justify-end pb-3">
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">{title}</h2>
        </div>

        {/* Tab Navigation */}
        {!isRegistrationSuccess && (
          <div className="flex justify-center">
            <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/50 shadow-sm">
              <button
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-teal-600 shadow-lg shadow-teal-500/10 scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
                onClick={() => handleTabChange('login')}
              >
                Sign In
              </button>
              <button
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-teal-600 shadow-lg shadow-teal-500/10 scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
                onClick={() => handleTabChange('register')}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl shadow-slate-900/5 p-6">
          {content}
        </div>
      </div>
    </div>
  );
}
