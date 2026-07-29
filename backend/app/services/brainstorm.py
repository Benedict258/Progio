import asyncio
import random

from app.services.ai_generator import _build_enriched_context


# ── Grant Brainstorm Concepts ─────────────────────────────────────────────

GRANT_CONCEPT_TEMPLATES: list[dict] = [
    {
        "title_template": "Adaptive {field} Framework for {region} Health Systems",
        "problem_template": (
            "Health systems in {region} lack computational tools adapted to their "
            "infrastructure constraints. Existing {field} solutions achieve high "
            "accuracy in controlled environments but degrade by 30-40% when deployed "
            "in low-resource clinics — a gap that {provider}'s focus on {field_tags} "
            "directly aims to address."
        ),
        "methodology_template": (
            "Phase 1: Co-design with {region} health workers to identify deployment "
            "constraints. Phase 2: Develop lightweight {field} models using transfer "
            "learning from high-resource datasets. Phase 3: Iterative field validation "
            "across 3 clinical sites in {region} with performance benchmarking against "
            "existing tools."
        ),
        "impact_template": (
            "A validated, open-source {field} toolkit that maintains >85% diagnostic "
            "accuracy in low-resource settings — directly advancing {provider}'s mission "
            "to strengthen health data capacity in underserved regions."
        ),
    },
    {
        "title_template": "Cross-Regional {field} Knowledge Transfer Initiative",
        "problem_template": (
            "Researchers in {region} face a dual challenge: limited access to "
            "high-quality training data and tools designed for different infrastructure "
            "contexts. {provider}'s {field_tags} priorities highlight this gap, yet "
            "no current program addresses the specific transfer mechanisms needed."
        ),
        "methodology_template": (
            "Phase 1: Survey {region} researchers to map existing capabilities and "
            "gaps. Phase 2: Build a federated data pipeline that enables model training "
            "without centralizing sensitive datasets. Phase 3: Deploy pilot toolkit at "
            "{institution} and two partner institutions with embedded evaluation."
        ),
        "impact_template": (
            "A replicable knowledge-transfer framework that enables {region} institutions "
            "to build local {field} capacity while maintaining data sovereignty — a "
            "concrete deliverable for {provider}'s regional capacity-building goals."
        ),
    },
    {
        "title_template": "Deployable {field} Monitoring System for {region}",
        "problem_template": (
            "Real-time monitoring of health indicators in {region} relies on manual "
            "reporting with 6-12 month lags. {field} methods offer faster, more "
            "accurate alternatives, but current systems are not designed for the "
            "connectivity and power constraints of {region} health facilities."
        ),
        "methodology_template": (
            "Phase 1: Identify three priority health indicators with {region} Ministry "
            "of Health partners. Phase 2: Develop edge-computing {field} models that "
            "run on low-cost hardware. Phase 3: Pilot deployment with quarterly "
            "evaluation cycles aligned with {provider}'s reporting schedule."
        ),
        "impact_template": (
            "A field-tested monitoring system that reduces reporting lag from months "
            "to days for key health indicators — delivering measurable improvement in "
            "{region} health surveillance capacity."
        ),
    },
]


# ── Scholarship Brainstorm Concepts ───────────────────────────────────────

SCHOLARSHIP_CONCEPT_TEMPLATES: list[dict] = [
    {
        "title_template": "Bridging {field} Research and Community Impact in {region}",
        "problem_template": (
            "Academic research in {field} often remains siloed within institutions, "
            "while communities in {region} face urgent challenges that existing "
            "knowledge could address. {provider}'s scholarship targets this gap by "
            "supporting scholars who can translate research into actionable solutions."
        ),
        "methodology_template": (
            "Develop a community-engaged research approach: (1) Conduct needs assessment "
            "with {region} community organizations. (2) Design {field} interventions "
            "co-created with end users. (3) Implement iterative evaluation using mixed "
            "methods. (4) Produce open-access resources for replication."
        ),
        "impact_template": (
            "A scholarly portfolio demonstrating that {field} research can directly "
            "serve {region} communities — establishing a model for engaged scholarship "
            "that aligns with {provider}'s commitment to social impact."
        ),
    },
    {
        "title_template": "Advancing {field} Equity Through Interdisciplinary Collaboration",
        "problem_template": (
            "Disparities in {field} access and outcomes persist across {region}, "
            "driven by structural barriers that single-discipline approaches cannot "
            "address. {provider}'s scholarship seeks scholars who combine disciplinary "
            "rigor with cross-sector collaboration to tackle these systemic challenges."
        ),
        "methodology_template": (
            "Build an interdisciplinary framework: (1) Map existing {field} disparities "
            "using quantitative and qualitative methods. (2) Partner with policy and "
            "community organizations to identify leverage points. (3) Develop and pilot "
            "interventions. (4) Evaluate impact using equity-focused metrics."
        ),
        "impact_template": (
            "Evidence-based strategies for reducing {field} disparities in {region}, "
            "published in both academic and policy venues — demonstrating {provider}'s "
            "investment in actionable scholarship."
        ),
    },
    {
        "title_template": "Building {field} Capacity in Underserved {region} Contexts",
        "problem_template": (
            "Institutions in {region} lack trained {field} practitioners and adapted "
            "curricula. This capacity gap limits the region's ability to address local "
            "challenges independently. {provider}'s scholarship supports scholars who "
            "can build lasting institutional capacity."
        ),
        "methodology_template": (
            "(1) Assess current {field} training gaps at target institutions in {region}. "
            "(2) Design curriculum modules adapted to local constraints and priorities. "
            "(3) Train cohorts of {field} practitioners using train-the-trainer models. "
            "(4) Establish sustainable knowledge-sharing networks."
        ),
        "impact_template": (
            "A trained cohort of {field} practitioners in {region} and adaptable "
            "curriculum materials — creating lasting capacity that extends beyond the "
            "scholarship period."
        ),
    },
]


# ── Research Studio Templates ─────────────────────────────────────────────

RESEARCH_STUDIO_TEMPLATES: list[dict] = [
    {
        "objectives_template": (
            "Objective 1: Investigate the applicability of {field} methods to the "
            "research problem described — specifically testing whether techniques "
            "validated in {region} contexts transfer to the proposed application domain.\n\n"
            "Objective 2: Develop and validate a methodological framework that bridges "
            "theoretical {field} advances with practical implementation requirements.\n\n"
            "Objective 3: Produce open-source tools and documentation that enable "
            "reproduction and extension by other researchers."
        ),
        "significance_template": (
            "This research addresses a critical gap between {field} theoretical "
            "advances and their practical deployment. Current literature demonstrates "
            "promising results in controlled settings, but real-world application "
            "remains limited by context-specific constraints. By systematically "
            "characterizing these constraints and developing adaptation strategies, "
            "this work will accelerate the translation of {field} research into "
            "impactful applications."
        ),
        "methodology_template": (
            "Phase 1 — Scoping (Months 1-3): Comprehensive literature review and "
            "stakeholder consultation to refine research questions and identify "
            "existing datasets.\n\n"
            "Phase 2 — Development (Months 4-9): Build and iteratively refine the "
            "methodological framework using {field} techniques. Establish evaluation "
            "metrics grounded in domain-specific requirements.\n\n"
            "Phase 3 — Validation (Months 10-15): Test framework against benchmark "
            "datasets and real-world scenarios. Collect quantitative performance data "
            "and qualitative feedback from domain experts.\n\n"
            "Phase 4 — Dissemination (Months 16-18): Publish findings, release "
            "open-source toolkit, present at relevant conferences."
        ),
        "impact_template": (
            "Expected outcomes include: (1) A validated methodological framework for "
            "{field} application, peer-reviewed for publication in a high-impact venue. "
            "(2) An open-source toolkit with documented performance characteristics. "
            "(3) At least two peer-reviewed publications establishing baseline results "
            "for future work. (4) A clear roadmap for scaling the approach to adjacent "
            "domains."
        ),
    },
]


def _build_brainstorm_context(user, opportunity=None):
    """Build context dict from user and optional opportunity models."""
    ctx = {
        "field": getattr(user, "field_of_study", None) or "interdisciplinary studies",
        "institution": getattr(user, "institution", None) or "their institution",
        "level": getattr(user, "level", None) or "graduate student",
        "region": getattr(user, "region", None) or "global",
        "user_name": getattr(user, "name", None) or "the applicant",
        "field_tags": "",
        "past_projects_detail": "no specific projects",
    }
    if opportunity:
        ctx["title"] = getattr(opportunity, "title", "this opportunity")
        ctx["provider"] = getattr(opportunity, "provider", "the funding body")
        ctx["award_range"] = getattr(opportunity, "award_range", "competitive award")
        ctx["deadline"] = (
            opportunity.deadline.isoformat()
            if getattr(opportunity, "deadline", None)
            else "TBD"
        )
        tags = getattr(opportunity, "field_tags", None) or []
        ctx["field_tags"] = ", ".join(tags) if tags else "interdisciplinary"
        eligibility = getattr(opportunity, "eligibility_criteria", None) or {}
        parts = []
        if "degree" in eligibility:
            parts.append(f"Required degree: {eligibility['degree']}")
        if "field" in eligibility:
            parts.append(f"Preferred field: {eligibility['field']}")
        ctx["eligibility_summary"] = "; ".join(parts) if parts else "Open"
        past = getattr(user, "past_projects", None) or []
        if past:
            details = []
            for p in past[:3]:
                if isinstance(p, dict):
                    t = p.get("title", "Untitled")
                    y = p.get("year", "n/a")
                    details.append(f'- "{t}" ({y})')
            ctx["past_projects_detail"] = "\n".join(details) if details else "None"
    return ctx


def _generate_concept(template: dict, ctx: dict, fit_score: float) -> dict:
    """Fill a concept template and return structured dict."""
    return {
        "title": template["title_template"].format(**ctx),
        "problem_statement": template["problem_template"].format(**ctx),
        "methodology": template["methodology_template"].format(**ctx),
        "expected_impact": template["impact_template"].format(**ctx),
        "fit_score": fit_score,
    }


# ── Mock Concept Generators ──────────────────────────────────────────────

def generate_opportunity_concepts(user, opportunity, track_type: str = "grant"):
    """Generate 3 tailored proposal concepts for an opportunity."""
    ctx = _build_brainstorm_context(user, opportunity)

    if track_type == "scholarship":
        templates = SCHOLARSHIP_CONCEPT_TEMPLATES
    else:
        templates = GRANT_CONCEPT_TEMPLATES

    fit_scores = [round(random.uniform(82, 96), 1) for _ in range(3)]
    concepts = []
    for i, template in enumerate(templates):
        concept = _generate_concept(template, ctx, fit_scores[i])
        concepts.append(concept)
    return concepts


def generate_freeform_blueprint(user, idea_text: str, track_type: str = "grant"):
    """Generate a structured proposal blueprint from a raw idea."""
    ctx = _build_brainstorm_context(user)
    ctx["idea_text"] = idea_text

    if track_type == "research":
        template = RESEARCH_STUDIO_TEMPLATES[0]
    else:
        template = RESEARCH_STUDIO_TEMPLATES[0]

    return {
        "objectives": (
            f"Based on the idea: \"{idea_text[:200]}\"\n\n"
            + template["objectives_template"].format(**ctx)
        ),
        "significance": (
            f"The applicant proposes: \"{idea_text[:200]}\"\n\n"
            + template["significance_template"].format(**ctx)
        ),
        "methodology": (
            f"Research concept: \"{idea_text[:200]}\"\n\n"
            + template["methodology_template"].format(**ctx)
        ),
        "expected_impact": (
            f"Proposed impact area: \"{idea_text[:200]}\"\n\n"
            + template["impact_template"].format(**ctx)
        ),
    }


# ── Streaming Helpers ─────────────────────────────────────────────────────

async def stream_concepts(concepts: list[dict], opportunity_id: str | None = None):
    """Yield SSE-formatted chunks for 3 proposal concepts."""
    for idx, concept in enumerate(concepts):
        yield f"data: {{\"event\": \"concept_start\", \"index\": {idx}}}\n\n"

        for field_name in ["title", "problem_statement", "methodology", "expected_impact"]:
            value = concept[field_name]
            words = value.split()
            chunk_size = random.randint(3, 7)
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i : i + chunk_size])
                if i + chunk_size < len(words):
                    chunk += " "
                payload = {
                    "event": "concept_chunk",
                    "index": idx,
                    "field": field_name,
                    "content": chunk,
                }
                yield f"data: {str(payload).replace(chr(39), chr(34))}\n\n"
                await asyncio.sleep(0.03)

        payload = {
            "event": "concept_field_done",
            "index": idx,
            "field": field_name,
        }
        yield f"data: {str(payload).replace(chr(39), chr(34))}\n\n"

    yield f"data: {{\"event\": \"done\", \"total\": {len(concepts)}}}\n\n"


async def stream_blueprint(blueprint: dict):
    """Yield SSE-formatted chunks for a structured blueprint."""
    yield f"data: {{\"event\": \"blueprint_start\"}}\n\n"

    for field_name in ["objectives", "significance", "methodology", "expected_impact"]:
        value = blueprint[field_name]
        words = value.split()
        chunk_size = random.randint(3, 7)
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i : i + chunk_size])
            if i + chunk_size < len(words):
                chunk += " "
            payload = {
                "event": "blueprint_chunk",
                "field": field_name,
                "content": chunk,
            }
            yield f"data: {str(payload).replace(chr(39), chr(34))}\n\n"
            await asyncio.sleep(0.03)

        payload = {"event": "blueprint_field_done", "field": field_name}
        yield f"data: {str(payload).replace(chr(39), chr(34))}\n\n"

    yield f"data: {{\"event\": \"done\"}}\n\n"
