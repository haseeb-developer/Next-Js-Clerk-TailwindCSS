// Utility functions for guest mode management

export interface GuestSnippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  tags: string[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export const isGuestMode = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('guestMode') === 'true'
}

export const getGuestUsername = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('guestUsername')
}

export const setGuestMode = (username: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('guestMode', 'true')
  localStorage.setItem('guestUsername', username)
  
  // Load snippets for this specific username, or create empty array if none exist
  const usernameSnippets = localStorage.getItem(`guestSnippets_${username}`)
  if (usernameSnippets) {
    localStorage.setItem('guestSnippets', usernameSnippets)
  } else {
    localStorage.setItem('guestSnippets', JSON.stringify([]))
  }
  
  // Save username to previous usernames list (max 3 accounts)
  const previousUsernames = JSON.parse(localStorage.getItem('previousGuestUsernames') || '[]')
  const updatedUsernames = [...new Set([username, ...previousUsernames])].slice(0, 3)
  localStorage.setItem('previousGuestUsernames', JSON.stringify(updatedUsernames))
}

export const exitGuestMode = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('guestMode')
  localStorage.removeItem('guestUsername')
  localStorage.removeItem('guestSnippets')
}

export const getGuestSnippets = (): GuestSnippet[] => {
  if (typeof window === 'undefined') return []
  const snippetsJson = localStorage.getItem('guestSnippets')
  if (!snippetsJson) return []
  try {
    return JSON.parse(snippetsJson) as GuestSnippet[]
  } catch {
    return []
  }
}

export const saveGuestSnippets = (snippets: GuestSnippet[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('guestSnippets', JSON.stringify(snippets))
  
  // Also save snippets per username for restoration
  const username = getGuestUsername()
  if (username) {
    localStorage.setItem(`guestSnippets_${username}`, JSON.stringify(snippets))
  }
}

export const addGuestSnippet = (snippet: Omit<GuestSnippet, 'id' | 'createdAt' | 'updatedAt'>): GuestSnippet => {
  const snippets = getGuestSnippets()
  const now = new Date().toISOString()
  const newSnippet: GuestSnippet = {
    ...snippet,
    id: `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    createdAt: now,
    updatedAt: now,
  }
  snippets.push(newSnippet)
  saveGuestSnippets(snippets)
  return newSnippet
}

export const updateGuestSnippet = (id: string, updates: Partial<Omit<GuestSnippet, 'id' | 'createdAt'>>): void => {
  const snippets = getGuestSnippets()
  const index = snippets.findIndex(s => s.id === id)
  if (index !== -1) {
    snippets[index] = {
      ...snippets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveGuestSnippets(snippets)
  }
}

export const deleteGuestSnippet = (id: string): void => {
  const snippets = getGuestSnippets()
  const filtered = snippets.filter(s => s.id !== id)
  saveGuestSnippets(filtered)
}

export const toggleGuestSnippetFavorite = (id: string): void => {
  const snippets = getGuestSnippets()
  const index = snippets.findIndex(s => s.id === id)
  if (index !== -1) {
    snippets[index].isFavorite = !snippets[index].isFavorite
    snippets[index].updatedAt = new Date().toISOString()
    saveGuestSnippets(snippets)
  }
}

export const getPreviousGuestUsernames = (): string[] => {
  if (typeof window === 'undefined') return []
  const usernamesJson = localStorage.getItem('previousGuestUsernames')
  if (!usernamesJson) return []
  try {
    return JSON.parse(usernamesJson) as string[]
  } catch {
    return []
  }
}

export const getGuestSnippetCount = (username: string): number => {
  if (typeof window === 'undefined') return 0
  const snippetsJson = localStorage.getItem(`guestSnippets_${username}`)
  if (!snippetsJson) return 0
  try {
    const snippets = JSON.parse(snippetsJson) as GuestSnippet[]
    return snippets.length
  } catch {
    return 0
  }
}

export const hasReachedGuestAccountLimit = (): boolean => {
  if (typeof window === 'undefined') return false
  const previousUsernames = getPreviousGuestUsernames()
  return previousUsernames.length >= 3
}

export const getGuestAccountCount = (): number => {
  if (typeof window === 'undefined') return 0
  const previousUsernames = getPreviousGuestUsernames()
  return previousUsernames.length
}

