"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, Sparkles, Send, Github, ExternalLink, FileText, RotateCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DetailedAnalysisReport } from "./detailed-analysis-report"

interface AdminSubmissionCardProps {
  submission: any
  onAnalyze: (id: string, forceReanalyze?: boolean) => void
  onSendToJudge: (id: string, judgeId: string) => void
  analyzing: boolean
  sending: boolean
  judges: Array<{ id: string; display_name: string; email: string }>
}

export function AdminSubmissionCard({ 
  submission, 
  onAnalyze, 
  onSendToJudge,
  analyzing,
  sending,
  judges 
}: AdminSubmissionCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>(submission.assigned_judge_id || "")

  const statusColors = {
    PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    ANALYZING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    ANALYZED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    READY_FOR_REVIEW: "bg-green-500/10 text-green-500 border-green-500/20",
    APPROVED: "bg-green-600/10 text-green-600 border-green-600/20",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={statusColors[submission.status as keyof typeof statusColors] || statusColors.PENDING}>
                {submission.status || 'PENDING'}
              </Badge>
              {submission.score_llm && (
                <Badge variant="secondary">
                  AI Score: {submission.score_llm}/60
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">
              {submission.challenges?.title || 'Challenge'}
            </CardTitle>
            <CardDescription>
              By {submission.profiles?.display_name || 'Unknown User'}
              {' • '}
              {submission.created_at ? formatDistanceToNow(new Date(submission.created_at), { addSuffix: true }) : 'recently'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {submission.repo_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={submission.repo_url} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                Repository
              </a>
            </Button>
          )}
          {submission.demo_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={submission.demo_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Demo
              </a>
            </Button>
          )}
          {submission.deck_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={submission.deck_url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                Deck
              </a>
            </Button>
          )}
          
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submission Details</DialogTitle>
                <DialogDescription>
                  Review the full submission before running AI analysis
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Challenge</h4>
                  <p className="text-sm text-muted-foreground">{submission.challenges?.title}</p>
                </div>

                {submission.writeup_md && (
                  <div>
                    <h4 className="font-semibold mb-2">Project Writeup</h4>
                    <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                      {submission.writeup_md}
                    </div>
                  </div>
                )}

                {submission.score_llm && (
                  <div>
                    <h4 className="font-semibold mb-2">AI Analysis Results</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-sm font-medium text-purple-900">Total Score</div>
                        <div className="text-2xl font-bold text-purple-700">{submission.score_llm}/60</div>
                      </div>
                      
                      {submission.rubric_scores_json && (
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(submission.rubric_scores_json).map(([key, value]: [string, any]) => (
                            <div key={key} className="p-2 bg-blue-50 rounded border border-blue-200">
                              <div className="text-xs text-blue-600">{key.replace(/_/g, ' ').toUpperCase()}</div>
                              <div className="font-bold text-blue-900">{value}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {submission.rationale_md && (
                        <div>
                          <div className="text-sm font-medium mb-2">AI Rationale</div>
                          <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap border">
                            {submission.rationale_md}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          {(submission.status === 'PENDING' || submission.status === 'ANALYZING') && (
            <Button 
              onClick={() => onAnalyze(submission.id)} 
              disabled={analyzing}
              size="sm"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run AI Analysis
                </>
              )}
            </Button>
          )}
          
          {submission.status === 'ANALYZED' && (
            <>
              <div className="flex items-center gap-2 flex-1">
                <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Judge" />
                  </SelectTrigger>
                  <SelectContent>
                    {judges.map((judge) => (
                      <SelectItem key={judge.id} value={judge.id}>
                        {judge.display_name || judge.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => selectedJudgeId && onSendToJudge(submission.id, selectedJudgeId)} 
                  disabled={sending || !selectedJudgeId}
                  size="sm"
                  variant="default"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to Judge
                    </>
                  )}
                </Button>
              </div>
              <Button 
                onClick={() => onAnalyze(submission.id, true)} 
                disabled={analyzing}
                size="sm"
                variant="outline"
                title="Force re-analysis even if already analyzed"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Re-analyzing...
                  </>
                ) : (
                  <>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Re-run Analysis
                  </>
                )}
              </Button>
            </>
          )}

          {submission.status === 'READY_FOR_REVIEW' && (
            <>
              <div className="flex items-center gap-2 flex-1">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  ✓ Sent to Judge
                </Badge>
                {submission.assigned_judge_id && judges.find(j => j.id === submission.assigned_judge_id) && (
                  <Badge variant="secondary">
                    Current: {judges.find(j => j.id === submission.assigned_judge_id)?.display_name}
                  </Badge>
                )}
                
                {/* Allow reassignment to different judge */}
                <div className="flex items-center gap-2 ml-auto">
                  <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Reassign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {judges.map((judge) => (
                        <SelectItem key={judge.id} value={judge.id}>
                          {judge.display_name || judge.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => selectedJudgeId && onSendToJudge(submission.id, selectedJudgeId)} 
                    disabled={sending || !selectedJudgeId}
                    size="sm"
                    variant="outline"
                    title="Reassign to different judge or send to multiple judges"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Reassign
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                onClick={() => onAnalyze(submission.id, true)} 
                disabled={analyzing}
                size="sm"
                variant="outline"
                title="Force re-analysis even if already analyzed"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Re-analyzing...
                  </>
                ) : (
                  <>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Re-run Analysis
                  </>
                )}
              </Button>
            </>
          )}

          {/* REVIEWED or FINAL status - allow reassignment for second opinion */}
          {(submission.status === 'REVIEWED' || submission.status === 'FINAL') && (
            <>
              <div className="flex items-center gap-2 flex-1">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  {submission.status === 'REVIEWED' ? '✓ Reviewed' : '✓ Final'}
                </Badge>
                {submission.assigned_judge_id && judges.find(j => j.id === submission.assigned_judge_id) && (
                  <Badge variant="secondary">
                    Reviewed by: {judges.find(j => j.id === submission.assigned_judge_id)?.display_name}
                  </Badge>
                )}
                
                {/* Allow sending to another judge for second opinion */}
                <div className="flex items-center gap-2 ml-auto">
                  <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Send for 2nd review..." />
                    </SelectTrigger>
                    <SelectContent>
                      {judges.map((judge) => (
                        <SelectItem key={judge.id} value={judge.id}>
                          {judge.display_name || judge.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => selectedJudgeId && onSendToJudge(submission.id, selectedJudgeId)} 
                    disabled={sending || !selectedJudgeId}
                    size="sm"
                    variant="outline"
                    title="Send to another judge for second opinion"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        2nd Review
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                onClick={() => onAnalyze(submission.id, true)} 
                disabled={analyzing}
                size="sm"
                variant="outline"
                title="Force re-analysis even if already analyzed"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Re-analyzing...
                  </>
                ) : (
                  <>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Re-run Analysis
                  </>
                )}
              </Button>
            </>
          )}
        </div>
        
        {/* Show detailed analysis if available */}
        {submission.ai_detailed_analysis && (
          <div className="mt-4 pt-4 border-t">
            <DetailedAnalysisReport 
              analysis={submission.ai_detailed_analysis}
              submissionId={submission.id}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
