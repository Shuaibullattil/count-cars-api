"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ResultsDisplayProps {
  results: {
    total_vehicles: number
    class_counts: Record<string, number>
    orientation: string
    position: number
  }
  onReset: () => void
}

const vehicleIcons: Record<string, string> = {
  car: "🚗",
  bus: "🚌",
  bike: "🏍️",
  autorickshaw: "🚙",
}

export default function ResultsDisplay({ results, onReset }: ResultsDisplayProps) {
  const vehicleClasses = Object.entries(results.class_counts).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-foreground mb-2">Analysis Complete</h2>
        <p className="text-muted-foreground">
          {results.orientation === "vertical" ? "Vertical" : "Horizontal"} line at {results.position}%
        </p>
      </div>

      {/* Total Count Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 border-2 border-primary rounded-3xl">
        <p className="text-muted-foreground text-sm mb-2 uppercase font-semibold">Total Vehicles Detected</p>
        <p className="text-6xl font-bold text-primary">{results.total_vehicles}</p>
      </Card>

      {/* Vehicle Class Distribution */}
      <Card className="bg-card p-8 border-2 border-border rounded-3xl">
        <h3 className="text-2xl font-bold mb-8 text-foreground">Vehicle Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicleClasses.map(([vehicleClass, count]) => {
            const percentage = (count / results.total_vehicles) * 100
            const icon = vehicleIcons[vehicleClass] || "🚗"

            return (
              <div key={vehicleClass} className="bg-input rounded-2xl p-6 border-2 border-border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{icon}</div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase font-semibold capitalize">{vehicleClass}</p>
                    <p className="text-3xl font-bold text-foreground">{count}</p>
                  </div>
                </div>
                <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right">{percentage.toFixed(1)}%</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="flex-1 bg-transparent border-2 border-border rounded-2xl font-bold text-lg py-6 hover:bg-input"
        >
          Analyze Another Video
        </Button>
        <Button
          onClick={() => {
            const dataStr = JSON.stringify(results, null, 2)
            const dataBlob = new Blob([dataStr], { type: "application/json" })
            const url = URL.createObjectURL(dataBlob)
            const link = document.createElement("a")
            link.href = url
            link.download = "vehicle-count-results.json"
            link.click()
          }}
          size="lg"
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-lg py-6"
        >
          Export Results
        </Button>
      </div>
    </div>
  )
}
