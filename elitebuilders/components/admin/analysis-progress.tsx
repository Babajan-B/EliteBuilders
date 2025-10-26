"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, Github, FileText, Sparkles, Brain } from "lucide-react"

interface AnalysisProgressProps {
  submissionId: string
  onComplete?: (result: any) => void
}

type AnalysisStep = {
  id: string
  label: string
  icon: any
  status: 'pending' | 'running' | 'complete' | 'error'
  progress: number
  message?: string
}

export function AnalysisProgress({ submissionId, onComplete }: AnalysisProgressProps) {
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: 'github', label: 'Analyzing GitHub Repository', icon: Github, status: 'pending', progress: 0 },
    { id: 'deck', label: 'Extracting Pitch Deck', icon: FileText, status: 'pending', progress: 0 },
    { id: 'llm', label: 'AI Analysis with Gemini', icon: Brain, status: 'pending', progress: 0 },
    { id: 'complete', label: 'Finalizing Results', icon: Sparkles, status: 'pending', progress: 0 },
  ])
  
  const [currentStep, setCurrentStep] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    // Simulate analysis progress
    const simulateProgress = async () => {
      // Step 1: GitHub Analysis (0-25%)
      setSteps(prev => prev.map((step, idx) => 
        idx === 0 ? { ...step, status: 'running', message: 'Fetching README, package.json, source files...' } : step
      ))
      setCurrentStep(0)
      
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setSteps(prev => prev.map((step, idx) => 
          idx === 0 ? { ...step, progress: i } : step
        ))
        setOverallProgress(Math.floor(i / 4))
      }
      
      setSteps(prev => prev.map((step, idx) => 
        idx === 0 ? { ...step, status: 'complete', progress: 100, message: '✓ Code analysis complete' } : step
      ))
      
      // Step 2: Pitch Deck (25-50%)
      await new Promise(resolve => setTimeout(resolve, 500))
      setSteps(prev => prev.map((step, idx) => 
        idx === 1 ? { ...step, status: 'running', message: 'Extracting text from pitch deck...' } : step
      ))
      setCurrentStep(1)
      
      for (let i = 0; i <= 100; i += 15) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setSteps(prev => prev.map((step, idx) => 
          idx === 1 ? { ...step, progress: i } : step
        ))
        setOverallProgress(25 + Math.floor(i / 4))
      }
      
      setSteps(prev => prev.map((step, idx) => 
        idx === 1 ? { ...step, status: 'complete', progress: 100, message: '✓ Deck extracted successfully' } : step
      ))
      
      // Step 3: LLM Analysis (50-90%)
      await new Promise(resolve => setTimeout(resolve, 500))
      setSteps(prev => prev.map((step, idx) => 
        idx === 2 ? { ...step, status: 'running', message: 'Cross-verifying claims with code...' } : step
      ))
      setCurrentStep(2)
      
      for (let i = 0; i <= 100; i += 8) {
        await new Promise(resolve => setTimeout(resolve, 400))
        setSteps(prev => prev.map((step, idx) => 
          idx === 2 ? { ...step, progress: i } : step
        ))
        setOverallProgress(50 + Math.floor(i * 0.4))
        
        // Update message mid-way
        if (i === 50) {
          setSteps(prev => prev.map((step, idx) => 
            idx === 2 ? { ...step, message: 'Generating scores and rationale...' } : step
          ))
        }
      }
      
      setSteps(prev => prev.map((step, idx) => 
        idx === 2 ? { ...step, status: 'complete', progress: 100, message: '✓ AI analysis complete' } : step
      ))
      
      // Step 4: Finalize (90-100%)
      await new Promise(resolve => setTimeout(resolve, 500))
      setSteps(prev => prev.map((step, idx) => 
        idx === 3 ? { ...step, status: 'running', message: 'Saving results to database...' } : step
      ))
      setCurrentStep(3)
      
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 150))
        setSteps(prev => prev.map((step, idx) => 
          idx === 3 ? { ...step, progress: i } : step
        ))
        setOverallProgress(90 + Math.floor(i / 10))
      }
      
      setSteps(prev => prev.map((step, idx) => 
        idx === 3 ? { ...step, status: 'complete', progress: 100, message: '✓ All done!' } : step
      ))
      setOverallProgress(100)
      
      // Notify completion
      if (onComplete) {
        onComplete({ success: true })
      }
    }

    simulateProgress()
  }, [submissionId, onComplete])

  const getStatusIcon = (status: AnalysisStep['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              AI Analysis in Progress
            </CardTitle>
            <CardDescription>
              Analyzing submission with multi-source verification
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg">
            {overallProgress}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{overallProgress}/100</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Individual Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(step.status)}
                  <Icon className={`h-5 w-5 ${step.status === 'running' ? 'text-primary' : step.status === 'complete' ? 'text-green-500' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${step.status === 'running' ? 'text-primary' : ''}`}>
                        {step.label}
                      </span>
                      {step.status !== 'pending' && (
                        <span className="text-sm text-muted-foreground">{step.progress}%</span>
                      )}
                    </div>
                    {step.message && (
                      <p className="text-sm text-muted-foreground">{step.message}</p>
                    )}
                  </div>
                </div>
                
                {step.status !== 'pending' && (
                  <Progress 
                    value={step.progress} 
                    className={`h-1 ml-12 ${step.status === 'running' ? 'bg-primary/20' : ''}`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Completion Message */}
        {overallProgress === 100 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Analysis Complete!
            </div>
            <p className="text-sm text-green-600 mt-1">
              The submission has been analyzed and is ready to send to judges.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
