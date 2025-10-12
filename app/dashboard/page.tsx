import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0].toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}!
              </h1>
              <p className="text-white/70 text-sm">
                You're successfully logged in to your dashboard
              </p>
            </div>
            
            <div className="flex justify-center">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-12 h-12",
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
