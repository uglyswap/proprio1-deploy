'use client'

import { useUser, useOrganization } from '@/hooks'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Search,
  CreditCard,
  Users,
  Settings,
  LogOut,
  BarChart3,
  Coins,
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading: userLoading } = useUser()
  const { organization, isLoading: orgLoading } = useOrganization()
  const pathname = usePathname()
  const router = useRouter()

  if (userLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    router.push('/auth/signin')
    return null
  }

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Nouvelle recherche', href: '/dashboard/search', icon: Search },
    { name: 'Historique', href: '/dashboard/history', icon: BarChart3 },
    { name: 'Crédits', href: '/dashboard/credits', icon: Coins },
    { name: 'Facturation', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Équipe', href: '/dashboard/team', icon: Users },
    { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-4 border-b">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold text-primary">ProprioFinder</h1>
            </Link>
          </div>

          {/* Organization info */}
          <div className="px-6 py-4 border-b">
            <div className="space-y-1">
              <p className="text-sm font-medium">{organization?.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{organization?.plan}</Badge>
                <span className="text-xs text-muted-foreground">
                  {organization?.creditBalance} crédits
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                {user.name?.[0] || user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <div className="py-6 px-8">{children}</div>
      </div>
    </div>
  )
}
