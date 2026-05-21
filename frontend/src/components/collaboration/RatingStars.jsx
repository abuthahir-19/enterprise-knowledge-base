import React, { useState } from 'react'
import { Star } from 'lucide-react'

export default function RatingStars({ value = 0, readonly = false, onRate, size = 20 }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (readonly ? value : hovered || value)
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onRate && onRate(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition-colors ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              size={size}
              className={
                filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }
            />
          </button>
        )
      })}
      {readonly && value > 0 && (
        <span className="ml-2 text-sm text-gray-600 font-medium">{value.toFixed(1)}</span>
      )}
    </div>
  )
}
