import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserPlus,
  Search,
  Check,
  X,
  Shield,
  UserCheck,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Clock,
  User,
  Lock,
  Mail,
} from 'lucide-react';
import { adminApi } from '../api/admin.api';
import { AuthUser, PageResponse } from '../types';
import { parseApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/ToastContext';

const newStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type NewStaffForm = z.infer<typeof newStaffSchema>;

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();

  const [data, setData] = useState<PageResponse<AuthUser> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);

  // Create Staff Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState<boolean>(false);
  const [submittingStaff, setSubmittingStaff] = useState<boolean>(false);

  // Toggle Active Confirmation Dialog
  const [toggleTargetUser, setToggleTargetUser] = useState<AuthUser | null>(null);
  const [submittingToggle, setSubmittingToggle] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewStaffForm>({
    resolver: zodResolver(newStaffSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers({
        q: search.trim() || undefined,
        role: roleFilter || undefined,
        active: activeFilter !== '' ? activeFilter === 'true' : undefined,
        page,
        size,
      });
      setData(res);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, activeFilter, page, size, showErrorToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onAddStaff = async (formData: NewStaffForm) => {
    setSubmittingStaff(true);
    try {
      const newUser = await adminApi.createStaff(formData);
      showSuccessToast(
        `Staff account created for ${newUser.fullName} (${newUser.email}). Credentials active.`
      );
      setIsAddStaffOpen(false);
      reset();
      fetchUsers();
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!toggleTargetUser || submittingToggle) return;

    // Guard: Prevent admin from deactivating their own row
    if (toggleTargetUser.id === currentUser?.id || toggleTargetUser.email === currentUser?.email) {
      showErrorToast('You cannot deactivate your own account.');
      setToggleTargetUser(null);
      return;
    }

    setSubmittingToggle(true);
    try {
      const nextActiveState = !toggleTargetUser.active;
      const updated = await adminApi.updateUserActive(toggleTargetUser.id, nextActiveState);
      showSuccessToast(
        `Account for ${updated.fullName} (${updated.email}) is now ${updated.active ? 'ACTIVE' : 'DEACTIVATED'}.`
      );
      setToggleTargetUser(null);
      fetchUsers();
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setSubmittingToggle(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus-visible:outline-none"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(0);
            }}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus-visible:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={fetchUsers}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh users"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              reset();
              setIsAddStaffOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors focus-visible:outline-none"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Staff</span>
          </button>
        </div>
      </div>

      {/* Main Table: (email, name, role, active, created) */}
      {loading && !data ? (
        <TableSkeleton rows={6} columns={6} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={fetchUsers} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="No user accounts found"
          description="Adjust your search filters or register a new staff operator."
          actionLabel="Create Staff Account"
          onAction={() => setIsAddStaffOpen(true)}
        />
      ) : (
        <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">Email Address</th>
                  <th scope="col" className="px-3.5 py-2.5">Full Name</th>
                  <th scope="col" className="px-3 py-2.5">Role</th>
                  <th scope="col" className="px-3 py-2.5">Active Status</th>
                  <th scope="col" className="px-3 py-2.5">Created Date</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {data.content.map((u) => {
                  const isSelf = u.id === currentUser?.id || u.email === currentUser?.email;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/75 transition-colors ${
                        isSelf ? 'bg-amber-50/15' : ''
                      }`}
                    >
                      {/* Email */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-mono text-slate-900 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{u.email}</span>
                          {isSelf && (
                            <span className="font-mono text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-800">
                        {u.fullName}
                      </td>

                      {/* Role */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            u.role === 'ADMIN'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-blue-50 text-blue-900 border-blue-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <X className="w-3 h-3" /> Deactivated
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '2026-09-01'}
                      </td>

                      {/* Actions: Toggle Active with Confirmation */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {isSelf ? (
                          /* Prevent admin from deactivating their own row */
                          <div className="relative inline-block group">
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded border border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed"
                              title="You cannot deactivate your own account"
                            >
                              <Shield className="w-3 h-3" />
                              <span>Deactivate</span>
                            </button>
                            <span className="sr-only">You cannot deactivate your own account</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setToggleTargetUser(u)}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors focus-visible:outline-none ${
                              u.active
                                ? 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800'
                                : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.active ? (
                              <>
                                <X className="w-3 h-3 text-[#B3203A]" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            size={data.size}
            totalElements={data.totalElements}
            totalPages={data.totalPages}
            onPageChange={(p) => setPage(p)}
            onSizeChange={(s) => setSize(s)}
          />
        </div>
      )}

      {/* CREATE STAFF DIALOG (email, full name, password) */}
      {isAddStaffOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-md w-full shadow-xl animate-in fade-in">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-slate-700" />
                <span>Create Staff Operator Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onAddStaff)} className="p-4 space-y-3.5 text-xs">
              <p className="text-slate-600">
                Register a new staff operator. Staff members can log whole blood intakes, run serology tests, and process hospital requisitions.
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Full Name <span className="text-[#B3203A]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Priya Raman"
                  {...register('fullName')}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none"
                />
                {errors.fullName && (
                  <p className="text-[11px] text-[#B3203A] mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Email Address <span className="text-[#B3203A]">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. priya.staff@bloodbank.org"
                  {...register('email')}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none font-mono"
                />
                {errors.email && (
                  <p className="text-[11px] text-[#B3203A] mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Initial Password <span className="text-[#B3203A]">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  {...register('password')}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none font-mono"
                />
                {errors.password && (
                  <p className="text-[11px] text-[#B3203A] mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  disabled={submittingStaff}
                  className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submittingStaff && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>{submittingStaff ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOGGLE ACTIVE CONFIRMATION DIALOG */}
      {toggleTargetUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-sm w-full p-4 shadow-xl space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>
                Confirm Account {toggleTargetUser.active ? 'Deactivation' : 'Reactivation'}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to {toggleTargetUser.active ? 'deactivate' : 'reactivate'}{' '}
              <strong>{toggleTargetUser.fullName}</strong> ({toggleTargetUser.email})?
            </p>
            {toggleTargetUser.active && (
              <p className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded border border-rose-200">
                This operator will immediately be prevented from logging into the portal and signing records.
              </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setToggleTargetUser(null)}
                disabled={submittingToggle}
                className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleActive}
                disabled={submittingToggle}
                className={`px-3.5 py-1.5 rounded text-white font-bold flex items-center gap-1 disabled:opacity-50 ${
                  toggleTargetUser.active
                    ? 'bg-[#B3203A] hover:bg-[#971930]'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {submittingToggle && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>
                  Confirm {toggleTargetUser.active ? 'Deactivate' : 'Activate'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
