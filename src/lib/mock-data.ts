export interface UserProfile {
  id: string;
  name: string;
  fullName: string;
  email: string;
  institution: string;
  department: string;
  field: string;
  profileCompletion: number;
  onboardingSteps: { label: string; completed: boolean }[];
}

export interface MatchOpportunity {
  id: string;
  title: string;
  provider: string;
  matchScore: number;
  deadline: string;
  matchReasons: string[];
  track: "grant" | "scholarship";
  amount?: string;
}

export interface Deadline {
  id: string;
  title: string;
  provider: string;
  track: "grant" | "scholarship" | "research";
  deadline: string;
  daysRemaining: number;
  applicationStatus: "not_started" | "in_progress" | "submitted";
}

export interface Application {
  id: string;
  opportunityTitle: string;
  track: "grant" | "scholarship" | "research";
  status: "drafting" | "review" | "submitted" | "awarded" | "rejected";
  lastEdited: string;
  progress: number;
}

export interface ReadinessAssessment {
  id: string;
  type: "grant" | "scholarship" | "research";
  label: string;
  completed: boolean;
  score?: number;
}

export const mockUser: UserProfile = {
  id: "user-001",
  name: "Amara",
  fullName: "Dr. Amara Osei",
  email: "amara.osei@university.edu",
  institution: "University of Ghana",
  department: "Computer Science",
  field: "Artificial Intelligence in Healthcare",
  profileCompletion: 68,
  onboardingSteps: [
    { label: "Create profile", completed: true },
    { label: "Set research interests", completed: true },
    { label: "Upload CV", completed: true },
    { label: "Take readiness assessment", completed: false },
    { label: "Connect ORCID", completed: false },
    { label: "Set alert preferences", completed: true },
  ],
};

export const mockGrantMatches: MatchOpportunity[] = [
  {
    id: "g1",
    title: "AI for Global Health Innovation Fund",
    provider: "Wellcome Trust",
    matchScore: 92,
    deadline: "2026-08-15",
    matchReasons: ["AI in Healthcare", "Global Health", "Early Career"],
    track: "grant",
    amount: "$250,000",
  },
  {
    id: "g2",
    title: "Digital Health Research Grant",
    provider: "NIH / Fogarty International",
    matchScore: 85,
    deadline: "2026-09-01",
    matchReasons: ["Digital Health", "Research Methodology", "ML Applications"],
    track: "grant",
    amount: "$180,000",
  },
  {
    id: "g3",
    title: "Pan-African AI Ethics Fellowship",
    provider: "African Academy of Sciences",
    matchScore: 71,
    deadline: "2026-08-28",
    matchReasons: ["AI Ethics", "Africa Focus", "Interdisciplinary"],
    track: "grant",
    amount: "$120,000",
  },
];

export const mockScholarshipMatches: MatchOpportunity[] = [
  {
    id: "s1",
    title: "Mastercard Foundation Scholars Program",
    provider: "Mastercard Foundation",
    matchScore: 95,
    deadline: "2026-07-30",
    matchReasons: ["African Scholars", "STEM Leadership", "Community Impact"],
    track: "scholarship",
  },
  {
    id: "s2",
    title: "Google PhD Fellowship — Health AI",
    provider: "Google Research",
    matchScore: 88,
    deadline: "2026-08-20",
    matchReasons: ["PhD Candidate", "Health AI", "Machine Learning"],
    track: "scholarship",
  },
  {
    id: "s3",
    title: "ACM-W Scholarship for Women in Computing",
    provider: "ACM",
    matchScore: 76,
    deadline: "2026-09-10",
    matchReasons: ["Women in CS", "Computing Research", "Conference Travel"],
    track: "scholarship",
  },
];

export const mockDeadlines: Deadline[] = [
  {
    id: "d1",
    title: "Mastercard Foundation Scholars Program",
    provider: "Mastercard Foundation",
    track: "scholarship",
    deadline: "2026-07-30",
    daysRemaining: 4,
    applicationStatus: "in_progress",
  },
  {
    id: "d2",
    title: "AI for Global Health Innovation Fund",
    provider: "Wellcome Trust",
    track: "grant",
    deadline: "2026-08-15",
    daysRemaining: 20,
    applicationStatus: "not_started",
  },
  {
    id: "d3",
    title: "Google PhD Fellowship — Health AI",
    provider: "Google Research",
    track: "scholarship",
    deadline: "2026-08-20",
    daysRemaining: 25,
    applicationStatus: "not_started",
  },
  {
    id: "d4",
    title: "Pan-African AI Ethics Fellowship",
    provider: "African Academy of Sciences",
    track: "grant",
    deadline: "2026-08-28",
    daysRemaining: 33,
    applicationStatus: "not_started",
  },
  {
    id: "d5",
    title: "Digital Health Research Grant",
    provider: "NIH / Fogarty International",
    track: "grant",
    deadline: "2026-09-01",
    daysRemaining: 37,
    applicationStatus: "not_started",
  },
];

export const mockApplications: Application[] = [];

export const mockReadiness: ReadinessAssessment[] = [
  { id: "r1", type: "grant", label: "Grant Readiness", completed: false },
  { id: "r2", type: "scholarship", label: "Scholarship Readiness", completed: true, score: 82 },
  { id: "r3", type: "research", label: "Research Readiness", completed: false },
];
