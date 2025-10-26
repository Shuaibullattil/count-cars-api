"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"

interface VideoPreviewProps {
  videoUrl: string
  lineDirection: "vertical" | "horizontal"
  linePosition: number
  lineColor: string
  lineThickness: number
}

export default function VideoPreview({
  videoUrl,
  lineDirection,
  linePosition,
  lineColor,
  lineThickness,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const handleLoadedMetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      drawFirstFrame()
    }

    if (video.readyState >= 1) {
      handleLoadedMetadata()
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata)
      return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [])

  useEffect(() => {
    drawFirstFrame()
  }, [lineDirection, linePosition, lineColor, lineThickness])

  const drawFirstFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw first frame
    video.currentTime = 0
    ctx.drawImage(video, 0, 0)

    // Draw line
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineThickness
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.beginPath()

    if (lineDirection === "vertical") {
      const x = (linePosition / 100) * canvas.width
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
    } else {
      const y = (linePosition / 100) * canvas.height
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
    }

    ctx.stroke()
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number.parseFloat(e.target.value)
    setCurrentTime(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  return (
    <Card className="bg-card p-6 shadow-lg border-2 border-border rounded-3xl">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Video Preview</h2>
      <div className="space-y-4">
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden border-2 border-border">
          <canvas ref={canvasRef} className="w-full" />
          <video
            ref={videoRef}
            src={videoUrl}
            className="hidden"
            crossOrigin="anonymous"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />
        </div>

        {/* Video controls */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>{Math.floor(currentTime)}s</span>
            <span>{Math.floor(duration)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleTimeChange}
            className="w-full h-2 rounded-full cursor-pointer accent-primary"
          />
        </div>

        {/* Line info */}
        <div className="bg-primary/10 rounded-2xl p-3 border border-primary/20">
          <p className="text-sm font-semibold text-foreground">
            {lineDirection === "vertical" ? "📏 Vertical" : "📐 Horizontal"} line at{" "}
            <span className="text-primary">{linePosition}%</span>
          </p>
        </div>
      </div>
    </Card>
  )
}
