import React from 'react'

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4',
}

export default function LoadingSpinner({ size = 'md', className = '', centered = false }) {
  const spinner = (
    <div
      className={`${sizeMap[size]} border-blue-600 border-t-transparent rounded-full animate-spin ${className}`}
    />
  )

  if (centered) {
    return (
      <div className="flex items-center justify-center w-full py-12">
        {spinner}
      </div>
    )
  }

  return spinner
}
