'use client'

import Link from 'next/link'
import { useNavigation } from '../contexts/NavigationContext'
import { usePathname } from 'next/navigation'

interface ProtectedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  prefetch?: boolean
}

export function ProtectedLink({ 
  href, 
  children, 
  className, 
  onClick,
  prefetch = false 
}: ProtectedLinkProps) {
  const { protectedNavigate } = useNavigation()
  const pathname = usePathname()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only protect navigation if we're not already on the target page
    if (pathname !== href) {
      e.preventDefault()
      protectedNavigate(href)
    }
    
    if (onClick) {
      onClick()
    }
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  )
}
