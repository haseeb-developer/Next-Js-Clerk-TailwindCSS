import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-zinc-400">Sign up to get started with Auth Diary</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-zinc-400",
              socialButtonsBlockButton: "bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700",
              socialButtonsBlockButtonText: "text-white font-medium",
              formButtonPrimary: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30",
              formFieldLabel: "text-zinc-300",
              formFieldInput: "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-indigo-500",
              footerActionLink: "text-indigo-400 hover:text-indigo-300",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-indigo-400 hover:text-indigo-300",
              formFieldInputShowPasswordButton: "text-zinc-400 hover:text-white",
              otpCodeFieldInput: "bg-zinc-800 border-zinc-700 text-white",
              formResendCodeLink: "text-indigo-400 hover:text-indigo-300",
              footer: "bg-transparent",
              footerActionText: "text-zinc-400",
            }
          }}
        />
      </div>
    </div>
  )
}
