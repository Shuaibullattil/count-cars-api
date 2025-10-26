export async function POST(request: Request) {
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
      { error: "Failed to process video. Please ensure the backend server is running." },
      { status: 500 },
    )
  }
}
