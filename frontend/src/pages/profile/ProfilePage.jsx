import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Lock, Building2, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import userService from '../../services/userService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'

export default function ProfilePage() {
  const { user, updateUserInContext } = useAuth()
  const queryClient = useQueryClient()

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || user?.name || '',
    department: user?.department || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const profileMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (updated) => {
      updateUserInContext(updated)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated!')
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to update profile'),
  })

  const passwordMutation = useMutation({
    mutationFn: (data) => userService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully!')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      setPasswordErrors({})
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to change password'),
  })

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    if (!profileForm.full_name.trim()) { toast.error('Name is required'); return }
    profileMutation.mutate(profileForm)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!passwordForm.current_password) errs.current_password = 'Current password is required'
    if (!passwordForm.new_password) errs.new_password = 'New password is required'
    else if (passwordForm.new_password.length < 8) errs.new_password = 'Must be at least 8 characters'
    if (passwordForm.new_password !== passwordForm.confirm_password)
      errs.confirm_password = 'Passwords do not match'
    if (Object.keys(errs).length) { setPasswordErrors(errs); return }
    setPasswordErrors({})
    const { confirm_password, ...data } = passwordForm
    passwordMutation.mutate(data)
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {getInitials(user?.full_name || user?.name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name || user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={user?.role}>{null}</Badge>
              {user?.department && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Building2 size={11} />
                  {user.department}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit profile form */}
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={16} className="text-blue-600" />
          Edit Profile
        </h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                placeholder="Your department..."
                className="w-full pl-9 pr-4 border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={15} />
            {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock size={16} className="text-orange-600" />
          Change Password
        </h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="Enter current password"
                className={`w-full pr-10 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${passwordErrors.current_password ? 'border-red-400' : 'border-gray-200'}`}
              />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordErrors.current_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.current_password}</p>}
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="Min. 8 characters"
                className={`w-full pr-10 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${passwordErrors.new_password ? 'border-red-400' : 'border-gray-200'}`}
              />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordErrors.new_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.new_password}</p>}
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPw ? 'text' : 'password'}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="Repeat new password"
                className={`w-full pr-10 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${passwordErrors.confirm_password ? 'border-red-400' : 'border-gray-200'}`}
              />
              <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordErrors.confirm_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.confirm_password}</p>}
          </div>

          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            <Lock size={15} />
            {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
