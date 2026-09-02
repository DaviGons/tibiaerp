import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  ScrollText,
  Menu,
  X,
  LogOut,
  Swords,
  ChevronLeft,
  User,
  History,
  Wrench,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hunt-log', icon: ScrollText, label: 'Registrar Hunt' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/ferramentas', icon: Wrench, label: 'Ferramentas' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-40
        bg-tibia-deeper/95 backdrop-blur-xl border-r border-tibia-border/50
        transition-all duration-300 ease-in-out
        flex flex-col
        ${collapsed ? 'w-[68px]' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-tibia-border/50">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-tibia-gold to-yellow-600 flex items-center justify-center flex-shrink-0">
          <Swords className="w-5 h-5 text-tibia-dark" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-gray-100 tracking-tight">Tibia ERP</h1>
            <p className="text-[10px] text-gray-500 font-medium">Hunt Tracker</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-lg hover:bg-tibia-card text-gray-400 hover:text-gray-200 transition-colors hidden lg:flex"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
              group relative
              ${isActive
                ? 'bg-tibia-gold/10 text-tibia-gold border border-tibia-gold/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-tibia-card border border-transparent'
              }
            `}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium animate-fade-in">{item.label}</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-tibia-card border border-tibia-border rounded-md text-xs text-gray-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-tibia-border/50 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-tibia-card border border-tibia-border flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-gray-400" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-xs font-medium text-gray-300 truncate">
                {user?.email}
              </p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            title="Sair"
            className={`p-1.5 rounded-lg hover:bg-tibia-red/10 text-gray-500 hover:text-tibia-red transition-colors ${collapsed ? 'mt-2' : ''}`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
