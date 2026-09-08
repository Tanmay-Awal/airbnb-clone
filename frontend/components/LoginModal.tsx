'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

export const LoginModal: React.FC = () => {
  const router = useRouter();
  const { showLoginModal, setShowLoginModal, login, signup } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'guest' | 'host'>('guest');
  const [showPassword, setShowPassword] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Status feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showLoginModal) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [showLoginModal]);

  if (!isRendered) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);

    if (mode === 'login') {
      const res = await login(email.trim(), password.trim());
      setIsSubmitting(false);

      if (res.success && res.user) {
        showToast('Logged in successfully!', 'success');
        setShowLoginModal(false);
        router.push('/');
      } else {
        let friendlyErr = res.error || 'Failed to log in.';
        if (friendlyErr.toLowerCase().includes('failed to fetch')) {
          friendlyErr = 'Unable to connect to backend server. Please verify backend is running on port 8000.';
        }
        showToast(friendlyErr, 'error');
      }
    } else {
      // Sign up flow
      if (!name.trim()) {
        setIsSubmitting(false);
        showToast('Please enter your full name to sign up.', 'error');
        return;
      }

      const res = await signup(email.trim(), password.trim(), name.trim(), role);
      setIsSubmitting(false);

      if (res.success && res.user) {
        showToast(`Account created! Welcome, ${res.user.name}!`, 'success');
        setShowLoginModal(false);
        router.push('/');
      } else {
        let friendlyErr = res.error || 'Failed to create account.';
        if (friendlyErr.toLowerCase().includes('failed to fetch')) {
          friendlyErr = 'Unable to connect to backend server. Please verify backend is running on port 8000.';
        }
        showToast(friendlyErr, 'error');
      }
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with Smooth Fade-In / Fade-Out */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => !isSubmitting && setShowLoginModal(false)}
      />

      {/* Compact Modal Box with Scale & Fade-In / Fade-Out Transition */}
      <div
        className={`relative bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-[400px] shadow-2xl transition-all duration-300 ease-out overflow-hidden border border-airbnb-border dark:border-gray-800 z-10 ${
          isVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => !isSubmitting && setShowLoginModal(false)}
            aria-label="Close"
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer text-airbnb-black dark:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-bold text-airbnb-black dark:text-white">
            {mode === 'login' ? 'Log in' : 'Create an account'}
          </h2>
          <div className="w-5" />
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-airbnb-black dark:text-white mb-1">
            {mode === 'login' ? 'Welcome back to Airbnb' : 'Join Airbnb'}
          </h3>
          <p className="text-xs text-gray-500 mb-4 font-medium">
            {mode === 'login'
              ? 'Enter your registered email and password to log in.'
              : 'Create a new account stored directly in the database.'}
          </p>

          {/* Form */}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Full Name Input (Required for Sign Up) */}
            {mode === 'signup' && (
              <div className="relative animate-in fade-in duration-200">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required={mode === 'signup'}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-[#262626] text-airbnb-black dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:border-transparent placeholder:text-gray-400 disabled:opacity-50"
                />
              </div>
            )}

            {/* Account Role Selector (Sign Up Mode) */}
            {mode === 'signup' && (
              <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-[#262626] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRole('guest')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'guest'
                      ? 'bg-white dark:bg-[#1A1A1A] text-airbnb-black dark:text-white shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Traveler / Guest</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('host')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'host'
                      ? 'bg-white dark:bg-[#1A1A1A] text-airbnb-black dark:text-white shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Property Host</span>
                </button>
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                disabled={isSubmitting}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-[#262626] text-airbnb-black dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:border-transparent placeholder:text-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                disabled={isSubmitting}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-[#262626] text-airbnb-black dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:border-transparent placeholder:text-gray-400 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-airbnb-red hover:bg-airbnb-darkRed disabled:opacity-75 text-white py-3 rounded-xl font-bold text-xs cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 mt-1 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'login' ? 'Authenticating...' : 'Creating Account...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Log in' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Mode Switcher Toggle Footer */}
          <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 font-medium">
            {mode === 'login' ? (
              <div>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-bold text-airbnb-black dark:text-white hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            ) : (
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-airbnb-black dark:text-white hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
