"use client";

import Link from "next/link";
import {
  User,
  Search,
  FileText,
  Sparkles,
  CheckCircle,
  FolderKanban,
  ArrowRight,
  FlaskConical,
  Rocket,
} from "lucide-react";

const demoSteps = [
  {
    id: 1,
    title: "Complete Your Profile",
    description:
      "Start by filling in your academic profile. Use AI Fill to auto-extract data from your CV or transcript.",
    icon: <User size={24} className="text-indigo-600" />,
    href: "/profile",
    color: "bg-indigo-50 border-indigo-200",
    iconBg: "bg-indigo-100",
  },
  {
    id: 2,
    title: "Discover Matches",
    description:
      "Browse AI-matched grants and scholarships based on your profile, field of study, and research interests.",
    icon: <Search size={24} className="text-purple-600" />,
    href: "/grants/all",
    color: "bg-purple-50 border-purple-200",
    iconBg: "bg-purple-100",
  },
  {
    id: 3,
    title: "Start Application",
    description:
      "Click 'Start Application' on any matched opportunity to begin drafting your application with AI assistance.",
    icon: <FileText size={24} className="text-blue-600" />,
    href: "/grants/all",
    color: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100",
  },
  {
    id: 4,
    title: "Use AI Co-Writer",
    description:
      "Work with the AI co-writer to draft each section of your application. Get suggestions, improve clarity, and strengthen your narrative.",
    icon: <Sparkles size={24} className="text-amber-600" />,
    href: "/grants/applications/demo-app",
    color: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100",
  },
  {
    id: 5,
    title: "Submit Application",
    description:
      "Review your application, get AI feedback, and submit. Mark as 'won' to automatically create a tracked project.",
    icon: <CheckCircle size={24} className="text-emerald-600" />,
    href: "/grants/applications/demo-app",
    color: "bg-emerald-50 border-emerald-200",
    iconBg: "bg-emerald-100",
  },
  {
    id: 6,
    title: "Track Project",
    description:
      "Once awarded, your application becomes a tracked project with milestones, deliverables, and progress tracking.",
    icon: <FolderKanban size={24} className="text-teal-600" />,
    href: "/projects",
    color: "bg-teal-50 border-teal-200",
    iconBg: "bg-teal-100",
  },
  {
    id: 7,
    title: "Take Assessment",
    description:
      "Evaluate your readiness for grants, scholarships, and research with our comprehensive assessments.",
    icon: <FlaskConical size={24} className="text-rose-600" />,
    href: "/readiness",
    color: "bg-rose-50 border-rose-200",
    iconBg: "bg-rose-100",
  },
];

function StepCard({
  step,
  index,
}: {
  step: (typeof demoSteps)[number];
  index: number;
}) {
  return (
    <Link href={step.href} className="block group">
      <div
        className={`relative bg-white border ${step.color} rounded-xl p-6 shadow-sm hover:shadow-md transition-all`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 ${step.iconBg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
          >
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-400">STEP {index + 1}</span>
            </div>
            <h3 className="font-semibold text-slate-900 text-lg mb-1">{step.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
          </div>
          <ArrowRight
            size={20}
            className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 mt-1"
          />
        </div>
      </div>
    </Link>
  );
}

export default function DemoPage() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
          <Rocket size={16} />
          Hackathon Demo Flow
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Progio User Journey
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Follow these steps to experience the complete Progio workflow — from profile creation to project tracking.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">7</p>
          <p className="text-xs text-slate-500 mt-1">Demo Steps</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">~5min</p>
          <p className="text-xs text-slate-500 mt-1">Quick Walkthrough</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">AI</p>
          <p className="text-xs text-slate-500 mt-1">Powered</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">100%</p>
          <p className="text-xs text-slate-500 mt-1">Demo Mode</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {demoSteps.map((step, index) => (
          <StepCard key={step.id} step={step} index={index} />
        ))}
      </div>

      {/* Key Features */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Key Features to Highlight</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "AI-Powered Matching",
              description: "Smart matching based on your profile, field, and research interests",
            },
            {
              title: "AI Co-Writer",
              description: "Draft applications with AI assistance and real-time suggestions",
            },
            {
              title: "Freemium Gating",
              description: "Demo mode shows all features; production limits to 3 applications/month",
            },
            {
              title: "End-to-End Workflow",
              description: "From discovery to project tracking in one unified workspace",
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-white/80 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/profile"
          className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          Start with Profile
        </Link>
      </div>
    </div>
  );
}
