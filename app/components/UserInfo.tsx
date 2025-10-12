'use client'

import { useUser } from '@clerk/nextjs'

export default function UserInfo() {
  const { user } = useUser()

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-300 text-sm font-medium hidden sm:block">
        {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}
      </span>
    </div>
  )
}
