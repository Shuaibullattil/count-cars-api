"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface VideoUploaderProps {
  onUpload: (file: File) => void
}

export default function VideoUploader({ onUpload }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validVideoTypes = ["video/mp4", "video/x-msvideo", "video/quicktime"]
  const maxFileSize = 500 * 1024 * 1024 // 500MB

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const validateAndUpload = (file: File) => {
    if (!validVideoTypes.includes(file.type)) {
      alert("Please upload a valid video file (MP4, AVI, or MOV)")
      return
    }

    if (file.size > maxFileSize) {
      alert("File size must be less than 500MB")
      return
    }

    setUploadProgress(100)
    onUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      validateAndUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      validateAndUpload(files[0])
    }
  }

  return (
    <Card className="border-2 border-dashed border-border bg-card/50 p-12">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`text-center transition-colors ${isDragging ? "bg-primary/10 border-primary" : ""}`}
      >
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <h3 className="text-xl font-semibold mb-2">Upload Video</h3>
        <p className="text-muted-foreground mb-6">Drag and drop your video file here, or click to browse</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/x-msvideo,video/quicktime"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button onClick={() => fileInputRef.current?.click()} size="lg" className="bg-primary hover:bg-primary/90">
          Select Video File
        </Button>

        <p className="text-sm text-muted-foreground mt-6">Supported formats: MP4, AVI, MOV • Max size: 500MB</p>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-6">
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{uploadProgress}% uploaded</p>
          </div>
        )}
      </div>
    </Card>
  )
}
