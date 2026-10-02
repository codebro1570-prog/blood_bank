/**
 * Donor Portal Registration Page (/register)
 * Fields: fullName, email, password (with strength hint), confirm password,
 * phone, date of birth (must be 18-65), gender, weightKg (min 50 warning but allow submit),
 * blood group (dropdown of the 8 groups), city.
 * Validates with Zod. POST /auth/register/donor. On success goes to /login with success message.
 * Displays EMAIL_EXISTS inline on email field.
 */

import React, { useState, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  Scale,
  MapPin,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { useToast } from '../components/Toast';
import { BloodGroupCode, Gender, ApiError } from '../types';
import { AxiosError } from 'axios';

const BLOOD_GROUPS: BloodGroupCode[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

// Helper to compute age as of reference date
function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const today = new Date('2026-10-01');
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    dob: z
      .string()
      .min(1, 'Date of birth is required')
      .refine((val) => {
        const age = calculateAge(val);
        return age >= 18 && age <= 65;
      }, {
        message: 'Donor age must be between 18 and 65 years old',
      }),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    weightKg: z
      .number()
      .min(30, 'Please enter a realistic weight in kg')
      .max(250, 'Please enter a valid weight in kg'),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    city: z.string().min(2, 'City is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// Password strength evaluator
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: 'Not entered', color: 'bg-neutral-200' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
  return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const phoneId = useId();
  const dobId = useId();
  const genderId = useId();
  const weightKgId = useId();
  const bloodGroupId = useId();
  const cityId = useId();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dob: '1998-05-20',
      gender: 'MALE',
      weightKg: 65,
      bloodGroup: 'O+',
      city: 'Coimbatore',
    },
  });

  const watchedPassword = watch('password', '');
  const watchedWeight = watch('weightKg', 65);
  const passwordStrength = getPasswordStrength(watchedPassword);

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await authApi.registerDonor({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        dob: data.dob,
        gender: data.gender,
        weightKg: Number(data.weightKg),
        bloodGroup: data.bloodGroup,
        city: data.city,
      });

      showSuccess('Registration successful! Please sign in with your new account.');
      navigate('/login', {
        state: {
          successMessage: 'Account created successfully! You can now log in.',
          registeredEmail: data.email,
        },
      });
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiError>;
      const apiErr = axiosErr.response?.data;

      if (apiErr?.code === 'EMAIL_EXISTS') {
        setError('email', {
          type: 'server',
          message: apiErr.message || 'An account with this email address already exists.',
        });
      } else if (apiErr?.details && apiErr.details.length > 0) {
        apiErr.details.forEach((detail) => {
          if (detail.field in data) {
            setError(detail.field as keyof RegisterFormData, {
              type: 'server',
              message: detail.message,
            });
          }
        });
      }

      setServerError(apiErr?.message || 'Registration failed. Please check the form errors.');
      showError(apiErr?.message || 'Unable to complete donor registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#B3203A] text-white shadow-md mb-2">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Blood Line — Donor Registration
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600">
            Join the community of lifesavers. Your donation can save up to 3 lives.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-neutral-200/90 rounded-2xl">
          {serverError && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <ShieldAlert className="w-4 h-4 text-[#B3203A] shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={fullNameId}
                  className="block text-xs font-semibold text-neutral-700 mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id={fullNameId}
                    type="text"
                    autoComplete="name"
                    {...register('fullName')}
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>
                )}
              </div>

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
                    className={`block w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors ${
                      errors.email ? 'border-red-400 bg-red-50/20' : 'border-neutral-300'
                    }`}
                    placeholder="donor@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    autoComplete="new-password"
                    {...register('password')}
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                    placeholder="Min 6 characters"
                  />
                </div>
                {/* Password Strength Meter */}
                {watchedPassword && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full flex-1 rounded-full ${
                          passwordStrength.score >= 1 ? passwordStrength.color : 'bg-neutral-200'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full ${
                          passwordStrength.score >= 2 ? passwordStrength.color : 'bg-neutral-200'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full ${
                          passwordStrength.score >= 3 ? passwordStrength.color : 'bg-neutral-200'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-500">
                      Strength: {passwordStrength.label}
                    </span>
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor={confirmPasswordId}
                  className="block text-xs font-semibold text-neutral-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id={confirmPasswordId}
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                    placeholder="Repeat password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Phone & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={phoneId}
                  className="block text-xs font-semibold text-neutral-700 mb-1"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id={phoneId}
                    type="tel"
                    autoComplete="tel"
                    {...register('phone')}
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor={dobId}
                  className="block text-xs font-semibold text-neutral-700 mb-1"
                >
                  Date of Birth (Must be 18–65 years)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id={dobId}
                    type="date"
                    {...register('dob')}
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                  />
                </div>
                {errors.dob && (
                  <p className="text-xs text-red-600 mt-1">{errors.dob.message}</p>
                )}
              </div>
            </div>

            {/* Gender, Blood Group & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor={genderId}
                  className="block text-xs font-semibold text-neutral-700 mb-1"
                >
                  Gender
                </label>
                <select
                  id={genderId}
                  {...register('gender')}
                  className="block w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="text-xs text-red-600 mt-1">{errors.gender.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor={bloodGroupId}
                  className="block text-xs font-semibold text-neutral-700 mb-1"
                >
                  Blood Group
                </label>
                <select
                  id={bloodGroupId}
                  {...register('bloodGroup')}
                  className="block w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors font-bold text-[#B3203A]"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
                {errors.bloodGroup && (
                  <p className="text-xs text-red-600 mt-1">{errors.bloodGroup.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor={weightKgId}
                  className="block text-xs font-semibold text-neutral-700 mb-1"
                >
                  Weight (kg)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <input
                    id={weightKgId}
                    type="number"
                    step="0.5"
                    {...register('weightKg', { valueAsNumber: true })}
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                    placeholder="60"
                  />
                </div>
                {errors.weightKg && (
                  <p className="text-xs text-red-600 mt-1">{errors.weightKg.message}</p>
                )}
              </div>
            </div>

            {/* Weight Warning if < 50kg (Allows submit) */}
            {watchedWeight && Number(watchedWeight) < 50 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Minimum weight advisory</p>
                  <p className="text-amber-800 leading-snug">
                    Standard whole blood donation requires donors to weigh at least 50 kg. You may still complete registration now, but you will need to reach 50 kg to donate blood.
                  </p>
                </div>
              </div>
            )}

            {/* City */}
            <div>
              <label
                htmlFor={cityId}
                className="block text-xs font-semibold text-neutral-700 mb-1"
              >
                City / District
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id={cityId}
                  type="text"
                  autoComplete="address-level2"
                  {...register('city')}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                  placeholder="e.g. Coimbatore, Chennai, Bengaluru"
                />
              </div>
              {errors.city && (
                <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#B3203A] hover:bg-[#991B32] disabled:opacity-50 transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:ring-offset-2 outline-none cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Complete Donor Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Link to Login */}
          <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#B3203A] hover:underline focus-visible:ring-2 focus-visible:ring-[#B3203A] rounded px-1 outline-none"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
