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

    console.log("🔍 JUDGE API: Updating submission:", {
      submission_id,
      status,
      score,
      feedback: feedback?.substring(0, 50) + "...",
      userId: user.id,
      userRole: user.role
    })

    // Simple update: just status and basic review data
    // The status will be updated to REVIEWED when judge completes review
    const updateData: any = {
      status: "REVIEWED",  // Mark as reviewed by judge
    }
    
    // Only add fields if they're provided
    if (feedback) {
      updateData.rationale_md = feedback  // Use rationale_md for feedback
    }

    const { data: submission, error: updateError } = await supabase
      .from("submissions")
      .update(updateData)
      .eq("id", submission_id)
      .select()
      .single()

    console.log("✅ JUDGE API: Update result:", {
      success: !updateError,
      error: updateError,
      submissionId: submission?.id,
      newStatus: submission?.status
    })

    if (updateError) {
      console.error("❌ JUDGE API: Review update error:", updateError)
      return NextResponse.json({ 
        error: "Failed to update submission", 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error("[v0] Review API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
