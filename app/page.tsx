export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
            <div className="text-center max-w-[1800px] mx-auto mx-5">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105">
            <span className="text-2xl font-bold text-white">AD</span>
          </div>
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
            Auth Diary
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-zinc-400 mb-12 font-medium max-w-2xl mx-auto">
          A modern authentication system built with Next.js, TypeScript, Tailwind CSS, and Clerk
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <span className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors">
            React 19
          </span>
          <span className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors">
            Next.js 15.5
          </span>
          <span className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors">
            TypeScript
          </span>
          <span className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors">
            Clerk Auth
          </span>
        </div>
      </div>
    </div>
  );
}
