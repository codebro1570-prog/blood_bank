import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { parseApiError } from '../api/client';
import { useToast } from '../components/ToastContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccessToast, showErrorToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setFormError(null);
    try {
      await login(data.email, data.password);
      showSuccessToast('Administrator authenticated successfully.');
      navigate(from, { replace: true });
    } catch (err: any) {
      const parsed = parseApiError(err);
      setFormError(parsed.message || 'Invalid credentials. Please verify email and password.');
      showErrorToast(parsed.message || 'Invalid credentials.', parsed.code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 bg-rose-700 text-white rounded-xl mx-auto flex items-center justify-center font-bold text-2xl shadow-lg border border-rose-500/30">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Blood Line Administrator Portal
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-mono tracking-wide">
          SYSTEM AUDIT, STAFF ROLES & HOSPITAL ACCREDITATION
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-md py-6 px-6 sm:px-8 border border-slate-700 rounded-xl shadow-2xl space-y-5">

          {formError && (
            <div
              role="alert"
              className="bg-rose-950/60 border border-rose-800 text-rose-200 p-3 rounded-lg text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Admin Work Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-8 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  placeholder="admin@bloodbank.org"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  {...register('password')}
                  className="w-full pl-8 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
