import data from "./program-data.json";

export type ProgramSection = "LIFT" | "FIELD" | "MOBILITY" | "RUNNING";

export type ProgramDay = {
  label: string;
  date: string | null;
  sections: Partial<Record<ProgramSection, string>>;
};

export type ProgramWeek = { days: ProgramDay[] };

export type ProgramData = {
  weeks: ProgramWeek[];
  wallBall: { n: number; exercise: string; reps: string }[];
  mobility: {
    group: string;
    source?: string;
    items: { name: string; detail: string }[];
  }[];
  track: { a: string; b: string }[];
};

export const program = data as ProgramData;

export const SECTION_ORDER: ProgramSection[] = [
  "LIFT",
  "FIELD",
  "MOBILITY",
  "RUNNING",
];

/** Stable key for a single check-off: "2026-05-25::LIFT". */
export function checkKey(date: string, section: ProgramSection) {
  return `${date}::${section}`;
}
