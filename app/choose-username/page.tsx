'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setGuestMode, getPreviousGuestUsernames, getGuestSnippetCount, hasReachedGuestAccountLimit, getGuestAccountCount } from '@/lib/guestMode'

export default function ChooseUsername() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreviousUsernames, setShowPreviousUsernames] = useState(false)
  const [previousUsernames, setPreviousUsernames] = useState<string[]>([])
  const [accountCount, setAccountCount] = useState(0)
  const [hasReachedLimit, setHasReachedLimit] = useState(false)

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
  }, [router])

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
                className="w-full px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700/30 rounded-xl border border-zinc-600 transition-all duration-300 flex items-center justify-center gap-2"
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
                        className="w-full px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all duration-300 text-left group"
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
    </div>
  )
}

