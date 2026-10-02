import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../components/Toast';
import { parseApiError } from '../api/client';
import { Droplet, Lock, Mail, ArrowRight, ShieldCheck, Clock, ShieldX, Building2, CheckCircle2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid clinical email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showApiError, showSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const stateData = location.state as {
    registeredEmail?: string;
    hospitalName?: string;
    message?: string;
  } | null;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: stateData?.registeredEmail || '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (stateData?.registeredEmail) {
      setValue('email', stateData.registeredEmail);
    }
  }, [stateData, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      await login(data);
      showSuccess('Logged in successfully', 'Authenticated');
      const origin = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    } catch (err: any) {
      const parsed = parseApiError(err);
      showApiError(parsed, 'Authentication Failed');
      if (parsed.details && parsed.details.length > 0) {
        const detailsMap: Record<string, string> = {};
        parsed.details.forEach((d) => {
          detailsMap[d.field] = d.message;
        });
        setFieldErrors(detailsMap);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header Branding */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-lg bg-[#0F6B63] flex items-center justify-center text-white shadow-md">
            <Droplet className="w-7 h-7 fill-white" aria-hidden="true" />
          </div>
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Blood Line Hospital Portal
        </h1>
        <p className="mt-1 text-center text-sm text-slate-600">
          Clinical blood ordering, emergency dispatch, and unit tracking
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-10">
          {stateData?.message && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold">Application Registered in Database:</span> {stateData.message}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-700 uppercase tracking-wider"
              >
                Clinical Staff Email
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`block w-full pl-9 pr-3 py-2 border rounded-md text-sm placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                    errors.email || fieldErrors.email
                      ? 'border-[#B3203A] text-slate-900'
                      : 'border-slate-300 text-slate-900'
                  }`}
                  placeholder="desk@cmch.org"
                  aria-invalid={!!(errors.email || fieldErrors.email)}
                  aria-describedby={
                    errors.email || fieldErrors.email ? 'email-error' : undefined
                  }
                />
              </div>
              {(errors.email || fieldErrors.email) && (
                <p id="email-error" className="mt-1 text-xs text-[#B3203A]">
                  {errors.email?.message || fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700 uppercase tracking-wider"
              >
                Portal Password
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`block w-full pl-9 pr-3 py-2 border rounded-md text-sm placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                    errors.password || fieldErrors.password
                      ? 'border-[#B3203A] text-slate-900'
                      : 'border-slate-300 text-slate-900'
                  }`}
                  placeholder="••••••••"
                  aria-invalid={!!(errors.password || fieldErrors.password)}
                  aria-describedby={
                    errors.password || fieldErrors.password ? 'password-error' : undefined
                  }
                />
              </div>
              {(errors.password || fieldErrors.password) && (
                <p id="password-error" className="mt-1 text-xs text-[#B3203A]">
                  {errors.password?.message || fieldErrors.password}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-[#0F6B63] hover:bg-[#0A4B45] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F6B63] transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Blood Desk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* New Hospital Registration Link */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col items-center gap-1.5 text-center">
            <span className="text-xs text-slate-500 font-medium">Need institutional blood requisition accreditation?</span>
            <Link
              to="/register"
              className="text-xs font-bold text-[#0F6B63] hover:text-[#0A4B45] hover:underline flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Register New Hospital / Healthcare Institution &rarr;</span>
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Hospital Access only · Role HOSPITAL enforced · Central MySQL DB Persistence
          </div>
        </div>
      </div>
    </div>
  );
};
