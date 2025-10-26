"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, AlertCircle, CheckCircle2, XCircle, TrendingUp, 
  Code2, FileText, Package, Shield, Users
} from "lucide-react"

interface DetailedAnalysisProps {
  analysis: {
    scores: {
      problem_fit: number
      tech_depth: number
      ux_flow: number
      impact: number
      total: number
    }
    strengths: string[]
    weaknesses: string[]
    code_quality_notes: string
    tech_stack_verification: string
    documentation_quality: string
    recommendation: string
    rationale: string
    analyzed_at: string
  }
  submissionId: string
  onAssignJudge?: () => void
}

export function DetailedAnalysisReport({ analysis, submissionId, onAssignJudge }: DetailedAnalysisProps) {
  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-blue-600"
    if (percentage >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getRecommendationStyle = (rec: string) => {
    if (rec.includes('STRONG_ACCEPT')) return { bg: 'bg-green-100', text: 'text-green-800', icon: <Trophy className="w-4 h-4" /> }
    if (rec.includes('ACCEPT')) return { bg: 'bg-blue-100', text: 'text-blue-800', icon: <CheckCircle2 className="w-4 h-4" /> }
    if (rec.includes('BORDERLINE')) return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <AlertCircle className="w-4 h-4" /> }
    return { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-4 h-4" /> }
  }

  const recStyle = getRecommendationStyle(analysis.recommendation)
  const totalPercentage = (analysis.scores.total / 60) * 100

  return (
    <div className="space-y-6">
      {/* Header Card - Overall Score */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">AI Analysis Report</CardTitle>
              <CardDescription>
                Analyzed on {new Date(analysis.analyzed_at).toLocaleString()}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {analysis.scores.total}
                <span className="text-2xl text-muted-foreground">/60</span>
              </div>
              <Progress value={totalPercentage} className="mt-2 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge className={`${recStyle.bg} ${recStyle.text} flex items-center gap-1 px-3 py-1`}>
              {recStyle.icon}
              <span className="font-semibold">{analysis.recommendation}</span>
            </Badge>
            {onAssignJudge && (
              <Button variant="outline" size="sm" onClick={onAssignJudge} className="ml-auto">
                <Users className="w-4 h-4 mr-2" />
                Assign to Judge
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreBar 
            label="Problem Fit" 
            score={analysis.scores.problem_fit} 
            max={15} 
            color={getScoreColor(analysis.scores.problem_fit, 15)}
          />
          <ScoreBar 
            label="Technical Depth" 
            score={analysis.scores.tech_depth} 
            max={20} 
            color={getScoreColor(analysis.scores.tech_depth, 20)}
          />
          <ScoreBar 
            label="UX & Demo Quality" 
            score={analysis.scores.ux_flow} 
            max={15} 
            color={getScoreColor(analysis.scores.ux_flow, 15)}
          />
          <ScoreBar 
            label="Impact & Clarity" 
            score={analysis.scores.impact} 
            max={10} 
            color={getScoreColor(analysis.scores.impact, 10)}
          />
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.strengths.map((strength, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-orange-600 mt-0.5">→</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Technical Assessment */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Code Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{analysis.code_quality_notes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              Tech Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{analysis.tech_stack_verification}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{analysis.documentation_quality}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Rationale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Detailed Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {analysis.rationale.split('\n\n').map((para, idx) => (
              <p key={idx} className="text-sm text-muted-foreground mb-3 last:mb-0">
                {para}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for score bars
function ScoreBar({ label, score, max, color }: { label: string, score: number, max: number, color: string }) {
  const percentage = (score / max) * 100
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className={`font-semibold ${color}`}>
          {score}/{max}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
