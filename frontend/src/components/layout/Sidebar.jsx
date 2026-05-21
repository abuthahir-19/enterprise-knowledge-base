import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Bookmark,
  Search,
  CheckSquare,
  FolderOpen,
  Tag,
  Users,
  BarChart3,
  X,
  BookMarked,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useQuery } from '@tanstack/react-query'
import approvalService from '../../services/approvalService.js'

export default function Sidebar({ isOpen, onClose }) {
  const { user, hasRole } = useAuth()
  const location = useLocation()

  const { data: pendingArticles } = useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: approvalService.getPendingArticles,
    enabled: hasRole(['reviewer', 'admin']),
    refetchInterval: 60000,
  })

  const pendingCount = pendingArticles?.length || 0

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'Articles',
      to: '/articles',
      icon: BookOpen,
      show: true,
    },
    {
      label: 'My Articles',
      to: '/my-articles',
      icon: FileText,
      show: hasRole(['author', 'admin']),
    },
    {
      label: 'Bookmarks',
      to: '/bookmarks',
      icon: Bookmark,
      show: true,
    },
    {
      label: 'Search',
      to: '/search',
      icon: Search,
      show: true,
    },
    {
      label: 'Approval Queue',
      to: '/approvals',
      icon: CheckSquare,
      show: hasRole(['reviewer', 'admin']),
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      label: 'Categories',
      to: '/categories',
      icon: FolderOpen,
      show: hasRole(['admin']),
    },
    {
      label: 'Tags',
      to: '/tags',
      icon: Tag,
      show: true,
    },
    {
      label: 'Users',
      to: '/users',
      icon: Users,
      show: hasRole(['admin']),
    },
    {
      label: 'Analytics',
      to: '/analytics',
      icon: BarChart3,
      show: hasRole(['admin']),
    },
  ]

  const visibleItems = navItems.filter((item) => item.show)

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 text-white flex-shrink-0">
        <SidebarContent items={visibleItems} />
      </aside>

      {/* Mobile sidebar — slide in/out */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <BookMarked size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg">Enterprise KB</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarContent items={visibleItems} onNavClick={onClose} />
      </aside>
    </>
  )
}

function SidebarContent({ items, onNavClick }) {
  return (
    <nav className="flex-1 overflow-y-auto py-4">
      <ul className="space-y-1 px-3">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavClick}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                  {item.badge}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
