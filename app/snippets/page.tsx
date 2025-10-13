import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import SnippetsContent from '../components/SnippetsContent'

export default async function SnippetsPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <SnippetsContent />
}
