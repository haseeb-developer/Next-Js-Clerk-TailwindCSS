'use client'

import { useUser } from '@clerk/nextjs'

export default function UserInfo() {
  const { user } = useUser()

  if (!user) return null

  return (
    <div className="flex items-center gap-2 cursor-pointer">
      <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span className="text-zinc-300 text-sm font-medium hidden sm:block">
        {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}
      </span>
    </div>
  )
}
