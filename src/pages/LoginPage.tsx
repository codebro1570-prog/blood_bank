import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
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
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@bloodbank.org',
      password: 'Admin@123',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setFormError(null);
    try {
      await login(data.email, data.password);
      showSuccessToast('Authenticated session established successfully.');
      navigate(from, { replace: true });
    } catch (err: any) {
      const parsed = parseApiError(err);
      setFormError(parsed.message);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    setValue('email', email);
    setValue('password', 'Admin@123');
    onSubmit({ email, password: 'Admin@123' });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-[#B3203A] text-white rounded-md mx-auto flex items-center justify-center font-bold text-2xl shadow-md">
          +
        </div>
        <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
          HEMA-BANK OPERATIONS
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-mono tracking-wide">
          CLINICAL STAFF & ADMINISTRATIVE SECURE PORTAL
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 sm:px-8 border border-slate-200 rounded shadow-sm space-y-5">
          {formError && (
            <div
              role="alert"
              className="bg-rose-50 border border-[#B3203A]/30 text-rose-900 p-3 rounded text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-[#B3203A] shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Authorized Work Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-900 focus-visible:outline-none"
                  placeholder="operator@bloodbank.org"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-[#B3203A] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  {...register('password')}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-900 focus-visible:outline-none"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-[#B3203A] mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded bg-[#1F2A3C] hover:bg-[#151D2A] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Mock Login Preset Accounts */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block mb-2 text-center">
              Contract Demo Quick Access (1-Click Login):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@bloodbank.org')}
                className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-semibold text-amber-900 text-center transition-colors"
              >
                Admin (Full Access)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff1@bb.org')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-[11px] font-semibold text-blue-900 text-center transition-colors"
              >
                Staff (Clinical Queue)
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 font-mono">
              Any password accepted in mock mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
