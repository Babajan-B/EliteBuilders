-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.autoscores (
  submission_id uuid NOT NULL,
  checks_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  score_auto numeric NOT NULL CHECK (score_auto >= 0::numeric),
  CONSTRAINT autoscores_pkey PRIMARY KEY (submission_id),
  CONSTRAINT autoscores_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id)
);
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  rule jsonb,
  icon text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT badges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.candidate_packets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  challenge_id uuid NOT NULL,
  created_by uuid,
  title text NOT NULL,
  export_url text,
  filters_json jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT candidate_packets_pkey PRIMARY KEY (id),
  CONSTRAINT candidate_packets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.sponsor_orgs(id),
  CONSTRAINT candidate_packets_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id),
  CONSTRAINT candidate_packets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.career_scores (
  user_id uuid NOT NULL,
  season text NOT NULL,
  score_accum numeric NOT NULL DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT career_scores_pkey PRIMARY KEY (user_id, season),
  CONSTRAINT career_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.challenge_judges (
  challenge_id uuid NOT NULL,
  judge_id uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenge_judges_pkey PRIMARY KEY (challenge_id, judge_id),
  CONSTRAINT challenge_judges_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id),
  CONSTRAINT challenge_judges_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sponsor_org_id uuid NOT NULL,
  title text NOT NULL,
  brief_md text NOT NULL,
  rubric_json jsonb NOT NULL,
  tags ARRAY DEFAULT '{}'::text[],
  deadline_utc timestamp with time zone NOT NULL,
  prize_md text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenges_pkey PRIMARY KEY (id),
  CONSTRAINT challenges_sponsor_org_id_fkey FOREIGN KEY (sponsor_org_id) REFERENCES public.sponsor_orgs(id)
);
CREATE TABLE public.events (
  id bigint NOT NULL DEFAULT nextval('events_id_seq'::regclass),
  event_type text NOT NULL,
  actor_id uuid,
  submission_id uuid,
  challenge_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id),
  CONSTRAINT events_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT events_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['judge'::text, 'sponsor'::text])),
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text])),
  invited_by uuid,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  name text,
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.judge_reviews (
  submission_id uuid NOT NULL,
  judge_id uuid NOT NULL,
  notes_md text,
  delta_pct numeric NOT NULL DEFAULT 0 CHECK (delta_pct >= '-20'::integer::numeric AND delta_pct <= 20::numeric),
  locked_bool boolean NOT NULL DEFAULT false,
  final_score numeric,
  locked_at timestamp with time zone,
  CONSTRAINT judge_reviews_pkey PRIMARY KEY (submission_id),
  CONSTRAINT judge_reviews_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT judge_reviews_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.llmscores (
  submission_id uuid NOT NULL,
  rubric_scores_json jsonb NOT NULL,
  rationale_md text,
  score_llm numeric NOT NULL CHECK (score_llm >= 0::numeric),
  model_id text NOT NULL,
  model_version text,
  prompt_hash text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT llmscores_pkey PRIMARY KEY (submission_id),
  CONSTRAINT llmscores_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  submission_id uuid,
  challenge_id uuid,
  type text NOT NULL CHECK (type = ANY (ARRAY['SUBMITTED'::text, 'PROVISIONAL'::text, 'FINAL'::text, 'BADGE'::text, 'INFO'::text])),
  payload jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT notifications_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'builder'::text CHECK (role = ANY (ARRAY['builder'::text, 'judge'::text, 'sponsor'::text, 'admin'::text])),
  bio text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  github_url text,
  linkedin_url text,
  profile_picture_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.sponsor_favorites (
  org_id uuid NOT NULL,
  submission_id uuid NOT NULL,
  noted_by uuid,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sponsor_favorites_pkey PRIMARY KEY (org_id, submission_id),
  CONSTRAINT sponsor_favorites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.sponsor_orgs(id),
  CONSTRAINT sponsor_favorites_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT sponsor_favorites_noted_by_fkey FOREIGN KEY (noted_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.sponsor_members (
  org_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer'::text CHECK (role = ANY (ARRAY['owner'::text, 'manager'::text, 'viewer'::text])),
  invited_by uuid,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sponsor_members_pkey PRIMARY KEY (org_id, profile_id),
  CONSTRAINT sponsor_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.sponsor_orgs(id),
  CONSTRAINT sponsor_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT sponsor_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.sponsor_orgs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_name text NOT NULL,
  website text,
  logo_url text,
  verified boolean DEFAULT false,
  owner_profile_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sponsor_orgs_pkey PRIMARY KEY (id),
  CONSTRAINT sponsor_orgs_owner_profile_id_fkey FOREIGN KEY (owner_profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL,
  repo_url text NOT NULL,
  deck_url text NOT NULL,
  demo_url text NOT NULL,
  writeup_md text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED'::text CHECK (status = ANY (ARRAY['QUEUED'::text, 'SCORING'::text, 'PROVISIONAL'::text, 'FINAL'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT submissions_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);
CREATE TABLE public.user_badges (
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  awarded_at timestamp with time zone DEFAULT now(),
  reason text,
  CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id)
);