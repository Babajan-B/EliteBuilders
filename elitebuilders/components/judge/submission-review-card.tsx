"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Github, ExternalLink, Calendar, User, Building2, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { ScoringInfographic } from "./scoring-infographic"

interface SubmissionReviewCardProps {
  submission: any
  submitterName?: string
  submissionTitle?: string
  judge?: { 
    id: string
    display_name: string
    avatar_url?: string | null 
  }
}

export function SubmissionReviewCard({ 
  submission, 
  submitterName, 
  submissionTitle, 
  judge 
}: SubmissionReviewCardProps) {
  const router = useRouter()
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [reviewData, setReviewData] = useState({
    status: submission.status || "pending",
    score: submission.score?.toString() || "",
    feedback: submission.feedback || "",
    delta: "0",
  })

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  async function handleSubmitReview() {
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/judge/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submission.id,
          status: reviewData.status,
          score: reviewData.score ? Number.parseInt(reviewData.score) : null,
          feedback: reviewData.feedback,
          delta: Number.parseInt(reviewData.delta), // Include delta in the API call
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review")
      }

      setSuccess(true)
      setTimeout(() => {
        setIsReviewOpen(false)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={statusColors[submission.status as keyof typeof statusColors]}>
                {submission.status}
              </Badge>
              {submission.score !== null && (
                <Badge variant="secondary" className="font-semibold">
                  Score: {submission.score}/100
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl mb-1">{submission.challenge_title}</CardTitle>
            <CardDescription className="text-base">
              Competition: {submission.competition_title}
            </CardDescription>
          </div>
          <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
            <DialogTrigger asChild>
              <Button>{submission.status === "pending" ? "Review" : "Update Review"}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Review Submission</DialogTitle>
                <DialogDescription>Provide your score and feedback for this submission</DialogDescription>
              </DialogHeader>

              {/* Header Strip */}
              {(submitterName || submissionTitle || judge) && (
                <div className="px-6 py-3 bg-muted/30 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                      {submitterName && submissionTitle ? (
                        <>Evaluating submission by <span className="font-medium text-foreground">{submitterName}</span> — <span className="font-medium text-foreground">{submissionTitle}</span></>
                      ) : submitterName ? (
                        <>Evaluating submission by <span className="font-medium text-foreground">{submitterName}</span></>
                      ) : submissionTitle ? (
                        <>Evaluating submission: <span className="font-medium text-foreground">{submissionTitle}</span></>
                      ) : null}
                    </div>
                    {judge && (
                      <div className="flex items-center gap-2 text-sm">
                        {judge.avatar_url ? (
                          <Avatar className="h-6 w-6">
                            <img src={judge.avatar_url} alt={judge.display_name} />
                          </Avatar>
                        ) : (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {judge.display_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="font-medium">{judge.display_name}</span>
                        <span className="text-muted-foreground">· Judge</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-6 py-4">
                {/* Submission Details */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Submission Details</h4>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Challenge:</span> {submission.challenge_title}
                    </p>
                    <p>
                      <span className="font-medium">Competition:</span> {submission.competition_title}
                    </p>
                    <p>
                      <span className="font-medium">Submission ID:</span> {submission.id}
                    </p>
                  </div>
                  
                         {/* Enhanced Scoring Breakdown */}
                         <div className="space-y-4">
                           {/* Auto Scoring Section */}
                           <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                             <h4 className="font-semibold mb-3 text-sm text-green-900 flex items-center gap-2">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                               Auto Scoring ({submission.scores?.auto?.score_auto || submission.auto_score || 0}/20)
                             </h4>
                             
                             {submission.scores?.auto?.checks ? (
                               <div className="space-y-2">
                                 {submission.scores.auto.checks.map((check: any, index: number) => (
                                   <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-green-100">
                                     <div className="flex items-center gap-2">
                                       <div className={`w-2 h-2 rounded-full ${check.ok ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                       <span className="text-sm text-green-800">{check.label}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       <span className="text-xs text-green-600">{check.weight} pts</span>
                                       <span className={`text-xs font-semibold ${check.ok ? 'text-green-700' : 'text-red-600'}`}>
                                         {check.ok ? '✓' : '✗'}
                                       </span>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="text-sm text-green-700">Auto scoring details not available</div>
                             )}
                           </div>

                           {/* LLM Scoring Section */}
                           <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                             <h4 className="font-semibold mb-3 text-sm text-purple-900 flex items-center gap-2">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                               </svg>
                               LLM Evaluation ({submission.scores?.llm?.model || 'Gemini 1.5 Flash'})
                             </h4>
                             
                             <div className="mb-3">
                               <div className="flex items-center justify-between">
                                 <span className="text-sm text-purple-800">Total LLM Score:</span>
                                 <span className="font-semibold text-purple-900">
                                   {submission.scores?.llm?.score_llm || submission.llm_score || 0}/60
                                 </span>
                               </div>
                             </div>

                             {submission.scores?.llm?.rubric ? (
                               <div className="space-y-2">
                                 {submission.scores.llm.rubric.map((item: any, index: number) => (
                                   <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-purple-100">
                                     <span className="text-sm text-purple-800">{item.label}</span>
                                     <div className="flex items-center gap-2">
                                       <div className="w-16 bg-purple-100 rounded-full h-2">
                                         <div 
                                           className="bg-purple-500 h-2 rounded-full" 
                                           style={{ width: `${(item.score / item.max) * 100}%` }}
                                         ></div>
                                       </div>
                                       <span className="text-xs font-semibold text-purple-900 min-w-[3rem] text-right">
                                         {item.score}/{item.max}
                                       </span>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="text-sm text-purple-700">LLM rubric details not available</div>
                             )}
                             
                             {submission.scores?.llm?.rationale_md && (
                               <div className="mt-3 pt-3 border-t border-purple-200">
                                 <span className="font-medium text-purple-800 text-xs">AI Rationale:</span>
                                 <p className="text-xs text-purple-700 mt-1">{submission.scores.llm.rationale_md}</p>
                               </div>
                             )}
                           </div>

                           {/* Provisional Score Summary */}
                           <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                             <h4 className="font-semibold mb-3 text-sm text-blue-900">Provisional Score Calculation</h4>
                             <div className="grid grid-cols-2 gap-4 text-sm">
                               <div>
                                 <span className="font-medium text-blue-800">Auto Score:</span>
                                 <span className="ml-2 font-semibold text-blue-900">
                                   {submission.scores?.auto?.score_auto || submission.auto_score || 0}/20
                                 </span>
                               </div>
                               <div>
                                 <span className="font-medium text-blue-800">LLM Score:</span>
                                 <span className="ml-2 font-semibold text-blue-900">
                                   {submission.scores?.llm?.score_llm || submission.llm_score || 0}/60
                                 </span>
                               </div>
                               <div className="col-span-2">
                                 <span className="font-medium text-blue-800">Provisional Score:</span>
                                 <span className="ml-2 font-semibold text-blue-900">
                                   {submission.scores?.provisional_score || Math.round((submission.auto_score || 0) * 0.2 + (submission.llm_score || 0) * 0.6)}/100
                                 </span>
                                 <div className="text-xs text-blue-600 mt-1">
                                   Formula: 0.2 × Auto + 0.6 × LLM
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                  
                         {/* Scoring Infographic */}
                         <ScoringInfographic 
                           autoScore={submission.scores?.auto?.score_auto || submission.auto_score || 18}
                           llmScore={submission.scores?.llm?.score_llm || submission.llm_score || 52}
                           deltaPct={Number(reviewData.delta) || 0}
                           className="mt-4"
                         />

                         {/* Submission History */}
                         {submission.history?.events && submission.history.events.length > 0 && (
                           <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                             <h4 className="font-semibold mb-3 text-sm text-gray-900 flex items-center gap-2">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                               Submission Timeline
                             </h4>
                             <div className="space-y-2">
                               {submission.history.events.map((event: any, index: number) => (
                                 <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border border-gray-100">
                                   <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                   <div className="flex-1">
                                     <div className="flex items-center gap-2">
                                       <span className="text-sm font-medium text-gray-900">{event.type}</span>
                                       <span className="text-xs text-gray-500">by {event.by}</span>
                                     </div>
                                     <div className="text-xs text-gray-600 mt-1">{event.note}</div>
                                     <div className="text-xs text-gray-400 mt-1">
                                       {new Date(event.ts).toLocaleString()}
                                     </div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {/* Previous Reviews */}
                         {submission.history?.previous_reviews && submission.history.previous_reviews.length > 0 && (
                           <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                             <h4 className="font-semibold mb-3 text-sm text-amber-900 flex items-center gap-2">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                               Previous Reviews
                             </h4>
                             <div className="space-y-3">
                               {submission.history.previous_reviews.map((review: any, index: number) => (
                                 <div key={index} className="p-3 bg-white rounded border border-amber-100">
                                   <div className="flex items-center justify-between mb-2">
                                     <span className="text-sm font-medium text-amber-900">
                                       {review.judge_display_name}
                                     </span>
                                     <div className="flex items-center gap-2">
                                       <span className={`text-xs px-2 py-1 rounded ${review.locked_bool ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                         {review.locked_bool ? 'Locked' : 'Draft'}
                                       </span>
                                       <span className="text-sm font-semibold text-amber-900">
                                         Final: {review.final_score}/100
                                       </span>
                                     </div>
                                   </div>
                                   <div className="text-xs text-amber-700 mb-2">
                                     Delta: {review.delta_pct > 0 ? '+' : ''}{review.delta_pct}%
                                   </div>
                                   {review.notes_md && (
                                     <div className="text-xs text-amber-800 bg-amber-25 p-2 rounded border border-amber-100">
                                       {review.notes_md}
                                     </div>
                                   )}
                                   <div className="text-xs text-amber-500 mt-2">
                                     {new Date(review.locked_at).toLocaleString()}
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={submission.github_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-2" />
                        View Code
                      </a>
                    </Button>
                    {submission.demo_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={submission.demo_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Live Demo
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Review Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <select
                      id="status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={reviewData.status}
                      onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delta">Score Adjustment (±10-20%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="delta"
                        type="number"
                        min="-20"
                        max="20"
                        placeholder="0"
                        value={reviewData.delta || ""}
                        onChange={(e) => setReviewData({ ...reviewData, delta: e.target.value })}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                      <div className="text-sm text-muted-foreground" aria-live="polite">
                        {(() => {
                          const provisionalScore = Math.round((submission.auto_score || 18) * 0.2 + (submission.llm_score || 52) * 0.6)
                          const deltaPct = Number(reviewData.delta) || 0
                          const finalScore = Math.max(0, Math.min(100, provisionalScore * (1 + deltaPct / 100)))
                          return (
                            <>
                              Provisional {provisionalScore} × (1 {deltaPct >= 0 ? '+' : ''}{deltaPct}%) → <strong>{finalScore.toFixed(1)}</strong>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Adjust the provisional score by ±10-20% based on your evaluation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Judge Rationale</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Explain your score adjustment and provide constructive feedback..."
                      value={reviewData.feedback}
                      onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                      rows={6}
                      className="resize-none"
                    />
                    {reviewData.feedback.length > 0 && reviewData.feedback.length < 10 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600">
                        <Info className="h-3 w-3" />
                        Add at least 10 characters.
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-500/20 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">Review submitted successfully!</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleSubmitReview} disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setIsReviewOpen(false)} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          Challenge: {submission.challenge_title} for {submission.competition_title}
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Submission #{submission.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Submitted {submission.submitted_at || submission.created_at 
                ? formatDistanceToNow(new Date(submission.submitted_at || submission.created_at), { addSuffix: true })
                : 'recently'}
            </span>
          </div>
        </div>

               {/* Enhanced Scoring Summary */}
               <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                 <h4 className="font-semibold mb-3 text-sm text-blue-900 flex items-center gap-2">
                   <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                   </svg>
                   Scoring Summary
                 </h4>
                 
                 <div className="grid grid-cols-3 gap-4 text-sm">
                   <div className="text-center p-2 bg-white rounded border border-green-100">
                     <div className="text-xs text-green-600 mb-1">Auto Score</div>
                     <div className="font-bold text-green-800">
                       {submission.scores?.auto?.score_auto || submission.auto_score || 0}/20
                     </div>
                   </div>
                   <div className="text-center p-2 bg-white rounded border border-purple-100">
                     <div className="text-xs text-purple-600 mb-1">LLM Score</div>
                     <div className="font-bold text-purple-800">
                       {submission.scores?.llm?.score_llm || submission.llm_score || 0}/60
                     </div>
                   </div>
                   <div className="text-center p-2 bg-white rounded border border-blue-100">
                     <div className="text-xs text-blue-600 mb-1">Provisional</div>
                     <div className="font-bold text-blue-800">
                       {submission.scores?.provisional_score || Math.round((submission.auto_score || 0) * 0.2 + (submission.llm_score || 0) * 0.6)}/100
                     </div>
                   </div>
                 </div>

                 {/* Status Badge */}
                 <div className="mt-3 flex items-center justify-center">
                   <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                     submission.status === 'FINAL' ? 'bg-green-100 text-green-700' :
                     submission.status === 'PROVISIONAL' ? 'bg-yellow-100 text-yellow-700' :
                     submission.status === 'SCORING' ? 'bg-blue-100 text-blue-700' :
                     'bg-gray-100 text-gray-700'
                   }`}>
                     {submission.status}
                   </span>
                 </div>
               </div>

               {/* Auto Scoring Breakdown */}
               {submission.scores?.auto?.checks && (
                 <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                   <h5 className="font-semibold mb-2 text-sm text-green-900">Auto Checks</h5>
                   <div className="space-y-1">
                     {submission.scores.auto.checks.map((check: any, index: number) => (
                       <div key={index} className="flex items-center justify-between text-xs">
                         <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${check.ok ? 'bg-green-500' : 'bg-red-500'}`}></div>
                           <span className="text-green-800">{check.label}</span>
                         </div>
                         <span className={`font-semibold ${check.ok ? 'text-green-700' : 'text-red-600'}`}>
                           {check.ok ? '✓' : '✗'} {check.weight}pts
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* LLM Rubric Breakdown */}
               {submission.scores?.llm?.rubric && (
                 <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                   <h5 className="font-semibold mb-2 text-sm text-purple-900">LLM Rubric Scores</h5>
                   <div className="space-y-1">
                     {submission.scores.llm.rubric.map((item: any, index: number) => (
                       <div key={index} className="flex items-center justify-between text-xs">
                         <span className="text-purple-800">{item.label}</span>
                         <div className="flex items-center gap-2">
                           <div className="w-12 bg-purple-100 rounded-full h-1.5">
                             <div 
                               className="bg-purple-500 h-1.5 rounded-full" 
                               style={{ width: `${(item.score / item.max) * 100}%` }}
                             ></div>
                           </div>
                           <span className="font-semibold text-purple-900 min-w-[2.5rem] text-right">
                             {item.score}/{item.max}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Submission Timeline Preview */}
               {submission.history?.events && submission.history.events.length > 0 && (
                 <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                   <h5 className="font-semibold mb-2 text-sm text-gray-900">Recent Activity</h5>
                   <div className="space-y-1">
                     {submission.history.events.slice(-2).map((event: any, index: number) => (
                       <div key={index} className="flex items-center gap-2 text-xs">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                         <span className="text-gray-700">{event.type}</span>
                         <span className="text-gray-500">by {event.by}</span>
                         <span className="text-gray-400 ml-auto">
                           {new Date(event.ts).toLocaleDateString()}
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

        {submission.feedback && (
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-semibold mb-2 text-sm">Judge Feedback</h4>
            <p className="text-sm text-muted-foreground">{submission.feedback}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={submission.github_url} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4 mr-2" />
              View Code
            </a>
          </Button>
          {submission.demo_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={submission.demo_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Live Demo
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
