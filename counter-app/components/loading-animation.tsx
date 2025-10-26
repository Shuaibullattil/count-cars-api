"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import LiveBarChart from "./live-bar-chart"
import { Clock } from "lucide-react"

interface LoadingAnimationProps {
  progress?: number
  onCancel?: () => void
  processedDuration?: number
  totalDuration?: number
  vehicleCounts?: Record<string, number>
}

export default function LoadingAnimation({ 
  progress = 0, 
  onCancel,
  processedDuration = 0,
  totalDuration = 0,
  vehicleCounts = {}
}: LoadingAnimationProps) {
  // Track processing time
  const [startTime] = useState(() => Date.now())
  const [processingTime, setProcessingTime] = useState(0)

  // Update processing time every second
  useEffect(() => {
    if (progress >= 100) return // Stop when complete

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setProcessingTime(elapsed)
    }

    // Update immediately and then every second
    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [progress, startTime])

  // Format duration as mm:ss with floored seconds
  const formatDuration = (seconds: number = 0) => {
    const duration = parseFloat(String(seconds))
    if (isNaN(duration) || duration < 0) return "0:00"
    const mins = Math.floor(duration / 60)
    const secs = Math.floor(duration % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="bg-card p-12 rounded-3xl border-2 border-border shadow-lg max-w-md w-full">
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-bold text-foreground">Analyzing Video</h2>
          <p className="text-muted-foreground text-lg">This may take some time for long videos...</p>

          {/* Animated Vehicle Icons (use project icons instead of emoji) */}
          <div className="flex justify-center items-center gap-4 h-24">
            {[
              "car.svg",
              "bus.svg",
              "bike.svg",
              "autorickshaw.svg",
              "cycle.svg",
              "truck.svg",
              "heavy vehicle.svg",
            ].map((file, i) => (
              <div key={file} className="animate-bounce" style={{ animationDelay: `${i * 0.08}s` }}>
                <img
                  src={`/vehicle-icons/${encodeURIComponent(file)}`}
                  alt={file.replace(/\.svg$/, "")}
                  className="w-14 h-14 object-contain"
                />
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="w-full bg-input rounded-full h-4 overflow-hidden border-2 border-border">
              <div
                className="h-full bg-linear-to-r from-primary via-secondary to-accent rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="flex justify-between px-1">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(processingTime)}</span>
                </div>
                <p className="text-sm text-muted-foreground font-semibold">
                  Processing... {progress.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  {`${formatDuration(processedDuration)} / ${formatDuration(totalDuration)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Live Bar Chart */}
          {Object.keys(vehicleCounts).length > 0 && (
            <div className="pt-4">
              <LiveBarChart data={vehicleCounts} height={180} />
            </div>
          )}

          {/* Floating Text + Cancel */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Detecting vehicles in frames — you'll get intermediate results if you cancel.</p>
            <p className="text-xs opacity-75">Please wait while we analyze your video</p>
          </div>

          <div className="pt-4">
            <Button 
              variant="destructive" 
              onClick={onCancel} 
              className="w-40 mx-auto"
              disabled={!onCancel}
            >
              Cancel and Get Results
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
