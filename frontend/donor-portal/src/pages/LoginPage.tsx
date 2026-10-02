/**
 * Donor Portal Login Page (/login)
 * Link to register, clear errors for INVALID_CREDENTIALS and ACCOUNT_DISABLED.
 */

import React, { useState, useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Heart,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Ban,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../components/Toast';
import { AxiosError } from 'axios';
import { ApiError } from '../types';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [authErrorType, setAuthErrorType] = useState<'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED' | 'GENERAL' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailId = useId();
  const passwordId = useId();

  const stateData = location.state as {
    from?: { pathname: string };
    successMessage?: string;
    registeredEmail?: string;
  } | null;

  const validRoutes = [
    '/dashboard',
    '/donations',
    '/eligibility',
    '/profile',
    '/notifications',
    '/compatibility',
  ];
  const targetFrom = stateData?.from?.pathname;
  const from = targetFrom && validRoutes.includes(targetFrom) ? targetFrom : '/dashboard';
  const initialSuccessMessage = stateData?.successMessage;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: stateData?.registeredEmail || '',
      password: '',
    },
  });

  useEffect(() => {
    if (stateData?.registeredEmail) {
      setValue('email', stateData.registeredEmail);
    }
  }, [stateData, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthErrorType(null);
    setErrorMessage(null);

    try {
      const response = await login(data);
      showSuccess(`Welcome back, ${response.user.fullName}!`);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiError>;
      const apiErr = axiosErr.response?.data;
      const code = apiErr?.code;

      if (code === 'INVALID_CREDENTIALS') {
        setAuthErrorType('INVALID_CREDENTIALS');
        setErrorMessage(apiErr?.message || 'Invalid email or password. Please verify your credentials and try again.');
        setError('password', {
          type: 'server',
          message: 'Invalid password for this account',
        });
      } else if (code === 'ACCOUNT_DISABLED') {
        setAuthErrorType('ACCOUNT_DISABLED');
        setErrorMessage(apiErr?.message || 'Your donor account is deactivated. Please contact blood bank staff.');
      } else {
        setAuthErrorType('GENERAL');
        setErrorMessage(apiErr?.message || 'Unable to sign in. Please verify your internet connection.');
      }

      if (apiErr?.details && apiErr.details.length > 0) {
        apiErr.details.forEach((detail) => {
          if (detail.field === 'email' || detail.field === 'password') {
            setError(detail.field as 'email' | 'password', {
              type: 'server',
              message: detail.message,
            });
          }
        });
      }

      showError(apiErr?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#B3203A] text-white shadow-md mb-3 transition-transform hover:scale-105">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Blood Line Donor Portal
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-neutral-600">
            Sign in to check eligibility, view donations, and save lives
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-neutral-200/90 rounded-2xl">
          {/* Success Banner if newly registered */}
          {initialSuccessMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Complete</p>
                <p className="text-emerald-800">{initialSuccessMessage}</p>
              </div>
            </div>
          )}



          {/* Specific Error Banners */}
          {authErrorType === 'INVALID_CREDENTIALS' && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-900">
              <ShieldAlert className="w-4 h-4 text-[#B3203A] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-950">Invalid Credentials</p>
                <p className="text-red-800 leading-snug mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {authErrorType === 'ACCOUNT_DISABLED' && (
            <div className="mb-5 p-3.5 rounded-xl bg-neutral-100 border border-neutral-300 flex items-start gap-2.5 text-xs text-neutral-900">
              <Ban className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-950">Account Deactivated</p>
                <p className="text-neutral-700 leading-snug mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {authErrorType === 'GENERAL' && errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
              <ShieldAlert className="w-4 h-4 text-[#B3203A] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor={emailId}
                className="block text-xs font-semibold text-neutral-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:border-transparent outline-none transition-colors"
                  placeholder="donor@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor={passwordId}
                className="block text-xs font-semibold text-neutral-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id={passwordId}
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:border-transparent outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-[#B3203A] hover:bg-[#991B32] disabled:opacity-50 transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:ring-offset-2 outline-none cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign in to Donor Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Link to Register */}
          <div className="mt-6 pt-5 border-t border-neutral-100 flex flex-col items-center gap-2 text-center">
            <p className="text-xs text-neutral-600">
              Don't have a donor account yet?
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B3203A] hover:underline focus-visible:ring-2 focus-visible:ring-[#B3203A] rounded px-2 py-1 outline-none"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register as a new blood donor</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
