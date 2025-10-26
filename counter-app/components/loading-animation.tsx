"use client"

import { Card } from "@/components/ui/card"

export default function LoadingAnimation() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="bg-card p-12 rounded-3xl border-2 border-border shadow-lg max-w-md w-full">
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-bold text-foreground">Analyzing Video</h2>
          <p className="text-muted-foreground text-lg">This may take up to 1 minute...</p>

          {/* Animated Vehicle Icons */}
          <div className="flex justify-center items-center gap-4 h-24">
            <div className="animate-bounce" style={{ animationDelay: "0s" }}>
              <div className="text-6xl">🚗</div>
            </div>
            <div className="animate-bounce" style={{ animationDelay: "0.2s" }}>
              <div className="text-6xl">🚌</div>
            </div>
            <div className="animate-bounce" style={{ animationDelay: "0.4s" }}>
              <div className="text-6xl">🏍️</div>
            </div>
            <div className="animate-bounce" style={{ animationDelay: "0.6s" }}>
              <div className="text-6xl">🚙</div>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-3">
            <div className="w-full bg-input rounded-full h-3 overflow-hidden border-2 border-border">
              <div
                className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full"
                style={{
                  animation: "shimmer 2s infinite",
                  backgroundSize: "200% 100%",
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground font-semibold">Processing...</p>
          </div>

          {/* Floating Text */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Detecting vehicles...</p>
            <p className="text-xs opacity-75">Please wait while we analyze your video</p>
          </div>

          <style>{`
            @keyframes shimmer {
              0% {
                background-position: 200% 0;
              }
              100% {
                background-position: -200% 0;
              }
            }
          `}</style>
        </div>
      </Card>
    </div>
  )
}
