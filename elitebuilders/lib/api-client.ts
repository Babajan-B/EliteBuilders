/**
 * API Client for EliteBuilders Frontend
 * Connects to the backend API at /Hackathon/app/api/*
 * Handles response envelope format: {ok: true, data} or {ok: false, error}
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Backend Challenge Schema (from DB-API.md)
 */
export interface BackendChallenge {
  id: string | number;
  title: string;
  brief_md: string;
  start_date?: string;
  end_date?: string;
  deadline_utc?: string;
  prize_pool?: number;
  prize_md?: string;
  tags: string[];
  status?: string;
  is_active: boolean;
  sponsor_org_id?: string;
  rubric_json?: Record<string, unknown>;
  created_at: string;
}

/**
 * Frontend Competition Format (from mock-data.ts)
 */
export interface FrontendCompetition {
  id: string;
  title: string;
  description: string;
  status: "active" | "upcoming" | "completed";
  start_date: string;
  end_date: string;
  prize_pool: number;
  participant_count?: number;
  sponsor_name?: string;
  sponsor_id?: string;
  challenges?: Array<{
    id: string;
    title: string;
    description: string;
    points: number;
  }>;
}

/**
 * Backend Submission Schema
 */
export interface BackendSubmission {
  id: string;
  challenge_id: string | number;
  user_id?: string;
  profile_id?: string;
  repo_url: string;
  deck_url?: string | null;
  demo_url?: string | null;
  writeup_md: string;
  status: "QUEUED" | "SCORING" | "PROVISIONAL" | "FINAL";
  created_at: string;
  autoscores?: {
    score_auto: number;
    checks_json?: Record<string, unknown>;
  };
  llmscores?: {
    score_llm: number;
    rubric_scores_json?: Record<string, number>;
    rationale_md?: string;
  };
  judge_reviews?: {
    delta_pct: number;
    notes_md: string;
    final_score: number | null;
    locked_bool: boolean;
    locked_at: string | null;
    judge_id: string;
  };
}

/**
 * Transform backend challenge to frontend competition format
 */
export function transformChallenge(challenge: BackendChallenge): FrontendCompetition {
  const now = new Date();
  const startDate = challenge.start_date ? new Date(challenge.start_date) : new Date(challenge.created_at);
  const endDate = challenge.end_date || challenge.deadline_utc;

  let status: "active" | "upcoming" | "completed" = "active";
  if (endDate && new Date(endDate) < now) {
    status = "completed";
  } else if (!challenge.is_active) {
    status = "completed";
  } else if (startDate > now) {
    status = "upcoming";
  }

  return {
    id: String(challenge.id),
    title: challenge.title,
    description: challenge.brief_md || "",
    status,
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate ? new Date(endDate).toISOString().split("T")[0] : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    prize_pool: challenge.prize_pool || 0,
    participant_count: 0, // TODO: Add submission count from backend
    sponsor_name: "Sponsor", // TODO: Fetch from sponsor_orgs
    sponsor_id: challenge.sponsor_org_id,
    challenges: [], // TODO: Map from rubric_json if needed
  };
}

/**
 * Transform backend submission to frontend format
 */
export function transformSubmission(submission: BackendSubmission): any {
  const autoScore = submission.autoscores?.score_auto || 0;
  const llmScore = submission.llmscores?.score_llm || 0;
  const provisionalScore = autoScore * 0.2 + llmScore * 0.6;
  const finalScore = submission.judge_reviews?.final_score || null;

  return {
    id: submission.id,
    challenge_id: submission.challenge_id,
    status: submission.status,
    repo_url: submission.repo_url,
    deck_url: submission.deck_url,
    demo_url: submission.demo_url,
    writeup_md: submission.writeup_md,
    score_auto: autoScore,
    score_llm: llmScore,
    score_display: finalScore !== null ? finalScore : provisionalScore,
    created_at: submission.created_at,
    // Enhanced structure
    artifacts: {
      repo_url: submission.repo_url,
      deck_url: submission.deck_url,
      demo_url: submission.demo_url,
      writeup_excerpt: submission.writeup_md?.substring(0, 200) + "..." || "",
    },
    scores: {
      provisional_score: provisionalScore,
      auto: {
        score_auto: autoScore,
        checks: submission.autoscores?.checks_json || {},
      },
      llm: {
        score_llm: llmScore,
        model: "Gemini 1.5 Flash",
        rubric: submission.llmscores?.rubric_scores_json || {},
        rationale_md: submission.llmscores?.rationale_md || "",
      },
    },
    judge: submission.judge_reviews,
  };
}

/**
 * Fetch challenges (competitions) from backend
 */
export async function fetchChallenges(params?: {
  status?: string;
  tag?: string;
  q?: string;
}): Promise<FrontendCompetition[]> {
  try {
    const queryParams = new URLSearchParams();

    // Map frontend status to backend is_active
    if (params?.status === "active") {
      queryParams.append("active", "true");
    } else if (params?.status === "completed") {
      queryParams.append("active", "false");
    }

    if (params?.tag) {
      queryParams.append("tag", params.tag);
    }

    if (params?.q) {
      queryParams.append("q", params.q);
    }

    const url = `${API_BASE_URL}/challenges${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await fetch(url, {
      cache: "no-store",
    });

    const result: ApiResponse<BackendChallenge[]> = await response.json();

    if (!result.ok || !result.data) {
      console.error("Failed to fetch challenges:", result.error);
      return [];
    }

    return result.data.map(transformChallenge);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return [];
  }
}

/**
 * Fetch single challenge by ID
 */
export async function fetchChallenge(id: string): Promise<FrontendCompetition | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/challenges/${id}`, {
      cache: "no-store",
    });

    const result: ApiResponse<BackendChallenge> = await response.json();

    if (!result.ok || !result.data) {
      console.error("Failed to fetch challenge:", result.error);
      return null;
    }

    return transformChallenge(result.data);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return null;
  }
}

/**
 * Create a new submission
 */
export async function createSubmission(data: {
  challenge_id: string | number;
  repo_url: string;
  deck_url?: string;
  demo_url?: string;
  writeup_md: string;
}): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<BackendSubmission> = await response.json();

    if (!result.ok) {
      return {
        ok: false,
        error: result.error?.message || "Failed to create submission",
      };
    }

    return {
      ok: true,
      data: transformSubmission(result.data!),
    };
  } catch (error) {
    console.error("Error creating submission:", error);
    return {
      ok: false,
      error: "Network error",
    };
  }
}

/**
 * Fetch leaderboard for a challenge
 */
export async function fetchLeaderboard(challengeId: string, limit = 100): Promise<any[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/leaderboard?challenge_id=${challengeId}&limit=${limit}`,
      {
        cache: "no-store",
      }
    );

    const result: ApiResponse<any[]> = await response.json();

    if (!result.ok || !result.data) {
      console.error("Failed to fetch leaderboard:", result.error);
      return [];
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

/**
 * Fetch submissions
 */
export async function fetchSubmissions(params?: {
  challenge_id?: string;
  user_id?: string;
}): Promise<any[]> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.challenge_id) {
      queryParams.append("challenge_id", params.challenge_id);
    }

    const url = `${API_BASE_URL}/submissions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await fetch(url, {
      cache: "no-store",
    });

    const result: ApiResponse<BackendSubmission[]> = await response.json();

    if (!result.ok || !result.data) {
      console.error("Failed to fetch submissions:", result.error);
      return [];
    }

    return result.data.map(transformSubmission);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
}

/**
 * Fetch single submission by ID
 */
export async function fetchSubmission(id: string): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}`, {
      cache: "no-store",
    });

    const result: ApiResponse<BackendSubmission> = await response.json();

    if (!result.ok || !result.data) {
      console.error("Failed to fetch submission:", result.error);
      return null;
    }

    return transformSubmission(result.data);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return null;
  }
}

/**
 * Judge: Lock submission with final score
 */
export async function lockSubmission(data: {
  submissionId: string;
  delta_pct: number;
  notes_md: string;
}): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/judge/lock`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<any> = await response.json();

    if (!result.ok) {
      return {
        ok: false,
        error: result.error?.message || "Failed to lock submission",
      };
    }

    return {
      ok: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Error locking submission:", error);
    return {
      ok: false,
      error: "Network error",
    };
  }
}
