import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface UserIDData {
  user_id_number: number
  clerk_user_id: string
  first_name: string
}

export function useUserID() {
  const { user, isLoaded } = useUser()
  const [userID, setUserID] = useState<UserIDData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false)
      return
    }

    const fetchUserID = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user-id')
        
        if (!response.ok) {
          throw new Error('Failed to fetch user ID')
        }
        
        const data = await response.json()
        setUserID(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching user ID:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchUserID()
  }, [user, isLoaded])

  const refreshUserID = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch('/api/user-id')
      
      if (!response.ok) {
        throw new Error('Failed to refresh user ID')
      }
      
      const data = await response.json()
      setUserID(data)
      setError(null)
    } catch (err) {
      console.error('Error refreshing user ID:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return {
    userID,
    loading,
    error,
    refreshUserID,
    isLoaded
  }
}
