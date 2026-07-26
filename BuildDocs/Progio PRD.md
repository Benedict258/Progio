# Progio — Product Requirements Document

**Positioning:** A replica of NOVAI's core mechanics (grant discovery, AI co-writing, readiness scoring, freemium gating), rebuilt for individual students and independent researchers rather than NGOs/organizations. Same UI language and interaction patterns, different palette, different data model (individual profile, not org profile).

**Track:** AI for Social Impact — SDG 4 (Quality Education)
**Event:** Build with Gemma: AI for Africa Hackathon — Minna 2026

---

## 0. Build Approach Note
UI structure, navigation pattern, dashboard widgets, and freemium/locked-feature mechanics are intentionally modeled closely on NOVAI's real product (site copy referenced directly). Visual palette will differ; underlying interaction patterns and information architecture are being deliberately replicated, then adapted for an individual/student data model instead of NOVAI's org/NGO model.

---

## 1. Overview

### 1.1 Core Value Proposition
Collapse the entire student funding/research lifecycle — grant discovery, scholarship discovery, research tooling, and post-award project tracking — into one workspace, so students and independent researchers stop losing funding and momentum to fragmented tools, missed deadlines, and not knowing where to look.

### 1.2 Primary Target Users
Individual students, early-career researchers, and independent applicants — not organizations. Single-user accounts, no org/team layer (unlike NOVAI).

### 1.3 The Four Tracks
Each track is a distinct top-level nav section with its own data, matching logic, and (where applicable) its own application workflow. They are related but explicitly **not** a single unified "proposals" flow — each has a different shape:

| Track | What it is |
|---|---|
| **Grants** | Discovery + application for research/project grants open to individuals |
| **Scholarships** | Discovery + application for scholarships (tuition, fellowships, awards) |
| **Research** | Literature discovery/citation assistant + research project management (notes, data, drafts) — not tied to funding, useful standalone |
| **Projects** | Post-award workspace — when a Grant or Scholarship application is won, it graduates into a tracked Project (milestones, deliverables, reporting deadlines) |

### 1.4 Essential Features by Surface

**Web App (primary)**
- Dashboard (per NOVAI pattern — see §2)
- Grants: All Grants, Alerts Management, Saved Grants, My Private Grants (manually added opportunities not in the system's database)
- Scholarships: same substructure as Grants (All / Alerts / Saved / Private)
- Research: Literature Discovery search, Citation Manager, My Research Projects (notes/data/drafts workspace)
- Projects: Active Projects, Completed Projects — created automatically when a Grant or Scholarship application is marked "Won"
- Applications: track-specific workflows —
  - Grant Applications: AI co-writer, section-by-section drafting
  - Scholarship Applications: AI co-writer, adapted for scholarship-specific fields (personal statement, recommendation tracking, transcript upload)
  - Research Proposals: literature-grounded drafting, citation-aware
- Profile: individual academic profile (institution, field of study, CGPA/level, funding needs, past initiatives/projects) — replaces NOVAI's org profile; drives matching + profile-completion %
- Readiness Assessments: one per applicable track (Grant Readiness, Scholarship Readiness, Research Readiness) — short scored assessment showing "how funders/reviewers see you," mirroring NOVAI's Funding Readiness concept
- Freemium gating: kept identical in spirit to NOVAI (blurred/limited matches, "Upgrade Now" prompts, % profile complete driving unlock state) — **fully free during the hackathon**, gating logic built but disabled/bypassed for demo, intended to activate post-hackathon

**Admin/Account**
- Single-user account settings (no org/team management — this is the key structural departure from NOVAI)

### 1.5 Core Workflow (Primary User Journey)
1. Student completes individual academic profile (institution, field, level, funding needs, past work) — mirrors NOVAI's org-profile-completion mechanic, individual-scoped
2. Matching engine surfaces relevant Grants and Scholarships separately → student sets alert preferences per track
3. Student selects an opportunity → track-specific AI co-writer generates a draft aligned to that opportunity's stated criteria
4. Student can also use Research tools independently of any funding search — literature discovery, citation help, project notes
5. Student completes and submits an application (workflow differs per track — grant vs scholarship vs research proposal)
6. On a "Won" outcome, the opportunity graduates into a **Project** — tracked with milestones and deliverable deadlines going forward
7. Readiness assessments available anytime per track, independent of an active application, to help the student improve future match quality

---

## 2. Dashboard Design (Reframed from NOVAI Site Copy)

Reference structure (from NOVAI, reframed for individual/student use):

- **Greeting header** — "Good evening, [Name]" + quick-start progress indicator (e.g. "Quick start 1/6")
- **Search** — global search across all opportunity types; advanced filters gated under freemium (built, demo-unlocked)
- **Matching opportunities by [region/field]** — surfaced cards per track (grants shown separately from scholarships, not merged), each showing deadline + match reason (which profile fields matched)
- **Opportunities closing soon** — deadline-sorted urgency list, cross-track
- **Profile completion widget** — "% complete," with an "AI fill" action (AI-assisted profile completion from uploaded documents e.g. transcript/CV) — gated under freemium, demo-unlocked
- **Applications in progress** — empty state: *"No applications yet. Start one from a match and the AI co-writer drafts the outline with you."*
- **Readiness Assessment widget** — "10 min · Take assessment," one instance per track (Grant/Scholarship/Research), scored, shown as "Needs your attention" until completed
- **Deadlines due soon** — cross-track chronological list, each item tagged with its track and current application status

**Explicitly dropped from NOVAI's dashboard:** "Book a free 30-minute call with the team" / Experts Sessions — not part of this version (per team decision).

---

## 3. Data Model Reframing (Individual vs. NOVAI's Org Model)

| NOVAI (org-based) | Progio (individual-based) |
|---|---|
| Organization profile (mission, sector, region, SDG focus, past initiatives) | Student profile (institution, field of study, level/CGPA, region, funding needs, past projects) |
| Team roles/permissions | Not applicable — single-user account |
| Expert Marketplace (paid consultant bookings) | Removed entirely |
| Single "Proposals" workspace for all funding types | Track-specific application workflows (Grants / Scholarships / Research) — explicitly not unified |
| Funding Readiness (org-level, single assessment) | Readiness Assessments — one per track (Grants, Scholarships, Research) |
| (no equivalent) | **Projects** — new track, post-award tracking workspace not present in NOVAI's structure at all |

---

## 4. Freemium/Gating Model
- Mirrors NOVAI's pattern: limited visible matches, blurred/locked additional matches, "Upgrade Now" prompts, AI-fill and advanced search gated behind a plan
- **For the hackathon:** all gating logic is implemented in the UI (so the interaction pattern is visibly authentic to NOVAI's real product) but **unlocked/bypassed** so judges see full functionality
- **Post-hackathon:** gating activates as the real monetization model

---

## 5. Explicit Non-Goals (For Now)
- Expert/mentor paid sessions (removed per team decision)
- Org/team accounts or multi-user collaboration
- Payment/billing flows (freemium logic built but not wired to real payments for the hackathon)

---

## 6. Success Criteria (Hackathon Demo)
- Dashboard visually and structurally recognizable as the NOVAI pattern, reframed for a student
- At least Grants and Scholarships tracks fully functional (discovery, profile matching, AI co-writer draft)
- At least one Readiness Assessment working end-to-end
- Projects track demonstrable via at least one manually-marked "Won" application graduating into a tracked project
