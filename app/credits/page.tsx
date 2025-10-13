'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Credits
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Built with passion and dedication by a software developer who loves creating amazing experiences.
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Developer Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-3xl border border-blue-500/30 shadow-2xl p-8 mb-8"
          >
            <div className="text-center">
              {/* Avatar */}
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl">
                <span className="text-4xl font-bold text-white">MH</span>
              </div>

              {/* Name and Title */}
              <h2 className="text-3xl font-bold text-white mb-2">Muhammad Haseeb</h2>
              <p className="text-xl text-blue-300 mb-6 font-medium">Software Developer</p>

              {/* Description */}
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
                Passionate software developer creating innovative solutions and beautiful user experiences. 
                Dedicated to crafting code that makes a difference.
              </p>

              {/* Website Link */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mb-8"
              >
                <a
                  href="https://haseeb-kn.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  Visit My Website
                </a>
              </motion.div>
            </div>
          </motion.div>

          {/* Technologies Used */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-3xl border border-purple-500/30 shadow-2xl p-8 mb-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Technologies Used</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Next.js', icon: '⚡' },
                { name: 'React', icon: '⚛️' },
                { name: 'TypeScript', icon: '🔷' },
                { name: 'Tailwind CSS', icon: '🎨' },
                { name: 'Framer Motion', icon: '✨' },
                { name: 'Supabase', icon: '🗄️' },
                { name: 'Clerk Auth', icon: '🔐' },
                { name: 'Vercel', icon: '▲' }
              ].map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="bg-gray-700/50 rounded-xl p-4 text-center hover:bg-gray-600/50 transition-colors duration-300"
                >
                  <div className="text-2xl mb-2">{tech.icon}</div>
                  <div className="text-sm font-medium text-white">{tech.name}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Special Thanks */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-3xl border border-green-500/30 shadow-2xl p-8 mb-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Special Thanks</h3>
            <div className="text-center">
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                Thank you to the amazing open-source community and all the developers who have contributed 
                to the tools and libraries that made this project possible.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Built with ❤️ and lots of ☕
              </p>
            </div>
          </motion.div>

          {/* Back to App */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
          >
            <Link
              href="/snippets"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-300 text-lg font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Back to Snippets
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
