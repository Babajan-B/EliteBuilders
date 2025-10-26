import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "judge" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { submission_id, status, score, feedback } = body

    if (!submission_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (score !== null && (score < 0 || score > 100)) {
      return NextResponse.json({ error: "Score must be between 0 and 100" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Update submission
    const { data: submission, error: updateError } = await supabase
      .from("submissions")
      .update({
        status,
        score,
        feedback,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", submission_id)
      .select("*, users(id, total_points)")
      .single()

    if (updateError) {
      console.error("[v0] Review update error:", updateError)
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    // Update user's total points if approved with score
    if (status === "approved" && score !== null) {
      const currentPoints = submission.users?.total_points || 0
      const previousScore = submission.score || 0
      const pointsDiff = score - previousScore

      await supabase
        .from("users")
        .update({
          total_points: currentPoints + pointsDiff,
        })
        .eq("id", submission.user_id)
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error("[v0] Review API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
