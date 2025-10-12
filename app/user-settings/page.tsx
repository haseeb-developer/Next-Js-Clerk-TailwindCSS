import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import UserSettingsContent from '../components/UserSettingsContent'

export default async function UserSettingsPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <UserSettingsContent />
}
