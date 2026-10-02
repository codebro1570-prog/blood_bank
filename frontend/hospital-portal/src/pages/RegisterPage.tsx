import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  FileBadge,
  User,
  Phone,
  MapPin,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { useToast } from '../components/Toast';
import { parseApiError } from '../api/client';

const hospitalRegisterSchema = z
  .object({
    name: z.string().min(3, 'Hospital/Facility name must be at least 3 characters'),
    licenseNo: z.string().min(4, 'Accredited medical license number is required'),
    contactPerson: z.string().min(2, 'Contact person or clinical lead name is required'),
    phone: z.string().min(8, 'Valid telephone number is required'),
    city: z.string().min(2, 'City is required'),
    address: z.string().min(5, 'Full facility address is required'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid official email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type HospitalRegisterFormData = z.infer<typeof hospitalRegisterSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HospitalRegisterFormData>({
    resolver: zodResolver(hospitalRegisterSchema),
    defaultValues: {
      name: '',
      licenseNo: '',
      contactPerson: '',
      phone: '',
      city: '',
      address: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: HospitalRegisterFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await authApi.registerHospital({
        name: data.name.trim(),
        licenseNo: data.licenseNo.trim().toUpperCase(),
        contactPerson: data.contactPerson.trim(),
        phone: data.phone.trim(),
        city: data.city.trim(),
        address: data.address.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      showSuccess(
        `Hospital application submitted for ${response.fullName}! Registered with ID #${response.id} in database.`
      );

      navigate('/login', {
        state: {
          registeredEmail: data.email,
          hospitalName: data.name,
          status: 'PENDING',
          message:
            'Hospital application successfully persisted to database! Accreditation status is PENDING verification by Blood Line Administrator.',
        },
      });
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message || 'Hospital registration failed. Please review your information.');
      showError(parsed.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0F6B63] text-white shadow-md mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Blood Line — Hospital Accreditation
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Register your hospital or surgical center for clinical blood requisition access on Blood Line
          </p>
        </div>

        {/* Form Container */}
        <div className="mt-8 bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {/* Institutional Compliance Notice */}
          <div className="mb-6 p-4 rounded-lg bg-teal-50 border border-teal-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0F6B63] shrink-0 mt-0.5" />
            <div className="text-xs text-teal-900 leading-relaxed">
              <span className="font-semibold">Regulatory Verification Protocol:</span> New hospital registrations are directly committed to the central database with status <span className="font-mono font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded">PENDING</span>. The Blood Line Administrator verifies hospital state medical licensing and accreditations before blood requisitions can be fulfilled.
            </div>
          </div>

          {serverError && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Facility Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Hospital / Institution Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Apollo Speciality Care"
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6B63] ${
                      errors.name ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Medical License / Accreditation No *
                </label>
                <div className="relative">
                  <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    {...register('licenseNo')}
                    placeholder="e.g. MED-LIC-TN-9844"
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6B63] ${
                      errors.licenseNo ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.licenseNo && <p className="mt-1 text-xs text-rose-600">{errors.licenseNo.message}</p>}
              </div>
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Lead / Contact Person *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    {...register('contactPerson')}
                    placeholder="e.g. Dr. K. Ramanathan, MD"
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6B63] ${
                      errors.contactPerson ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.contactPerson && (
                  <p className="mt-1 text-xs text-rose-600">{errors.contactPerson.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Telephone / Emergency Contact *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="e.g. 044-28290200"
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6B63] ${
                      errors.phone ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
              </div>
            </div>

            {/* City & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    {...register('city')}
                    placeholder="e.g. Chennai"
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6B63] ${
                      errors.city ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.city && <p className="mt-1 text-xs text-rose-600">{errors.city.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Facility Physical Address *
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="e.g. 21 Greams Lane, Thousand Lights"
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6B63] ${
                    errors.address ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {errors.address && <p className="mt-1 text-xs text-rose-600">{errors.address.message}</p>}
              </div>
            </div>

            {/* Account Credentials */}
            <div className="pt-3 border-t border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Blood Desk Portal Access Credentials
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Official Clinical Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="e.g. bloodbank@apollocare.org"
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6B63] ${
                        errors.email ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Password (min 8 characters, letter + number) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="password"
                        {...register('password')}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6B63] ${
                          errors.password ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="password"
                        {...register('confirmPassword')}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F6B63] ${
                          errors.confirmPassword ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-[#0F6B63] hover:bg-[#0A4B45] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F6B63] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Application to Database...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Hospital Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Already accredited or registered?</span>
            <Link
              to="/login"
              className="font-semibold text-[#0F6B63] hover:text-[#0A4B45] hover:underline"
            >
              Sign In to Hospital Blood Desk &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
