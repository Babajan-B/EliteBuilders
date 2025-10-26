import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "builder") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, github_url, demo_url, notes, competition_id } = body

    if (!title || !description || !github_url || !competition_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Check if competition is active
    const { data: competition } = await supabase.from("competitions").select("status").eq("id", competition_id).single()

    if (!competition || competition.status !== "active") {
      return NextResponse.json({ error: "Competition is not active" }, { status: 400 })
    }

    // Allow multiple submissions per user per competition
    // Removed the restriction that prevented resubmissions

    // Create submission
    const { data: submission, error } = await supabase
      .from("submissions")
      .insert({
        competition_id,
        user_id: user.id,
        title,
        description,
        github_url,
        demo_url,
        notes,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Submission creation error:", error)
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
    }

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error("[v0] Submission API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "builder") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { submission_id, title, description, github_url, demo_url, notes } = body

    if (!submission_id || !title || !description || !github_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from("submissions")
      .select("user_id, competition_id")
      .eq("id", submission_id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Check if competition is still active
    const { data: competitionCheck } = await supabase
      .from("competitions")
      .select("status")
      .eq("id", existing.competition_id)
      .single()

    if (!competitionCheck || competitionCheck.status !== "active") {
      return NextResponse.json({ error: "Competition is not active" }, { status: 400 })
    }

    // Update submission
    const { data: submission, error } = await supabase
      .from("submissions")
      .update({
        title,
        description,
        github_url,
        demo_url,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submission_id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Submission update error:", error)
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error("[v0] Submission API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
