'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { setGuestMode, getPreviousGuestUsernames, getGuestSnippetCount, hasReachedGuestAccountLimit, getGuestAccountCount } from '@/lib/guestMode'

export default function ChooseUsername() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreviousUsernames, setShowPreviousUsernames] = useState(false)
  const [previousUsernames, setPreviousUsernames] = useState<string[]>([])
  const [accountCount, setAccountCount] = useState(0)
  const [hasReachedLimit, setHasReachedLimit] = useState(false)
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [closeProgress, setCloseProgress] = useState(0)
  const [canClose, setCanClose] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<'guest' | 'account' | null>(null)

  useEffect(() => {
    // Check if already a guest user
    const existingGuest = localStorage.getItem('guestMode')
    if (existingGuest === 'true') {
      router.push('/guest-mode-snippets')
    }

    // Load previous usernames and check account limit
    const savedUsernames = getPreviousGuestUsernames()
    const count = getGuestAccountCount()
    const reachedLimit = hasReachedGuestAccountLimit()
    
    setPreviousUsernames(savedUsernames)
    setAccountCount(count)
    setHasReachedLimit(reachedLimit)

    // Show comparison modal after 3 seconds
    const timer = setTimeout(() => {
      setShowComparisonModal(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  // Circular progress close button effect
  useEffect(() => {
    if (showComparisonModal && !canClose) {
      const interval = setInterval(() => {
        setCloseProgress(prev => {
          if (prev >= 100) {
            setCanClose(true)
            clearInterval(interval)
            return 100
          }
          return prev + 1
        })
      }, 50) // 5 seconds total (100 * 50ms)

      return () => clearInterval(interval)
    }
  }, [showComparisonModal, canClose])

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showComparisonModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showComparisonModal])

  const adjectives = [
    'Swift', 'Bright', 'Clever', 'Mighty', 'Silent', 'Golden', 'Silver', 'Bold',
    'Brave', 'Cosmic', 'Mystic', 'Noble', 'Royal', 'Stellar', 'Zen', 'Epic',
    'Turbo', 'Mega', 'Ultra', 'Super', 'Hyper', 'Quantum', 'Digital', 'Cyber',
    'Ninja', 'Phoenix', 'Dragon', 'Thunder', 'Lightning', 'Shadow', 'Crystal'
  ]

  const nouns = [
    'Coder', 'Developer', 'Hacker', 'Ninja', 'Wizard', 'Master', 'Expert', 'Guru',
    'Tiger', 'Eagle', 'Falcon', 'Wolf', 'Lion', 'Panda', 'Fox', 'Bear',
    'Warrior', 'Knight', 'Samurai', 'Champion', 'Legend', 'Hero', 'Maverick',
    'Voyager', 'Explorer', 'Pioneer', 'Architect', 'Creator', 'Builder', 'Maker'
  ]

  const generateUsername = () => {
    setIsGenerating(true)
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const number = Math.floor(Math.random() * 1000)
    const generated = `${adjective}${noun}${number}`
    
    setTimeout(() => {
      setUsername(generated)
      setIsGenerating(false)
    }, 300)
  }

  const handleContinue = () => {
    if (!username.trim()) {
      alert('Please enter or generate a username')
      return
    }

    // Check if user has reached the account limit
    if (hasReachedLimit && !previousUsernames.includes(username.trim())) {
      alert('You have reached the maximum limit of 3 guest accounts. Please use an existing account or create a full account for unlimited access.')
      return
    }

    // Use the guestMode utility function
    setGuestMode(username.trim())

    // Redirect to guest mode snippets page
    router.push('/guest-mode-snippets')
  }

  const handleSignInWithPrevious = (previousUsername: string) => {
    // Use the guestMode utility function
    setGuestMode(previousUsername)

    // Redirect to guest mode snippets page
    router.push('/guest-mode-snippets')
  }

  const handleCloseModal = () => {
    if (canClose) {
      setShowComparisonModal(false)
    }
  }


  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-gradient-to-br from-zinc-900/95 via-zinc-800/90 to-zinc-900/95 border border-zinc-700/30 rounded-3xl shadow-2xl shadow-black/20 p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Choose Your Username
            </h1>
            <p className="text-zinc-400 text-lg">
              Generate a random username or create your own
            </p>
          </div>

          {/* Warning Notice */}
          <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/30 flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-yellow-500 font-semibold mb-2">Guest Mode Notice</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  You&apos;re using guest mode. Your snippets will be saved only in your browser&apos;s local storage. 
                  This means:
                </p>
                <ul className="list-disc list-inside text-zinc-300 text-sm mt-2 space-y-1 ml-4">
                  <li>Data won&apos;t sync across devices</li>
                  <li>Clearing browser data will delete your snippets</li>
                  <li>Data won&apos;t be backed up to any database</li>
                  <li>Maximum of 3 guest accounts allowed</li>
                </ul>
                <p className="text-zinc-400 text-xs mt-3">
                  For a permanent solution, consider creating a full account.
                </p>
              </div>
            </div>
          </div>

          {/* Account Limit Notice */}
          {hasReachedLimit && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-red-400 font-semibold text-sm">Account Limit Reached</h4>
                  <p className="text-zinc-300 text-xs">
                    You have reached the maximum of 3 guest accounts ({accountCount}/3). 
                    Please use an existing account below or create a full account for unlimited access.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Username Input */}
          <div className="mb-6">
            <label className="block text-zinc-300 text-sm font-medium mb-3">
              Your Username
              {hasReachedLimit && (
                <span className="text-red-400 text-xs ml-2">(Limit reached - use existing account below)</span>
              )}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={hasReachedLimit ? "Account limit reached - use existing account below" : "Enter username or generate one"}
              disabled={hasReachedLimit}
              className={`w-full px-6 py-4 bg-zinc-800/50 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all ${
                hasReachedLimit 
                  ? 'border-zinc-600/50 bg-zinc-800/30 text-zinc-500 cursor-not-allowed' 
                  : 'border-zinc-700'
              }`}
              maxLength={30}
            />
            <p className="text-zinc-500 text-xs mt-2">
              {username.length}/30 characters
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateUsername}
            disabled={isGenerating || hasReachedLimit}
            className={`w-full mb-6 px-6 py-4 border rounded-xl transition-all duration-300 font-semibold ${
              hasReachedLimit
                ? 'bg-zinc-800/30 border-zinc-600/50 text-zinc-500 cursor-not-allowed'
                : 'cursor-pointer bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/40'
            } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {hasReachedLimit ? 'Account Limit Reached' : 'Generate Random Username'}
              </span>
            )}
          </button>

          {/* Previous Usernames Section */}
          {previousUsernames.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowPreviousUsernames(!showPreviousUsernames)}
                className="w-full px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/30 rounded-xl border border-zinc-600 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign in with previous username</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ease-in-out ${showPreviousUsernames ? 'rotate-180' : 'rotate-0'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  showPreviousUsernames ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
                }`}
              >
                <div className="space-y-2">
                  {previousUsernames.map((prevUsername, index) => {
                    const snippetCount = getGuestSnippetCount(prevUsername)
                    return (
                      <button
                        key={index}
                        onClick={() => handleSignInWithPrevious(prevUsername)}
                        className="w-full px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all duration-300 text-left group cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                              <span className="text-white text-xs font-bold">
                                {prevUsername.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold">{prevUsername}</div>
                              <div className="text-xs text-zinc-400">
                                {snippetCount === 0 ? 'No snippets' : `${snippetCount} snippet${snippetCount === 1 ? '' : 's'}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 group-hover:text-indigo-400">
                              {snippetCount > 0 ? 'Restore data' : 'Empty account'}
                            </span>
                            <svg className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!username.trim() || (hasReachedLimit && !previousUsernames.includes(username.trim()))}
            className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {hasReachedLimit && !previousUsernames.includes(username.trim()) ? 'Account Limit Reached' : 'Continue as Guest'}
          </button>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-6 py-3 text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-600/60 hover:border-zinc-500/80 rounded-xl transition-all duration-300 text-sm font-medium cursor-pointer shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Comparison Modal */}
      <AnimatePresence>
        {showComparisonModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="w-[calc(100vw-40px)] max-h-[calc(100vh-40px)] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl overflow-y-auto relative"
            >
              {/* Circular Progress Close Button */}
              <div className="absolute top-6 right-6 z-10">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path
                      className="text-gray-700"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Progress circle */}
                    <path
                      className="text-green-500 transition-all duration-300"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${closeProgress}, 100`}
                      strokeLinecap="round"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <button
                    onClick={handleCloseModal}
                    disabled={!canClose}
                    className={`absolute inset-0 flex items-center justify-center rounded-full transition-all duration-300 ${
                      canClose 
                        ? 'bg-green-500/20 hover:bg-green-500/30 cursor-pointer' 
                        : 'bg-transparent cursor-not-allowed'
                    }`}
                  >
                    {canClose ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <span className="text-sm text-white font-bold">{Math.round(closeProgress)}%</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Header */}
              <div className="text-center p-8 border-b border-gray-700/50">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Choose Your Experience</h2>
                <p className="text-gray-400 text-lg">Select the plan that fits your needs and unlock the full potential</p>
              </div>

              {/* Cards Container */}
              <div className="p-8 h-auto overflow-y-auto pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-auto">
                  {/* Guest Mode Card */}
                  <motion.div
                    onHoverStart={() => setHoveredCard('guest')}
                    onHoverEnd={() => setHoveredCard(null)}
                    className={`relative bg-gradient-to-br from-slate-800/60 to-slate-900/80 rounded-3xl border-2 transition-all duration-500 ${
                      hoveredCard === 'guest' 
                        ? 'border-blue-500/60 shadow-2xl shadow-blue-500/25' 
                        : 'border-slate-700/50 shadow-xl'
                    }`}
                  >
                    <div className="p-8 pb-8 h-auto flex flex-col mb-4">
                      {/* Guest Mode Header */}
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                          <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-3">Guest Mode</h3>
                        <p className="text-slate-300 text-lg mb-4">Experience the platform without commitment</p>
                        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 text-sm font-semibold rounded-full border border-blue-400/30 backdrop-blur-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          No Credit Card Required
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="space-y-5 mb-8 flex-1">
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            What&apos;s Included
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Unlimited code snippet creation</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Syntax highlighting for 50+ languages</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Basic search and filtering</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Copy to clipboard functionality</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-900/20 rounded-xl p-4 border border-red-800/30">
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Limitations
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <span className="text-slate-400">Data stored locally only (no cloud backup)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <span className="text-slate-400">Maximum 3 guest accounts per device</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <span className="text-slate-400">No password management features</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <span className="text-slate-400">No advanced organization tools</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>

                  {/* Full Access Card */}
                  <motion.div
                    onHoverStart={() => setHoveredCard('account')}
                    onHoverEnd={() => setHoveredCard(null)}
                    className={`relative bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-pink-900/40 rounded-3xl border-2 transition-all duration-500 ${
                      hoveredCard === 'account' 
                        ? 'border-purple-500/60 shadow-2xl shadow-purple-500/25' 
                        : 'border-purple-500/40 shadow-xl shadow-purple-500/15'
                    }`}
                  >
                    {/* Recommended Badge */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                        ⭐ RECOMMENDED
                      </div>
                    </div>

                    <div className="p-8 pb-8 h-auto flex flex-col mb-4">
                      {/* Full Access Header */}
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/40 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                          <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-3">Full Access</h3>
                        <p className="text-slate-300 text-lg mb-4">Complete professional solution</p>
                        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-sm font-semibold rounded-full border border-purple-400/30 backdrop-blur-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Enterprise-Grade Security
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="space-y-5 mb-8 flex-1">
                        <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-700/30">
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Core Features
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Complete password management suite</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Advanced code snippet organization</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Real-time cloud synchronization</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Unlimited storage across all devices</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30">
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Advanced Capabilities
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">AI-powered password generation</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Advanced search & filtering</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Custom folders & categories</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Priority customer support</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/30">
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Security & Trust
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">End-to-end encryption</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">Automatic data backup</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">GDPR compliant data handling</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-slate-300">99.9% uptime guarantee</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

