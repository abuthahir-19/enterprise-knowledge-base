import React from 'react'

const variantMap = {
  // Article statuses
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  published: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
  // User roles
  admin: 'bg-purple-100 text-purple-700',
  author: 'bg-blue-100 text-blue-700',
  reviewer: 'bg-teal-100 text-teal-700',
  employee: 'bg-gray-100 text-gray-700',
  // User status
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-700',
  // Generic
  default: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
}

const labelMap = {
  draft: 'Draft',
  pending_approval: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
  archived: 'Archived',
}

export default function Badge({ variant = 'default', children, className = '' }) {
  const colorClass = variantMap[variant] || variantMap.default
  const label = children ?? labelMap[variant] ?? variant

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass} ${className}`}
    >
      {label}
    </span>
  )
}
