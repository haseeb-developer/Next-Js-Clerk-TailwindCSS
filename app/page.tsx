export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
            <span className="text-2xl font-bold text-white">AD</span>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
          Next.js + Tailwind setup complete
        </h1>
        
        <p className="text-xl text-white/80 mb-8 font-medium">
          TypeScript • App Router • Tailwind CSS v4 • Clerk Auth
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium border border-white/20">
            React 19
          </span>
          <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium border border-white/20">
            Next.js 15.5
          </span>
          <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium border border-white/20">
            TypeScript
          </span>
          <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium border border-white/20">
            Clerk Auth
          </span>
        </div>
      </div>
    </div>
  );
}
