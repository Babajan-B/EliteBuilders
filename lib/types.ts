/**
 * Shared TypeScript types for the application
 */

export type Role = 'builder' | 'judge' | 'sponsor' | 'admin';

export type SubmissionStatus = 'DRAFT' | 'PROVISIONAL' | 'FINAL';

export interface Challenge {
  id: string;
  title: string;
  brief_md: string;
  repo_template_url?: string;
  tags?: string[];
  start_date: string;
  end_date: string;
  status: 'active' | 'past';
  created_at: string;
}

export interface Submission {
  id: string;
  challenge_id: string;
  user_id: string;
  repo_url: string;
  deck_url?: string;
  demo_url?: string;
  writeup_md: string;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  submission_id: string;
  user_id: string;
  display_name: string;
  score_auto: number;
  score_llm: number;
  score_display: number;
  status: string;
  created_at: string;
}

export interface SponsorOrg {
  id: string;
  org_name: string;
  website?: string;
  logo_url?: string;
  verified: boolean;
  owner_profile_id: string;
  members?: SponsorMember[];
}

export interface SponsorMember {
  profile_id: string;
  role: 'owner' | 'manager' | 'member';
  display_name: string;
  avatar_url?: string;
}

export interface Profile {
  id: string;
  display_name: string;
  role: Role;
  avatar_url?: string;
  bio_md?: string;
  github_url?: string;
  created_at: string;
}

export interface JudgeReview {
  submission_id: string;
  judge_id: string;
  delta_pct: number;
  notes_md?: string;
  locked_bool: boolean;
  final_score?: number;
  locked_at?: string;
}
