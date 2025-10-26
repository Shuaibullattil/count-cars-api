"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"

interface LineEditorProps {
  videoUrl: string
  lineDirection: "vertical" | "horizontal"
  linePosition: number
  lineColor: string
  lineThickness: number
}

export default function LineEditor({
  videoUrl,
  lineDirection,
  linePosition,
  lineColor,
  lineThickness,
}: LineEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw first frame
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        drawLine(ctx)
      }
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata)
  }, [])

  const drawLine = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return

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

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    drawLine(ctx)
  }

  useEffect(() => {
    redrawCanvas()
  }, [lineDirection, linePosition, lineColor, lineThickness])

  return (
    <Card className="bg-card p-6">
      <h2 className="text-xl font-semibold mb-4">Line Preview</h2>
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} src={videoUrl} className="hidden" crossOrigin="anonymous" />
        <canvas ref={canvasRef} className="w-full" />
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        {lineDirection === "vertical" ? "Vertical" : "Horizontal"} line at {linePosition}%
      </p>
    </Card>
  )
}
