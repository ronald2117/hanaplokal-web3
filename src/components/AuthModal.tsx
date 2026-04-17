import { useState } from 'react';
import { X, ShieldCheck, Camera, Bell, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isFirebaseConfigured } from '../lib/firebase';

export default function AuthModal() {
  const {
    showAuthModal,
    closeAuthModal,
    login,
    loginWithEmail,
    signupWithEmail,
    authBusy,
    authError,
    clearAuthError,
  } = useApp();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!showAuthModal) return null;

  const submitEmailAuth = async () => {
    if (authMode === 'signup') {
      await signupWithEmail(email, password);
      return;
    }
    await loginWithEmail(email, password);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAuthModal} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-slide-up shadow-2xl">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Join HanapLokal</h2>
          <p className="text-gray-500 text-sm mt-2">
            Sign up or log in to verify prices and contribute.
          </p>
        </div>

        {authError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <p>{authError}</p>
            <button
              onClick={clearAuthError}
              className="mt-2 text-xs font-semibold text-red-600 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {[
            { icon: Camera, text: 'Upload price photos & videos' },
            { icon: ShieldCheck, text: 'Vouch for accurate prices' },
            { icon: MessageCircle, text: 'Comment and discuss with community' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-orange-500" />
              </div>
              {item.text}
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-2xl border border-gray-200 p-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              disabled={authBusy}
              onClick={() => setAuthMode('login')}
              className={`py-2 rounded-xl text-sm font-semibold transition-colors ${
                authMode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Log In
            </button>
            <button
              disabled={authBusy}
              onClick={() => setAuthMode('signup')}
              className={`py-2 rounded-xl text-sm font-semibold transition-colors ${
                authMode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />
            <input
              type="password"
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={authMode === 'signup' ? 'Password (min 6 chars)' : 'Password'}
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />
            <button
              disabled={authBusy}
              onClick={() => {
                void submitEmailAuth();
              }}
              className="w-full h-11 rounded-xl bg-orange-500 text-white text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {authBusy ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Log In with Email'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-[11px] font-semibold tracking-wide text-gray-400">OR</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <button
          disabled={authBusy}
          onClick={() => {
            void login('google');
          }}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {authBusy ? 'Please wait...' : 'Continue with Google'}
        </button>

        {/* <button
          disabled={authBusy}
          onClick={() => {
            void login('facebook');
          }}
          className="w-full py-4 mt-3 bg-gray-900 text-white font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-transform text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Continue with Facebook
        </button> */}

        <p className="text-center text-xs text-gray-400 mt-4">By continuing, you agree to our Terms of Service</p>
        {!isFirebaseConfigured && (
          <p className="text-center text-xs text-amber-600 mt-2">
            Firebase keys are not set. Auth currently uses local prototype mode.
          </p>
        )}
      </div>
    </div>
  );
}
