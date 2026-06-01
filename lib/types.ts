// Shared domain types mirroring the Supabase schema (supabase/schema.sql).

export type DailyLog = {
  id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  lifted: boolean;
  nutrition_on_track: boolean;
  schoolwork_done: boolean;
  mood: number | null; // 1-5
  energy: number | null; // 1-5
  earnings: number;
  created_at: string;
};

export type Workout = {
  id: string;
  user_id: string;
  workout_date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string | null;
  created_at: string;
};

export type AssignmentStatus = "not_started" | "in_progress" | "done";
export type AssignmentPriority = "low" | "medium" | "high";

export type Assignment = {
  id: string;
  user_id: string;
  course: string;
  title: string;
  due_date: string;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  created_at: string;
};

export type WorkLog = {
  id: string;
  user_id: string;
  work_date: string;
  hours: number;
  pay_rate: number;
  earnings: number; // generated: hours * pay_rate
  note: string | null;
  created_at: string;
};

export type GoalCategory = "Athletic" | "Academic" | "Financial" | "Personal";
export type GoalStatus = "active" | "completed";

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  category: GoalCategory;
  deadline: string | null;
  progress: number; // 0-100
  status: GoalStatus;
  created_at: string;
};

export type Trip = {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string | null;
  purpose: string | null;
  notes: string | null;
  created_at: string;
};
