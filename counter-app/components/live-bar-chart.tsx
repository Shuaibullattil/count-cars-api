"use client"

import { useEffect, useRef } from "react"

interface LiveBarChartProps {
  data: Record<string, number>
  height?: number
  animationDuration?: number
}

export default function LiveBarChart({ 
  data,
  height = 200,
  animationDuration = 500
}: LiveBarChartProps) {
  const maxValue = Math.max(...Object.values(data))
  const sortedEntries = Object.entries(data)
    .filter(([_, count]) => count > 0) // Only show vehicles with count > 0
    .sort(([, a], [, b]) => b - a) // Sort by count descending

  return (
    <div 
      className="w-full overflow-hidden space-y-2"
      style={{ height: `${height}px` }}
    >
      {sortedEntries.map(([vehicle, count]) => {
        const percentage = (count / maxValue) * 100
        return (
          <div key={vehicle} className="flex items-center gap-3 group">
            <img
              src={`/vehicle-icons/${encodeURIComponent(vehicle)}.svg`}
              alt={vehicle}
              className="w-6 h-6 object-contain shrink-0"
            />
            <div className="grow h-8 bg-input rounded-lg overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary/80 to-primary rounded-lg transition-all duration-500 ease-out flex items-center px-3"
                style={{ 
                  width: `${percentage}%`,
                  transitionDuration: `${animationDuration}ms`
                }}
              >
                <span className="text-sm font-medium text-primary-foreground">
                  {count}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}