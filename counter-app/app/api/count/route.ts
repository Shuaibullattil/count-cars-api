export async function POST(request: Request) {
  // Create a new counting job: proxy the multipart form to backend which returns { job_id }
  try {
    const formData = await request.formData()

    const response = await fetch("http://localhost:8000/count", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      return Response.json({ error: `Backend API error: ${response.statusText}` }, { status: response.status })
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] API route error:", error)
    return Response.json(
      { error: "Failed to create job. Please ensure the backend server is running." },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  // Query string should contain jobId
  try {
    const url = new URL(request.url)
    const jobId = url.searchParams.get("jobId")
    if (!jobId) {
      return Response.json({ error: "Missing jobId" }, { status: 400 })
    }

    const response = await fetch(`http://localhost:8000/count/status/${encodeURIComponent(jobId)}`)
    if (!response.ok) {
      return Response.json({ error: `Backend API error: ${response.statusText}` }, { status: response.status })
    }
    const data = await response.json()
    console.log("Backend response:", data) // Debug log
    return Response.json({
      ...data,
      processed_duration: data.processed_duration || 0,
      total_duration: data.total_duration || 0
    })
  } catch (error) {
    console.error("[v0] API route GET error:", error)
    return Response.json({ error: "Failed to fetch job status." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  // Expect JSON body: { jobId }
  try {
    const body = await request.json()
    const jobId = body.jobId
    if (!jobId) {
      return Response.json({ error: "Missing jobId" }, { status: 400 })
    }
    const response = await fetch(`http://localhost:8000/count/cancel/${encodeURIComponent(jobId)}`, {
      method: "POST",
    })
    if (!response.ok) {
      return Response.json({ error: `Backend API error: ${response.statusText}` }, { status: response.status })
    }
    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] API route DELETE error:", error)
    return Response.json({ error: "Failed to cancel job." }, { status: 500 })
  }
}
