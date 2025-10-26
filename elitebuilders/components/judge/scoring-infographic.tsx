"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, Brain, Scale, Target } from "lucide-react"

interface ScoringInfographicProps {
  autoScore?: number
  llmScore?: number
  deltaPct?: number
  className?: string
}

export function ScoringInfographic({ 
  autoScore = 18, 
  llmScore = 52, 
  deltaPct = 0,
  className = "" 
}: ScoringInfographicProps) {
  const provisionalScore = Math.round(autoScore * 0.2 + llmScore * 0.6)
  const finalScore = Math.max(0, Math.min(100, provisionalScore * (1 + deltaPct / 100)))

  return (
    <Card className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
          <Calculator className="h-5 w-5" />
          Scoring System Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scoring Flow */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">Auto Score</div>
                <div className="text-xs text-gray-600">Presence checks (repo, demo, write-up)</div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {autoScore}/20
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">LLM Score</div>
                <div className="text-xs text-gray-600">AI evaluation across rubric dimensions</div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {llmScore}/60
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Scale className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">Provisional Score</div>
                <div className="text-xs text-gray-600">0.2 × Auto + 0.6 × LLM</div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {provisionalScore}/100
            </Badge>
          </div>
        </div>

        {/* Formula Visualization */}
        <div className="p-4 bg-white rounded-lg border border-blue-100">
          <div className="text-sm font-medium text-gray-900 mb-2">Calculation Formula:</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="font-mono bg-gray-50 p-2 rounded">
              Provisional = 0.2 × {autoScore} + 0.6 × {llmScore} = {provisionalScore}
            </div>
            <div className="font-mono bg-gray-50 p-2 rounded">
              Final = {provisionalScore} × (1 + {deltaPct > 0 ? '+' : ''}{deltaPct}%) = {finalScore.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Rubric Breakdown */}
        <div className="p-4 bg-white rounded-lg border border-blue-100">
          <div className="text-sm font-medium text-gray-900 mb-3">LLM Rubric Dimensions:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Demo Clarity:</span>
              <span className="font-medium">15 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Functionality:</span>
              <span className="font-medium">20 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reproducibility:</span>
              <span className="font-medium">15 pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Impact:</span>
              <span className="font-medium">10 pts</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
