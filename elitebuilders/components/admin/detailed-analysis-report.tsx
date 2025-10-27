"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, AlertCircle, CheckCircle2, XCircle, TrendingUp, 
  Code2, FileText, Package, Shield, Users, Star, Sparkles
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
    if (percentage >= 80) return { text: "text-green-600", bg: "bg-green-500", border: "border-green-500", light: "bg-green-50" }
    if (percentage >= 60) return { text: "text-blue-600", bg: "bg-blue-500", border: "border-blue-500", light: "bg-blue-50" }
    if (percentage >= 40) return { text: "text-yellow-600", bg: "bg-yellow-500", border: "border-yellow-500", light: "bg-yellow-50" }
    return { text: "text-red-600", bg: "bg-red-500", border: "border-red-500", light: "bg-red-50" }
  }

  const getRecommendationStyle = (rec: string) => {
    if (rec.includes('STRONG_ACCEPT')) return { 
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600', 
      text: 'text-white', 
      icon: <Trophy className="w-5 h-5" />,
      badge: 'STRONG ACCEPT',
      emoji: '🏆'
    }
    if (rec.includes('ACCEPT')) return { 
      bg: 'bg-gradient-to-r from-blue-500 to-cyan-600', 
      text: 'text-white', 
      icon: <CheckCircle2 className="w-5 h-5" />,
      badge: 'ACCEPT',
      emoji: '✅'
    }
    if (rec.includes('BORDERLINE')) return { 
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500', 
      text: 'text-white', 
      icon: <AlertCircle className="w-5 h-5" />,
      badge: 'BORDERLINE',
      emoji: '⚠️'
    }
    return { 
      bg: 'bg-gradient-to-r from-red-500 to-pink-600', 
      text: 'text-white', 
      icon: <XCircle className="w-5 h-5" />,
      badge: 'NEEDS WORK',
      emoji: '❌'
    }
  }

  const recStyle = getRecommendationStyle(analysis.recommendation)
  const totalPercentage = (analysis.scores.total / 60) * 100

  return (
    <div className="space-y-6">
      {/* Header Card - Overall Score with Radial Progress */}
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <div className={`${recStyle.bg} px-6 py-4`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              {recStyle.icon}
              <div>
                <h3 className="text-xl font-bold">AI Analysis Report</h3>
                <p className="text-sm opacity-90">
                  {new Date(analysis.analyzed_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-5xl">{recStyle.emoji}</div>
          </div>
        </div>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <Badge className={`${recStyle.bg} ${recStyle.text} text-lg px-4 py-2 font-bold shadow-md`}>
                {recStyle.badge}
              </Badge>
            </div>
            {onAssignJudge && (
              <Button variant="default" size="lg" onClick={onAssignJudge} className="shadow-md">
                <Users className="w-5 h-5 mr-2" />
                Assign to Judge
              </Button>
            )}
          </div>
          
          {/* Radial Score Display */}
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <RadialProgress value={totalPercentage} size={200} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {analysis.scores.total}
                </div>
                <div className="text-2xl font-semibold text-muted-foreground">/ 60</div>
                <div className="text-sm text-muted-foreground mt-1">{Math.round(totalPercentage)}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown with Enhanced Bars */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Score Breakdown
          </CardTitle>
          <CardDescription>Detailed evaluation across key dimensions</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <EnhancedScoreBar 
              label="Problem Fit" 
              description="How well the solution addresses the challenge"
              score={analysis.scores.problem_fit} 
              max={15} 
              icon={<Trophy className="w-5 h-5" />}
              colorScheme={getScoreColor(analysis.scores.problem_fit, 15)}
            />
            <EnhancedScoreBar 
              label="Technical Depth" 
              description="Code quality, architecture, and innovation"
              score={analysis.scores.tech_depth} 
              max={20} 
              icon={<Code2 className="w-5 h-5" />}
              colorScheme={getScoreColor(analysis.scores.tech_depth, 20)}
            />
            <EnhancedScoreBar 
              label="UX & Demo Quality" 
              description="User experience and presentation"
              score={analysis.scores.ux_flow} 
              max={15} 
              icon={<Star className="w-5 h-5" />}
              colorScheme={getScoreColor(analysis.scores.ux_flow, 15)}
            />
            <EnhancedScoreBar 
              label="Impact & Clarity" 
              description="Potential impact and communication"
              score={analysis.scores.impact} 
              max={10} 
              icon={<TrendingUp className="w-5 h-5" />}
              colorScheme={getScoreColor(analysis.scores.impact, 10)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-green-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center gap-3 text-white">
            <CheckCircle2 className="w-6 h-6" />
            <h3 className="text-lg font-bold">Strengths</h3>
          </div>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              {analysis.strengths.map((strength, idx) => (
                <li key={idx} className="flex gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500 hover:shadow-md transition-shadow">
                  <span className="text-green-600 mt-0.5 text-xl">✓</span>
                  <span className="text-sm font-medium text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex items-center gap-3 text-white">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-bold">Areas for Improvement</h3>
          </div>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              {analysis.weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                  <span className="text-orange-600 mt-0.5 text-xl">→</span>
                  <span className="text-sm font-medium text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Technical Assessment with Icons */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <Code2 className="w-4 h-4" />
              </div>
              Code Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.code_quality_notes}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-2 bg-purple-500 rounded-lg text-white">
                <Package className="w-4 h-4" />
              </div>
              Tech Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.tech_stack_verification}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 bg-gradient-to-br from-green-50 to-teal-50">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-lg text-white">
                <FileText className="w-4 h-4" />
              </div>
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.documentation_quality}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Rationale */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Detailed Evaluation
          </CardTitle>
          <CardDescription>Comprehensive analysis and reasoning</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-sm max-w-none">
            {analysis.rationale.split('\n\n').map((para, idx) => (
              <p key={idx} className="text-sm text-gray-700 mb-4 last:mb-0 leading-relaxed bg-gray-50 p-4 rounded-lg border-l-2 border-indigo-500">
                {para}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Enhanced Score Bar Component with animations
function EnhancedScoreBar({ 
  label, 
  description,
  score, 
  max, 
  icon,
  colorScheme 
}: { 
  label: string
  description: string
  score: number
  max: number
  icon: React.ReactNode
  colorScheme: { text: string, bg: string, border: string, light: string }
}) {
  const percentage = (score / max) * 100
  
  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 ${colorScheme.light} rounded-lg ${colorScheme.text}`}>
            {icon}
          </div>
          <div>
            <div className="font-bold text-base">{label}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black ${colorScheme.text}`}>
            {score}
            <span className="text-lg text-muted-foreground">/{max}</span>
          </div>
          <div className="text-xs text-muted-foreground font-semibold">{Math.round(percentage)}%</div>
        </div>
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorScheme.bg} rounded-full transition-all duration-1000 ease-out shadow-lg`}
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
        </div>
      </div>
    </div>
  )
}

// Radial Progress Component
function RadialProgress({ value, size }: { value: number, size: number }) {
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  
  const getGradientColor = (val: number) => {
    if (val >= 80) return { start: '#10b981', end: '#059669' } // green
    if (val >= 60) return { start: '#3b82f6', end: '#2563eb' } // blue
    if (val >= 40) return { start: '#f59e0b', end: '#d97706' } // yellow
    return { start: '#ef4444', end: '#dc2626' } // red
  }
  
  const gradient = getGradientColor(value)
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradient.start} />
          <stop offset="100%" stopColor={gradient.end} />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out drop-shadow-lg"
      />
    </svg>
  )
}
