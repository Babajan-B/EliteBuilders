// Mock data for frontend development
export const mockCompetitions = [
  {
    id: "1",
    title: "AI Chatbot Challenge",
    description:
      "Build an intelligent chatbot using modern AI frameworks. Create a conversational interface that can handle complex queries and provide helpful responses.",
    status: "active",
    start_date: "2025-01-15",
    end_date: "2025-02-15",
    prize_pool: 5000,
    participant_count: 42,
    sponsor_name: "TechCorp Inc",
    sponsor_id: "org-1",
    challenges: [
      {
        id: "ch-1",
        title: "Natural Language Processing",
        description: "Implement NLP capabilities for understanding user intent",
        points: 100,
      },
      {
        id: "ch-2",
        title: "Context Management",
        description: "Maintain conversation context across multiple messages",
        points: 150,
      },
    ],
  },
  {
    id: "2",
    title: "E-Commerce Platform Sprint",
    description:
      "Design and develop a modern e-commerce platform with shopping cart, payment integration, and product management.",
    status: "active",
    start_date: "2025-01-20",
    end_date: "2025-02-28",
    prize_pool: 10000,
    participant_count: 67,
    sponsor_name: "ShopFlow",
    sponsor_id: "org-2",
    challenges: [
      {
        id: "ch-3",
        title: "Product Catalog",
        description: "Build a scalable product catalog with search and filters",
        points: 120,
      },
      {
        id: "ch-4",
        title: "Checkout Flow",
        description: "Create a seamless checkout experience",
        points: 180,
      },
    ],
  },
  {
    id: "3",
    title: "Mobile App Design Contest",
    description:
      "Create a stunning mobile app design for a fitness tracking application. Focus on user experience and modern design principles.",
    status: "upcoming",
    start_date: "2025-03-01",
    end_date: "2025-03-31",
    prize_pool: 3000,
    participant_count: 0,
    sponsor_name: "FitTech Solutions",
    sponsor_id: "org-3",
    challenges: [],
  },
  {
    id: "4",
    title: "Blockchain DApp Challenge",
    description:
      "Build a decentralized application on Ethereum. Demonstrate smart contract development and Web3 integration skills.",
    status: "completed",
    start_date: "2024-11-01",
    end_date: "2024-12-15",
    prize_pool: 15000,
    participant_count: 89,
    sponsor_name: "CryptoVentures",
    sponsor_id: "org-4",
    challenges: [],
  },
]

export const mockLeaderboard = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah@example.com",
    total_points: 2450,
    submissions_count: 12,
    rank: 1,
  },
  {
    id: "2",
    name: "Alex Rodriguez",
    email: "alex@example.com",
    total_points: 2180,
    submissions_count: 10,
    rank: 2,
  },
  {
    id: "3",
    name: "Jordan Kim",
    email: "jordan@example.com",
    total_points: 1950,
    submissions_count: 9,
    rank: 3,
  },
  {
    id: "4",
    name: "Taylor Swift",
    email: "taylor@example.com",
    total_points: 1820,
    submissions_count: 11,
    rank: 4,
  },
  {
    id: "5",
    name: "Morgan Lee",
    email: "morgan@example.com",
    total_points: 1650,
    submissions_count: 8,
    rank: 5,
  },
]

export const mockSubmissions = [
  {
    id: "sub-1",
    competition_id: "1",
    competition_title: "AI Chatbot Challenge",
    challenge_id: "ch-1",
    challenge_title: "Natural Language Processing",
    status: "FINAL",
    score: 95,
    feedback:
      "Excellent implementation with great attention to detail. The NLP model shows strong understanding of context.",
    submitted_at: "2025-01-20T10:30:00Z",
    reviewed_at: "2025-01-22T14:20:00Z",
    github_url: "https://github.com/user/chatbot-nlp",
    demo_url: "https://demo.example.com/chatbot",
    // Enhanced structure matching 1.json
    meta: {
      version: "1.0",
      generated_at: "2025-01-22T14:20:00Z"
    },
    submission: {
      id: "sub-1",
      title: "AI Resume Analyzer",
      challenge_id: "ch-1",
      status: "FINAL",
      created_at: "2025-01-20T10:30:00Z"
    },
    submitter: {
      id: "user-john-doe",
      display_name: "John Doe",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
    },
    artifacts: {
      repo_url: "https://github.com/user/chatbot-nlp",
      deck_url: "https://docs.google.com/presentation/d/example1",
      demo_url: "https://demo.example.com/chatbot",
      writeup_excerpt: "This AI-powered resume analyzer uses advanced NLP techniques to extract key information from resumes and match candidates with job requirements..."
    },
    scores: {
      provisional_score: 89,
      auto: {
        score_auto: 20,
        checks: [
          { id: "repo_present", label: "Repository Provided", ok: true, weight: 5 },
          { id: "deck_present", label: "Pitch Deck Provided", ok: true, weight: 5 },
          { id: "demo_present", label: "Demo Video Provided", ok: true, weight: 5 },
          { id: "writeup_minlen", label: "Writeup ≥ 400 chars", ok: true, weight: 5 }
        ]
      },
      llm: {
        score_llm: 55,
        model: "Gemini 1.5 Flash",
        rubric: [
          { id: "problem_fit", label: "Problem Fit", score: 14, max: 15 },
          { id: "tech_depth", label: "Technical Depth", score: 18, max: 20 },
          { id: "ux_flow", label: "UX & Demo Quality", score: 13, max: 15 },
          { id: "impact", label: "Impact & Clarity", score: 10, max: 10 }
        ],
        rationale_md: "Strong implementation with clear code structure. The NLP model demonstrates good understanding of context and provides relevant responses. Demo is functional and well-presented. Minor improvement needed in error handling."
      }
    },
    judge: {
      id: "judge-1",
      display_name: "Dr. Sarah Chen",
      avatar_url: null
    },
    ui: {
      delta_range: { min: -20, max: 20 },
      initial_delta_pct: 0,
      notes_min_chars: 10,
      allow_lock: true,
      read_only_reason: null
    },
    history: {
      events: [
        { ts: "2025-01-20T10:30:00Z", type: "SUBMITTED", by: "John Doe", note: "Initial submission uploaded" },
        { ts: "2025-01-20T11:15:00Z", type: "PROVISIONAL", by: "system", note: "Auto + LLM scoring complete" },
        { ts: "2025-01-22T14:20:00Z", type: "FINAL", by: "Dr. Sarah Chen", note: "Judge review completed" }
      ],
      previous_reviews: [
        {
          judge_display_name: "Dr. Sarah Chen",
          delta_pct: 6,
          final_score: 95,
          locked_bool: true,
          locked_at: "2025-01-22T14:20:00Z",
          notes_md: "Excellent implementation with great attention to detail. The NLP model shows strong understanding of context."
        }
      ]
    },
    // Legacy fields for backward compatibility
    auto_score: 20,
    llm_score: 55,
    llm_rationale: "Strong implementation with clear code structure. The NLP model demonstrates good understanding of context and provides relevant responses. Demo is functional and well-presented. Minor improvement needed in error handling.",
    rubric_scores_json: {
      demo_clarity: 14,
      functionality: 18,
      reproducibility: 13,
      impact: 10
    },
    submitterName: "John Doe",
    submissionTitle: "AI Resume Analyzer"
  },
  {
    id: "sub-2",
    competition_id: "2",
    competition_title: "E-Commerce Platform Sprint",
    challenge_id: "ch-3",
    challenge_title: "Product Catalog",
    status: "PROVISIONAL",
    score: null,
    feedback: null,
    submitted_at: "2025-01-25T16:45:00Z",
    reviewed_at: null,
    github_url: "https://github.com/user/ecommerce-catalog",
    demo_url: "https://demo.example.com/shop",
    // Enhanced structure matching 1.json
    meta: {
      version: "1.0",
      generated_at: "2025-01-25T17:30:00Z"
    },
    submission: {
      id: "sub-2",
      title: "Smart Shopping Cart",
      challenge_id: "ch-3",
      status: "PROVISIONAL",
      created_at: "2025-01-25T16:45:00Z"
    },
    submitter: {
      id: "user-alice-johnson",
      display_name: "Alice Johnson",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face"
    },
    artifacts: {
      repo_url: "https://github.com/user/ecommerce-catalog",
      deck_url: "https://docs.google.com/presentation/d/example2",
      demo_url: "https://demo.example.com/shop",
      writeup_excerpt: "A modern e-commerce platform with intelligent shopping cart features, real-time inventory management, and personalized recommendations..."
    },
    scores: {
      provisional_score: 32,
      auto: {
        score_auto: 18,
        checks: [
          { id: "repo_present", label: "Repository Provided", ok: true, weight: 5 },
          { id: "deck_present", label: "Pitch Deck Provided", ok: true, weight: 5 },
          { id: "demo_present", label: "Demo Video Provided", ok: true, weight: 5 },
          { id: "writeup_minlen", label: "Writeup ≥ 400 chars", ok: true, weight: 3 }
        ]
      },
      llm: {
        score_llm: 48,
        model: "Gemini 1.5 Flash",
        rubric: [
          { id: "problem_fit", label: "Problem Fit", score: 12, max: 15 },
          { id: "tech_depth", label: "Technical Depth", score: 16, max: 20 },
          { id: "ux_flow", label: "UX & Demo Quality", score: 12, max: 15 },
          { id: "impact", label: "Impact & Clarity", score: 8, max: 10 }
        ],
        rationale_md: "Good foundation with proper database schema. Product catalog is well-structured but lacks advanced filtering. Demo shows basic functionality. Code quality is solid but could benefit from better error handling and validation."
      }
    },
    judge: {
      id: "judge-2",
      display_name: "Dr. Babajan",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
    },
    ui: {
      delta_range: { min: -20, max: 20 },
      initial_delta_pct: 0,
      notes_min_chars: 10,
      allow_lock: true,
      read_only_reason: null
    },
    history: {
      events: [
        { ts: "2025-01-25T16:45:00Z", type: "SUBMITTED", by: "Alice Johnson", note: "E-commerce platform submission" },
        { ts: "2025-01-25T17:30:00Z", type: "PROVISIONAL", by: "system", note: "Auto + LLM scoring complete" }
      ],
      previous_reviews: []
    },
    // Legacy fields for backward compatibility
    auto_score: 18,
    llm_score: 48,
    llm_rationale: "Good foundation with proper database schema. Product catalog is well-structured but lacks advanced filtering. Demo shows basic functionality. Code quality is solid but could benefit from better error handling and validation.",
    rubric_scores_json: {
      demo_clarity: 12,
      functionality: 16,
      reproducibility: 12,
      impact: 8
    },
    submitterName: "Alice Johnson",
    submissionTitle: "Smart Shopping Cart"
  },
  {
    id: "sub-3",
    competition_id: "1",
    competition_title: "AI Chatbot Challenge",
    challenge_id: "ch-2",
    challenge_title: "Context Management",
    status: "FINAL",
    score: 45,
    feedback:
      "The context management needs improvement. Consider implementing a more robust state management solution.",
    submitted_at: "2025-01-18T09:15:00Z",
    reviewed_at: "2025-01-19T11:30:00Z",
    github_url: "https://github.com/user/chatbot-context",
    demo_url: null,
    // Enhanced structure matching 1.json
    meta: {
      version: "1.0",
      generated_at: "2025-01-19T11:30:00Z"
    },
    submission: {
      id: "sub-3",
      title: "Context-Aware Chatbot",
      challenge_id: "ch-2",
      status: "FINAL",
      created_at: "2025-01-18T09:15:00Z"
    },
    submitter: {
      id: "user-mike-wilson",
      display_name: "Mike Wilson",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
    },
    artifacts: {
      repo_url: "https://github.com/user/chatbot-context",
      deck_url: null,
      demo_url: null,
      writeup_excerpt: "A chatbot implementation focusing on context management and conversation flow. The system attempts to maintain conversation state across multiple interactions..."
    },
    scores: {
      provisional_score: 30,
      auto: {
        score_auto: 15,
        checks: [
          { id: "repo_present", label: "Repository Provided", ok: true, weight: 5 },
          { id: "deck_present", label: "Pitch Deck Provided", ok: false, weight: 5 },
          { id: "demo_present", label: "Demo Video Provided", ok: false, weight: 5 },
          { id: "writeup_minlen", label: "Writeup ≥ 400 chars", ok: true, weight: 5 }
        ]
      },
      llm: {
        score_llm: 35,
        model: "Gemini 1.5 Flash",
        rubric: [
          { id: "problem_fit", label: "Problem Fit", score: 6, max: 15 },
          { id: "tech_depth", label: "Technical Depth", score: 10, max: 20 },
          { id: "ux_flow", label: "UX & Demo Quality", score: 9, max: 15 },
          { id: "impact", label: "Impact & Clarity", score: 10, max: 10 }
        ],
        rationale_md: "Basic implementation with several issues. Context management is inconsistent and loses conversation state. Code lacks proper error handling. Missing demo makes evaluation difficult. Significant improvements needed in state management and user experience."
      }
    },
    judge: {
      id: "judge-3",
      display_name: "Prof. Emily Davis",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face"
    },
    ui: {
      delta_range: { min: -20, max: 20 },
      initial_delta_pct: 0,
      notes_min_chars: 10,
      allow_lock: true,
      read_only_reason: null
    },
    history: {
      events: [
        { ts: "2025-01-18T09:15:00Z", type: "SUBMITTED", by: "Mike Wilson", note: "Context management chatbot submission" },
        { ts: "2025-01-18T10:00:00Z", type: "PROVISIONAL", by: "system", note: "Auto + LLM scoring complete" },
        { ts: "2025-01-19T11:30:00Z", type: "FINAL", by: "Prof. Emily Davis", note: "Judge review completed with feedback" }
      ],
      previous_reviews: [
        {
          judge_display_name: "Prof. Emily Davis",
          delta_pct: 15,
          final_score: 45,
          locked_bool: true,
          locked_at: "2025-01-19T11:30:00Z",
          notes_md: "The context management needs improvement. Consider implementing a more robust state management solution."
        }
      ]
    },
    // Legacy fields for backward compatibility
    auto_score: 15,
    llm_score: 35,
    llm_rationale: "Basic implementation with several issues. Context management is inconsistent and loses conversation state. Code lacks proper error handling. Missing demo makes evaluation difficult. Significant improvements needed in state management and user experience.",
    rubric_scores_json: {
      demo_clarity: 6,
      functionality: 10,
      reproducibility: 9,
      impact: 10
    },
    submitterName: "Mike Wilson",
    submissionTitle: "Context-Aware Chatbot"
  },
]

export const mockUser = {
  id: "user-1",
  email: "demo@elitebuilders.com",
  name: "Demo User",
  role: "builder" as const,
  total_points: 450,
  organization_id: null,
}

export const mockJudgeUser = {
  id: "judge-1",
  email: "judge@elitebuilders.com",
  name: "Judge Smith",
  role: "judge" as const,
  total_points: 0,
  organization_id: null,
}

export const mockSponsorUser = {
  id: "sponsor-1",
  email: "sponsor@techcorp.com",
  name: "Tech Corp Admin",
  role: "sponsor" as const,
  total_points: 0,
  organization_id: "org-1",
}
