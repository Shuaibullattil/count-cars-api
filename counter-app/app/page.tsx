"use client"

import { useState, useRef, useEffect } from "react"
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
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const pollRef = useRef<number | null>(null)

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

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API error:", errorData.error)
        alert("Error: " + (errorData.error || "Failed to create processing job"))
        setStep("configure")
        return
      }

      const data = await response.json()
      if (!data.job_id) {
        alert("Unexpected response from server when starting job")
        setStep("configure")
        return
      }

      setJobId(data.job_id)
      setProgress(0) // Reset progress for new job

      // start polling status
      pollRef.current = window.setInterval(async () => {
        try {
          const statusResp = await fetch(`/api/count?jobId=${encodeURIComponent(data.job_id)}`)
          if (!statusResp.ok) {
            // ignore transient failures but log
            const err = await statusResp.text()
            console.warn("Status fetch failed:", err)
            return
          }
          const statusData = await statusResp.json()
          if (statusData.error) {
            console.error("Job status error:", statusData.error)
            if (pollRef.current) {
              clearInterval(pollRef.current)
              pollRef.current = null
            }
            setStep("configure")
            alert("Processing error: " + statusData.error)
            return
          }

          // Ensure progress is a valid number between 0-100
          const pct = Math.min(100, Math.max(0, 
            typeof statusData.progress === "number" ? statusData.progress : 0
          ))
          setProgress(pct)

          if (statusData.status === "done") {
            // finalize results
            const resultsObj = {
              total_vehicles: statusData.total_vehicles || 0,
              class_counts: statusData.class_counts || {},
              orientation: lineDirection,
              position: linePosition,
            }
            clearInterval(pollRef.current as number)
            pollRef.current = null
            setResults(resultsObj)
            setStep("results")
          }
        } catch (e) {
          console.error("Error polling job status:", e)
        }
      }, 1000)
    } catch (error) {
      console.error("Error creating job:", error)
      alert("Error: Failed to connect to the server. Make sure the backend is running at http://localhost:8000")
      setStep("configure")
    }
  }

  // Cancel processing and request interim snapshot
  const handleCancel = async () => {
    if (!jobId) return
    try {
      const resp = await fetch("/api/count", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
      if (!resp.ok) {
        const err = await resp.json()
        console.error("Cancel error:", err)
        alert("Failed to cancel the job")
        return
      }
      const snapshot = await resp.json()
      if (!snapshot || typeof snapshot !== "object") {
        console.error("Invalid snapshot response:", snapshot)
        alert("Received invalid response when cancelling")
        return
      }

      const resultsObj = {
        total_vehicles: snapshot.total_vehicles || 0,
        class_counts: snapshot.class_counts || {},
        orientation: lineDirection,
        position: linePosition,
      }
      
      if (pollRef.current) {
        clearInterval(pollRef.current as number)
        pollRef.current = null
      }
      setJobId(null) // Clear job ID after cancellation
      setResults(resultsObj)
      setStep("results")
    } catch (e) {
      console.error("Error cancelling job:", e)
      alert("Failed to cancel the job. Please try again.")
    }
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current as number)
      }
    }
  }, [])

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

        {step === "processing" && (
          <LoadingAnimation progress={progress} onCancel={handleCancel} />
        )}

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
