"use client"

import { useState } from "react"
import VideoUploader from "@/components/video-uploader"
import VideoPreview from "@/components/video-preview"
import ConfigurationPanel from "@/components/configuration-panel"
import ResultsDisplay from "@/components/results-display"
import LoadingAnimation from "@/components/loading-animation"

type AppStep = "upload" | "configure" | "results" | "processing"

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [lineDirection, setLineDirection] = useState<"vertical" | "horizontal">("vertical")
  const [linePosition, setLinePosition] = useState(50)
  const [lineColor, setLineColor] = useState("#FF6B35")
  const [lineThickness, setLineThickness] = useState(3)
  const [results, setResults] = useState<any>(null)

  const handleVideoUpload = (file: File) => {
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setStep("configure")
  }

  const handleProcessVideo = async () => {
    if (!videoFile) return

    setStep("processing")
    try {
      const formData = new FormData()
      formData.append("video", videoFile)
      formData.append("orientation", lineDirection)
      formData.append("position", linePosition.toString())

      const response = await fetch("/api/count", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setStep("results")
      } else {
        const errorData = await response.json()
        console.error("API error:", errorData.error)
        alert("Error: " + (errorData.error || "Failed to process video"))
        setStep("configure")
      }
    } catch (error) {
      console.error("Error processing video:", error)
      alert("Error: Failed to connect to the server. Make sure the backend is running at http://localhost:8000")
      setStep("configure")
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-2 text-primary">Vehicle Counter</h1>
          <p className="text-lg text-muted-foreground">Count vehicles with a simple line-based approach</p>
        </header>

        {step === "upload" && <VideoUploader onUpload={handleVideoUpload} />}

        {step === "configure" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <VideoPreview
                videoUrl={videoUrl}
                lineDirection={lineDirection}
                linePosition={linePosition}
                lineColor={lineColor}
                lineThickness={lineThickness}
              />
            </div>
            <div>
              <ConfigurationPanel
                lineDirection={lineDirection}
                linePosition={linePosition}
                lineColor={lineColor}
                lineThickness={lineThickness}
                onDirectionChange={setLineDirection}
                onPositionChange={setLinePosition}
                onColorChange={setLineColor}
                onThicknessChange={setLineThickness}
                onProcess={handleProcessVideo}
              />
            </div>
          </div>
        )}

        {step === "processing" && <LoadingAnimation />}

        {step === "results" && results && (
          <ResultsDisplay
            results={results}
            onReset={() => {
              setStep("upload")
              setVideoFile(null)
              setVideoUrl("")
              setResults(null)
            }}
          />
        )}
      </div>
    </main>
  )
}
