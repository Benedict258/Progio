# Progio — Architecture & Development Plan

Base architecture adapted directly from the approved NOVAI system design, reframed from an org-multi-tenant model to an individual-user model, with the Grants/Scholarships/Research/Projects track split replacing NOVAI's unified Proposals workspace.

---

## 1. Architecture Pattern
**Modular monolith at MVP/hackathon stage**, same reasoning as the original NOVAI design: this is CRUD-heavy + AI orchestration + moderate real-time needs — full microservices aren't justified yet. The **AI Generation Service** remains the first candidate to split out independently, since it scales differently (latency-bound, external API dependent) from the rest of the app.

**Key structural change from NOVAI:** no Organization/team layer. Every entity is scoped to a single `User`, not an `Organization` — this simplifies auth/RBAC significantly (no multi-role-per-org logic needed) but the track-specific workflow separation (Grants vs Scholarships vs Research each with distinct forms/flows) adds complexity NOVAI's single Proposals model didn't have.

---

## 2. Frontend Layer
| Component | Choice | Rationale |
|---|---|---|
| Framework | Next.js (React) | Same as NOVAI base — SSR for indexable opportunity listing pages, CSR for the app shell |
| State management | TanStack Query (server state) + Zustand (UI/editor state) | Unchanged from NOVAI base |
| Rich text editor | Tiptap (CRDT via Yjs optional — single-user editing doesn't strictly require CRDT, but keep the same editor library as NOVAI for consistency; drop Yjs multi-cursor sync since there's no team collaboration here) | Simplifies vs. NOVAI since no real-time co-editing is needed for a single-user product |
| Design system | Same layout/interaction patterns as NOVAI (dashboard structure, card patterns, gating UI); new color palette (TBD separately, no colors specified in this doc per UI/UX convention) |

---

## 3. Backend Layer (Single Responsibilities)
| Service | Responsibility | Change from NOVAI |
|---|---|---|
| **Opportunity Service** | Ingests/normalizes Grant and Scholarship opportunities from external sources | Now serves two opportunity types (grant, scholarship) via a shared schema with a `type` discriminator, rather than one funding type |
| **Matching Service** | Scores student profile against opportunities (embedding similarity + rule filters: field of study, level, region, budget/award size) | Profile fields swapped from org-based to individual-based |
| **AI Generation Service** | Orchestrates LLM calls for track-specific co-writers (Grant, Scholarship, Research) | Now needs **per-track prompt templates**, not one generic proposal template — a scholarship personal statement and a grant technical proposal are structurally different documents |
| **Research Service** *(new — not in NOVAI)* | Literature/citation discovery, research project notes/data management | Entirely new service; no NOVAI equivalent |
| **Project Tracking Service** *(new — not in NOVAI)* | Manages post-award Projects — milestones, deliverables, reporting deadlines | Entirely new service; triggered when an Application status changes to "Won" |
| **Readiness Assessment Service** | Scored quiz per track (Grant/Scholarship/Research readiness) | NOVAI has one org-level assessment; this needs to run per-track with track-specific scoring criteria |
| **Notification Service** | Alert matching + delivery (email/in-app) | Unchanged in concept from NOVAI |
| **Identity/User Service** | Auth, individual account management | Simplified from NOVAI — no org membership/team roles, single-user RBAC only (still need a permission model for future paid-tier feature gating) |
| ~~Expert Marketplace Service~~ | — | **Removed** — no Experts Sessions in this version |

---

## 4. Data Layer
| Store | Technology | Notes |
|---|---|---|
| Primary store | PostgreSQL | Same as NOVAI base |
| Vector store | pgvector | Opportunity-to-student semantic matching; also powers Research track's literature discovery/citation relevance |
| Cache | Redis | Session state, hot opportunity listings, rate limiting — unchanged from NOVAI |
| Object storage | S3-equivalent | Transcripts, CVs, research documents, exported application PDFs |

---

## 5. Core Entities & Data Model
```
User (id, name, email, institution, field_of_study, level, region,
      funding_needs, past_projects, profile_completion_pct)

Opportunity (id, type[grant|scholarship], title, provider, eligibility_criteria,
             award_range, deadline, field_tags[], region, source_url)

Application (id, user_id, opportunity_id, type[grant|scholarship|research],
             status[draft|submitted|won|rejected], sections[jsonb],
             version_history)

ResearchProject (id, user_id, title, notes[jsonb], citations[jsonb],
                 linked_application_id [nullable])

Project (id, user_id, source_application_id, status[active|completed],
         milestones[jsonb], deliverable_deadlines[jsonb])

ReadinessAssessment (id, user_id, track[grant|scholarship|research],
                     score, completed_at, responses[jsonb])

AlertPreference (id, user_id, track, filters[jsonb], notify_channels[])
```

**Relationships:**
`User` 1—N `Application`; `Application` N—1 `Opportunity`; `Application` 1—1 `Project` (only when status = "won"); `User` 1—N `ResearchProject`; `ResearchProject` N—1 `Application` (optional link, e.g. a research proposal tied to a research notebook); `User` 1—N `ReadinessAssessment` (one active per track).

---

## 6. Key API Endpoints
```
GET  /api/opportunities/search?type=grant|scholarship&field=&region=&deadline_after=
POST /api/applications/{id}/generate-section   { track_type, section_type, context }  → streams AI output
POST /api/applications/{id}/mark-won            → triggers Project creation (Project Tracking Service)
```

---

## 7. Real-Time Requirements
- SSE for AI generation streaming (co-writer output) — same as NOVAI, one-directional is sufficient
- WebSocket for live dashboard updates (deadline countdowns, new match notifications) — lighter need than NOVAI's collaborative editing case, since there's no multi-user doc sync required here
- CRDT/Yjs from the original NOVAI design is **not needed** — dropped, since Progio is single-user per document, unlike NOVAI's team-collaboration proposal editor

---

## 8. Infrastructure & DevOps
Same cloud posture as the NOVAI base design (AWS ECS Fargate + RDS + S3 + CloudFront, or GCP equivalent) — no material differences for a hackathon-scale build. The **AI Generation Service remains the primary bottleneck/single point of failure**, same as NOVAI's original analysis: mitigate with request queuing and per-user rate limiting rather than synchronous blocking calls.

**Simplification vs. NOVAI:** no need for the "many simultaneous editors per doc" CRDT scaling concern, since every document is single-user.

---

## 9. Security & Compliance
- OAuth2/OIDC + JWT — unchanged from NOVAI base
- RBAC simplified to single-user scope (no org-level roles); a lightweight plan-tier permission layer (free vs. paid) replaces NOVAI's org-role RBAC
- Encryption at rest/in transit — unchanged
- GDPR consideration remains relevant if targeting international students; less structurally central than it was for NOVAI's EU-NGO-heavy user base, but still worth building in from the start rather than retrofitting

---

## 10. Recommended Tech Stack Summary
| Layer | Primary Technology | Rationale |
|---|---|---|
| Frontend | Next.js + TanStack Query | Unchanged from NOVAI base |
| Editor | Tiptap (no Yjs/CRDT) | Single-user editing simplifies this vs. NOVAI |
| Backend | Node.js/NestJS or Python/FastAPI | Unchanged from NOVAI base |
| Primary DB | PostgreSQL | Unchanged |
| Vector Search | pgvector | Now also powers Research track literature discovery, not just matching |
| Cache | Redis | Unchanged |
| Real-time | SSE (generation) + lightweight WebSocket (dashboard) | Reduced complexity vs. NOVAI's full collaborative WebSocket requirement |
| Hosting | AWS ECS Fargate + RDS + S3 + CloudFront | Unchanged from NOVAI base |
| Auth | OIDC + JWT + single-user plan-tier gating | Simplified from NOVAI's org-scoped RBAC |

---

## 11. Build Sequencing (Suggested)
1. User/Identity Service + individual profile model
2. Opportunity Service (grants + scholarships, shared schema with type discriminator)
3. Matching Service
4. Application workflows — Grants first, then Scholarships (share the AI Generation Service, different prompt templates)
5. Dashboard (recreate NOVAI's layout/widgets per PRD §2)
6. Freemium gating UI (built, unlocked for demo)
7. Readiness Assessment Service (start with one track, extend to all three)
8. Research track (literature discovery + citation manager + research notes)
9. Project Tracking Service (post-award graduation flow)
10. Polish pass: empty states, deadline widgets, profile-completion mechanics matching NOVAI's copy patterns
