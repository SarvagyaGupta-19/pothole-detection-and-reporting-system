"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Shield, Mail, ArrowRight, Navigation } from "lucide-react";
import { useState, Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsEmailLoading(true);
    
    await signIn("email", { 
      email, 
      redirect: false,
      callbackUrl 
    });
    
    setIsEmailLoading(false);
    setEmailSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
      {/* Background aesthetics */}
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-blue-100/50 to-transparent"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px]"></div>

      <div className="relative w-full max-w-md z-10">
        <div className="glass-card rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/60">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-10">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
              <Navigation className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
            <p className="text-gray-500 font-medium">Sign in to report hazards and view your impact.</p>
          </div>

          {searchParams.get("callbackUrl") === "/dashboard" && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-amber-800">
                Please sign in to access your personal dashboard and report history.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isEmailLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-bold py-3.5 px-4 border border-gray-200 rounded-2xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <div className="relative py-3 flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Magic Link Email Form */}
            {emailSent ? (
              <div className="text-center p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <Mail className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-emerald-900 mb-1">Check your inbox</h3>
                <p className="text-sm text-emerald-700">A magic sign-in link has been sent to {email}.</p>
              </div>
            ) : (
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEmailLoading || isGoogleLoading}
                  required
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isEmailLoading || isGoogleLoading || !email}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md shadow-gray-900/10 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isEmailLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Continue with Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-500 font-medium">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
