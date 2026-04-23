export type EstimateStatus =
  | 'pending'
  | 'viewed'
  | 'approved'
  | 'deposit_paid'
  | 'scheduled'
  | 'completed'

export type JobStatus = 'scheduled' | 'in_progress' | 'complete'

export type JobType =
  | 'removal'
  | 'trimming'
  | 'stump_grinding'
  | 'storm_damage'
  | 'consultation'

export interface Estimate {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  job_type: JobType
  address: string
  video_url: string | null
  status: EstimateStatus
  price_estimate: number
  deposit_amount: number
  stripe_payment_intent_id: string | null
  stripe_session_id: string | null
  scheduled_date: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  estimate_id: string
  crew_assigned: string | null
  scheduled_date: string | null
  notes: string | null
  status: JobStatus
  review_requested: boolean
  review_sent_at: string | null
}
