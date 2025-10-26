"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Eye, Sparkles, Send, Github, ExternalLink, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AdminSubmissionCardProps {
  submission: any
  onAnalyze: (id: string) => void
  onSendToJudge: (id: string) => void
  analyzing: boolean
  sending: boolean
}

export function AdminSubmissionCard({ 
  submission, 
  onAnalyze, 
  onSendToJudge,
  analyzing,
  sending 
}: AdminSubmissionCardProps) {
  const [showDetails, setShowDetails] = useState(false)

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
          {submission.status === 'PENDING' && (
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
            <Button 
              onClick={() => onSendToJudge(submission.id)} 
              disabled={sending}
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
          )}

          {submission.status === 'READY_FOR_REVIEW' && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              ✓ Sent to Judge
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
