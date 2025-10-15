'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function CreditsPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
        <div className="w-full max-w-[1800px] mx-auto mx-5">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-zinc-800 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-zinc-400 mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] py-12">
      <div className="w-full max-w-[1800px] mx-auto mx-5">
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Credits & Acknowledgments
          </h1>
          <p className="text-zinc-400 text-xl max-w-3xl leading-relaxed">
            Meet the brilliant minds and cutting-edge technologies that brought this project to life
          </p>
        </motion.div>

        {/* Developer Spotlight - Haseeb Khan */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-pink-900/30 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-8 mb-8">
                <motion.div 
                  className="relative"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="relative">
                    {/* Clean profile image container */}
                    <div className="w-28 h-28 rounded-full overflow-hidden shadow-xl shadow-blue-500/20 border-3 border-white/30 bg-white/5 backdrop-blur-sm">
                      <motion.img 
                        src="https://haseebkn.vercel.app/assets/pfp1.png" 
                        alt="Haseeb Khan" 
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                      />
                      
                      {/* Subtle inner shadow */}
                      <div className="absolute inset-0 rounded-full shadow-inner shadow-black/20"></div>
                    </div>
                    
                    {/* Single accent dot */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                  </div>
                </motion.div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <motion.h2 
                      className="text-4xl font-bold text-white"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      Haseeb Khan
                    </motion.h2>
                    <div className="relative group">
                      <motion.svg 
                        viewBox="0 0 22 22" 
                        aria-label="Verified account" 
                        role="img" 
                        className="w-8 h-8 text-blue-400 cursor-pointer" 
                        data-testid="icon-verified"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5, delay: 0.6, type: "spring" }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <g>
                          <path 
                            d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" 
                            fill="currentColor"
                          />
                        </g>
                      </motion.svg>
                      
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Verified Developer
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <motion.div 
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <span className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full text-sm font-semibold border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
                      🚀 Frontend Developer
                    </span>
                    <span className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-full text-sm font-semibold border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                      ⚛️ React & Shopify Expert
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Bio Section */}
              <motion.div 
                className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  About
                </h3>
                <p className="text-zinc-300 text-lg leading-relaxed">
                  Passionate about crafting <span className="text-blue-400 font-semibold">standout features</span> that turn ideas into impact. 
                  Always learning and exploring new technologies while building amazing digital experiences that make a difference.
                </p>
              </motion.div>

              {/* Links & Contact */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">🌐 Connect & Explore</h3>
                  <div className="space-y-3">
                    <motion.a
                      href="https://haseebkn.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-blue-500/50 transition-all duration-300 group cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold group-hover:text-blue-300 transition-colors">Portfolio Website</h4>
                        <p className="text-zinc-400 text-sm group-hover:text-blue-200 transition-colors">haseebkn.vercel.app</p>
                      </div>
                      <div className="ml-auto">
                        <svg className="w-5 h-5 text-zinc-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </div>
                    </motion.a>

                    <motion.a
                      href="https://github.com/haseeb-developer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 group cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold group-hover:text-purple-300 transition-colors">GitHub Profile</h4>
                        <p className="text-zinc-400 text-sm group-hover:text-purple-200 transition-colors">@haseeb-developer</p>
                      </div>
                      <div className="ml-auto">
                        <svg className="w-5 h-5 text-zinc-400 group-hover:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </div>
                    </motion.a>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">🏆 Expertise & Skills</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                        </svg>
                      </div>
                      <span className="text-white font-medium">React.js & Next.js</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
                        </svg>
                      </div>
                      <span className="text-white font-medium">Shopify Development</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                      </div>
                      <span className="text-white font-medium">TypeScript & JavaScript</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      </div>
                      <span className="text-white font-medium">Modern UI/UX Design</span>
                    </div>
                  </div>
                </div>
        </div>

              {/* Call to Action */}
              <motion.div 
                className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-2">🚀 Ready to Build Something Amazing?</h4>
                    <p className="text-zinc-300">Open to freelance projects, collaborations, or just real talk about development.</p>
                  </div>
                  <div className="flex gap-3">
                    <motion.a
                      href="mailto:haseeb.devv@gmail.com"
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Get in Touch
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="grid gap-8 md:grid-cols-2"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {/* Technologies Used */}
          <motion.div 
            className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-xl rounded-2xl p-8 border border-zinc-700/50 shadow-2xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                </svg>
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">Technologies</span>
            </h2>
            <div className="space-y-4">
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl border border-zinc-600/30 hover:border-blue-500/50 transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-black/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">N</span>
                  </div>
                  <span className="text-white font-semibold group-hover:text-blue-300 transition-colors">Next.js</span>
                </div>
                <span className="text-zinc-400 text-sm group-hover:text-blue-200 transition-colors">React Framework</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl border border-zinc-600/30 hover:border-blue-500/50 transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">T</span>
                  </div>
                  <span className="text-white font-semibold group-hover:text-blue-300 transition-colors">TypeScript</span>
                </div>
                <span className="text-zinc-400 text-sm group-hover:text-blue-200 transition-colors">Type Safety</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl border border-zinc-600/30 hover:border-cyan-500/50 transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">T</span>
                  </div>
                  <span className="text-white font-semibold group-hover:text-cyan-300 transition-colors">Tailwind CSS</span>
                </div>
                <span className="text-zinc-400 text-sm group-hover:text-cyan-200 transition-colors">Styling</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl border border-zinc-600/30 hover:border-green-500/50 transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <span className="text-white font-semibold group-hover:text-green-300 transition-colors">Supabase</span>
                </div>
                <span className="text-zinc-400 text-sm group-hover:text-green-200 transition-colors">Database</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl border border-zinc-600/30 hover:border-purple-500/50 transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">C</span>
                  </div>
                  <span className="text-white font-semibold group-hover:text-purple-300 transition-colors">Clerk</span>
                </div>
                <span className="text-zinc-400 text-sm group-hover:text-purple-200 transition-colors">Authentication</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Libraries & Tools */}
          <motion.div 
            className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-xl rounded-2xl p-8 border border-zinc-700/50 shadow-2xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">Libraries & Tools</span>
            </h2>
            <div className="space-y-4">
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl border border-zinc-600/30 hover:border-pink-500/50 transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-pink-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">F</span>
                  </div>
                  <span className="text-white font-semibold group-hover:text-pink-300 transition-colors">Framer Motion</span>
                </div>
                <span className="text-zinc-400 text-sm group-hover:text-pink-200 transition-colors">Animations</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl border border-zinc-600/30 hover:border-orange-500/50 transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">L</span>
                  </div>
                  <span className="text-white font-semibold group-hover:text-orange-300 transition-colors">Lucide Icons</span>
                </div>
                <span className="text-zinc-400 text-sm group-hover:text-orange-200 transition-colors">Icons</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl border border-zinc-600/30 hover:border-red-500/50 transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">R</span>
                  </div>
                  <span className="text-white font-semibold group-hover:text-red-300 transition-colors">React Hook Form</span>
                </div>
                <span className="text-zinc-400 text-sm group-hover:text-red-200 transition-colors">Forms</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl border border-zinc-600/30 hover:border-yellow-500/50 transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-yellow-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">Z</span>
                  </div>
                  <span className="text-white font-semibold group-hover:text-yellow-300 transition-colors">Zod</span>
                </div>
                <span className="text-zinc-400 text-sm group-hover:text-yellow-200 transition-colors">Validation</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl border border-zinc-600/30 hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">V</span>
                  </div>
                  <span className="text-white font-semibold group-hover:text-indigo-300 transition-colors">Vercel</span>
                </div>
                <span className="text-zinc-400 text-sm group-hover:text-indigo-200 transition-colors">Deployment</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Special Thanks */}
        <motion.div 
          className="mt-12 bg-gradient-to-br from-green-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/25">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Special Thanks
              </span>
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              <motion.div
                className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
              >
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  Open Source Community
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  This project wouldn&apos;t be possible without the incredible open source community. 
                  Thank you to all the developers who contribute to these amazing tools and libraries that make modern web development possible.
                </p>
              </motion.div>
              
              <motion.div
                className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 }}
              >
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
                    </svg>
                  </div>
                  Design Inspiration
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  Inspired by modern design systems and the amazing work of the developer community. 
                  Special thanks to all the designers and developers who share their knowledge and push the boundaries of what&apos;s possible.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.8 }}
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">❤️</span>
            </div>
            <p className="text-zinc-300 font-medium">
              Built with passion using cutting-edge web technologies
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}