"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  LayoutDashboard,
  Users,
  Settings,
  Database,
  CreditCard,
  Activity,
  Shield,
  FileText,
  DollarSign,
  Plug,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
  { name: 'Clients', href: '/superadmin/clients', icon: Users },
  { name: 'Analytics', href: '/superadmin/analytics', icon: Activity },
  { name: 'Feature Flags', href: '/superadmin/features', icon: Shield },
  { name: 'Sources de Données', href: '/superadmin/datasources', icon: Database },
  { name: 'Configuration Stripe', href: '/superadmin/stripe', icon: CreditCard },
  { name: 'APIs', href: '/superadmin/apis', icon: Plug },
  { name: 'Plans & Tarifs', href: '/superadmin/plans', icon: DollarSign },
  { name: 'Logs d\'Audit', href: '/superadmin/logs', icon: FileText },
  { name: 'Paramètres', href: '/superadmin/settings', icon: Settings },
]

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-red-900 to-red-950 dark:from-red-950 dark:to-black text-white">
        <div className="p-6 border-b border-red-800 dark:border-red-900">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">Super Admin</h1>
              <p className="text-xs text-red-200 dark:text-red-300">ProprioFinder</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
                           (item.href !== '/superadmin' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-red-800 dark:bg-red-900 text-white'
                    : 'text-red-100 dark:text-red-200 hover:bg-red-800/50 dark:hover:bg-red-900/50'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-red-800 dark:border-red-900 space-y-3">
          <div className="flex items-center justify-between px-4">
            <span className="text-xs text-red-200 dark:text-red-300">Thème</span>
            <ThemeToggle />
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-200 dark:text-red-300 hover:text-white transition-colors"
          >
            ← Retour au dashboard client
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    </div>
  )
}
