import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../../firebase/auth'
import { useAuth } from '../../hooks/useAuth'

const BROWN = '#A67B50'
const BG_LEFT = '#EDECEA'
const BG_RIGHT = '#F5F4F2'

const barHeights = [28, 38, 32, 44, 36, 52, 48, 56, 60, 52, 68, 64, 100]

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError('Sign-in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div
        className="hidden md:flex md:w-1/2 flex-col p-8"
        style={{ backgroundColor: BG_LEFT }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: BROWN }}
          >
            P
          </div>
          <span className="text-sm font-medium text-gray-800">poomoo</span>
        </div>

        {/* Headline + description */}
        <div className="mt-20 flex-1">
          <h1 className="text-4xl font-black leading-tight text-gray-900">
            All your savings funds,<br />in one quiet dashboard.
          </h1>
          <p className="mt-4 text-sm text-gray-500 leading-relaxed">
            Upload a spreadsheet per fund. Edit by chatting.<br />
            Track every ringgit, together.
          </p>

          {/* Dashboard card mockup */}
          <div className="mt-10 bg-white rounded-2xl p-5 shadow-sm max-w-xs">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-400">Total saved</span>
              <span className="text-lg font-bold text-gray-900">RM&nbsp;84,200</span>
            </div>
            <div className="flex items-end gap-1" style={{ height: '64px' }}>
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i === barHeights.length - 1 ? BROWN : '#DDD9D4',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Chat chip */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-xs text-gray-600 shadow-sm border border-gray-100">
            <span style={{ color: BROWN }}>✦</span>
            "Add RM 300 to Retirement"
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400">v1.0 · prototype</p>
      </div>

      {/* Right panel */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8"
        style={{ backgroundColor: BG_RIGHT }}
      >
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Sign in to continue. New here? The same button signs you up.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-xl text-gray-800 font-medium border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.6 29.3 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.9 0 20-7.9 20-21 0-1.3-.1-2.7-.4-4z" />
                <path fill="#FF3D00" d="M6.3 14.7l7 5.1C15.1 16.1 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 5.1 29.5 3 24 3 16.3 3 9.6 7.9 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 45c5.2 0 10-1.9 13.7-5.1l-6.3-5.3C29.4 36.2 26.8 37 24 37c-5.3 0-9.7-3.4-11.3-8.1l-7 5.4C9.5 41.1 16.3 45 24 45z" />
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.3C41.3 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z" />
              </svg>
            )}
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">secured by Firebase Auth</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-xs text-center text-gray-400">
            By continuing you agree to the{' '}
            <span className="underline cursor-pointer hover:text-gray-600 transition-colors">
              Terms &amp; Privacy Policy
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
