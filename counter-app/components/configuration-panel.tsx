"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ConfigurationPanelProps {
  lineDirection: "vertical" | "horizontal"
  linePosition: number
  lineColor: string
  lineThickness: number
  onDirectionChange: (direction: "vertical" | "horizontal") => void
  onPositionChange: (position: number) => void
  onColorChange: (color: string) => void
  onThicknessChange: (thickness: number) => void
  onProcess: () => void
}

export default function ConfigurationPanel({
  lineDirection,
  linePosition,
  lineColor,
  lineThickness,
  onDirectionChange,
  onPositionChange,
  onColorChange,
  onThicknessChange,
  onProcess,
}: ConfigurationPanelProps) {
  return (
    <Card className="bg-card p-6 sticky top-8 shadow-lg border-2 border-border rounded-3xl">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Settings</h2>

      <div className="space-y-6">
        {/* Line Direction */}
        <div>
          <h3 className="text-sm font-bold mb-3 text-foreground uppercase tracking-wide">Line Direction</h3>
          <div className="flex gap-3">
            <button
              onClick={() => onDirectionChange("vertical")}
              className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold transition-all transform hover:scale-105 ${
                lineDirection === "vertical"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-input border-2 border-border text-foreground hover:bg-input/80"
              }`}
            >
              Vertical
            </button>
            <button
              onClick={() => onDirectionChange("horizontal")}
              className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold transition-all transform hover:scale-105 ${
                lineDirection === "horizontal"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-input border-2 border-border text-foreground hover:bg-input/80"
              }`}
            >
              Horizontal
            </button>
          </div>
        </div>

        {/* Line Position */}
        <div>
          <label className="text-sm font-bold block mb-3 text-foreground uppercase tracking-wide">
            Position: <span className="text-primary text-lg">{linePosition}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={linePosition}
            onChange={(e) => onPositionChange(Number.parseFloat(e.target.value))}
            className="w-full h-3 rounded-full cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs font-semibold text-muted-foreground mt-2 uppercase">
            <span>{lineDirection === "vertical" ? "Left" : "Top"}</span>
            <span>{lineDirection === "vertical" ? "Right" : "Bottom"}</span>
          </div>
        </div>

        {/* Line Color */}
        <div>
          <label className="text-sm font-bold block mb-3 text-foreground uppercase tracking-wide">Line Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={lineColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-14 h-12 rounded-2xl cursor-pointer border-2 border-border"
            />
            <Input
              type="text"
              value={lineColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="flex-1 bg-input border-2 border-border rounded-2xl font-mono"
            />
          </div>
        </div>

        {/* Line Thickness */}
        <div>
          <label className="text-sm font-bold block mb-3 text-foreground uppercase tracking-wide">Line Thickness</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={lineThickness}
              onChange={(e) => onThicknessChange(Number.parseFloat(e.target.value))}
              className="flex-1 h-3 rounded-full cursor-pointer accent-primary"
            />
            <span className="text-sm font-bold text-primary w-10">{lineThickness}px</span>
          </div>
        </div>

        {/* Process Button */}
        <Button
          onClick={onProcess}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all"
          size="lg"
        >
          Process Video
        </Button>
      </div>
    </Card>
  )
}
