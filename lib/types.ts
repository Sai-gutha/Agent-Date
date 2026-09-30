import { z } from "zod";

export const SourceSchema = z.enum(["LinkedIn", "Instagram", "Both"]);
export type Source = z.infer<typeof SourceSchema>;

/** An inferred statement with provenance and a confidence between 0 and 1. */
export const InferredSchema = z.object({
  text: z.string(),
  source: SourceSchema,
  confidence: z.number().min(0).max(1),
});
export type Inferred = z.infer<typeof InferredSchema>;

export const ProfileSchema = z.object({
  summary: z.string(),
  summarySource: SourceSchema,
  summaryConfidence: z.number().min(0).max(1),
  interests: z.array(InferredSchema),
  hobbies: z.array(InferredSchema),
  values: z.array(InferredSchema),
  conversationTopics: z.array(InferredSchema),
  lifestyleSignals: z.array(InferredSchema),
  energizers: z.array(InferredSchema),
  compatibilitySignals: z.array(InferredSchema),
});
export type Profile = z.infer<typeof ProfileSchema>;

export type ExtractionStatus = "ok" | "limited" | "failed" | "demo";

export interface Person {
  id: string;
  name: string;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  avatar: string | null;
  sourceText: string;
  profile: Profile;
  /** Synthetic seeded persona (not a real person). */
  demo?: boolean;
  extraction?: { status: ExtractionStatus; notes: string[] };
}

export interface Turn {
  speaker: "A" | "B";
  text: string;
}

export interface AgentDate {
  personA: string;
  personB: string;
  conversation: Turn[];
  compatibilityScore: number;
  sharedInterests: string[];
  strengths: string[];
  friction: string[];
  naturalTopics: string[];
  meetAgain: boolean;
  verdict: string;
  mode: "llm" | "offline";
}

export const EvaluationSchema = z.object({
  compatibilityScore: z.number().min(0).max(100),
  sharedInterests: z.array(z.string()),
  strengths: z.array(z.string()),
  friction: z.array(z.string()),
  naturalTopics: z.array(z.string()),
  meetAgain: z.boolean(),
  verdict: z.string(),
});

export interface RankedMatch {
  person: Person;
  score: number; // 0-100 display score
  raw: number; // 0-1 weighted
  breakdown: Record<string, number>;
  sharedInterests: string[];
  explanation: string;
}

export const PersonSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(120),
  linkedinUrl: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  avatar: z.string().nullable(),
  sourceText: z.string().max(20000),
  profile: ProfileSchema,
  demo: z.boolean().optional(),
  extraction: z.object({ status: z.enum(["ok", "limited", "failed", "demo"]), notes: z.array(z.string()) }).optional(),
});
