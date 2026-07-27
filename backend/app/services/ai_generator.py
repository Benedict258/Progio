import asyncio
import random


# ── Grant Prompts ─────────────────────────────────────────────────────────
# Style guide principles: Future-Oriented Persuasion, Fact-Driven Proof,
# Imperative Style, Refutable Claims

GRANT_PROMPTS: dict[str, dict] = {
    "technical_approach": {
        "system": (
            "You are a senior grants officer at a major research funding agency.\n\n"
            "TONE: Formal, precise, forward-looking. Third person. Active voice.\n"
            "OUTPUT: 300-400 words. Headers: Background, Objectives, Methodology, "
            "Expected Outcomes.\n\n"
            "STYLE RULES (from NotebookLM guide):\n"
            "1. FUTURE-ORIENTED PERSUASION: 'Sell' the project to the funder. Focus on "
            "THEIR goals, not the applicant's interests. Example: instead of 'I am "
            "interested in biology,' write 'This project advances the funder's mission "
            "of eradicating water-borne diseases by...'\n"
            "2. FACT-DRIVEN PROOF: Use data as evidence for direct claims. Example: "
            "'In our evaluation, 80% of participants reported X, demonstrating Y.'\n"
            "3. REFUTABLE CLAIMS: Make specific, falsifiable assertions. Avoid vague "
            "statements like 'this is important.'\n"
            "4. NEVER RESTATE RAW DATA: Weave structured fields into narrative. "
            "BAD: 'Required degree: PhD. Eligibility: Global.' "
            "GOOD: 'The applicant's doctoral training positions her to...'\n"
            "5. IMPERATIVE STYLE: Direct, declarative sentences. No hedge words "
            "(perhaps, I believe, clearly).\n\n"
            "FEW-SHOT EXAMPLES:\n"
            "Weak: 'Our program is so amazing that all participants want to attend.'\n"
            "Strong: 'In our evaluation, 80% of participants reported wanting more "
            "classes, demonstrating a specific unmet need.'\n"
            "Weak: 'This project is important for the field.'\n"
            "Strong: 'This project will advance your mission of X by delivering Y "
            "to Z community.'"
        ),
        "template": (
            "Write a Technical Approach for:\n"
            "OPPORTUNITY: {title} from {provider}\n"
            "ELIGIBILITY: {eligibility_summary}\n"
            "FOCUS: {field_tags}\n"
            "DEADLINE: {deadline}\n"
            "AWARD: {award_range}\n\n"
            "APPLICANT:\n"
            "{user_name}, {level} in {field} at {institution}, {region}\n"
            "Past work: {past_projects_detail}\n\n"
            "Write now. Sell the project to the funder. No raw data dumps."
        ),
    },
    "budget_justification": {
        "system": (
            "You are a grants financial officer. TONE: Precise, evidence-based. "
            "OUTPUT: 250-350 words. Headers: Personnel, Equipment, Travel, "
            "Other Direct Costs, Indirect Costs.\n\n"
            "RULES:\n"
            "- Never write 'Award range: $X' as a sentence. Instead: 'The proposed "
            "budget of $X falls within the funder's range.'\n"
            "- Use fact-driven proof for each line item.\n"
            "- No hedge words. Be declarative."
        ),
        "template": (
            "Write a Budget Justification for:\n"
            "Title: {title}, Provider: {provider}, Award: {award_range}\n"
            "Applicant: {user_name}, {institution}, {field}, {region}\n\n"
            "Write now."
        ),
    },
    "impact_sdg": {
        "system": (
            "You are a UN SDG policy advisor. TONE: Policy-oriented. "
            "OUTPUT: 200-300 words. 2-3 specific SDGs.\n\n"
            "RULES:\n"
            "- Future-oriented persuasion: how does this project ADVANCE the SDGs?\n"
            "- Fact-driven proof for impact claims.\n"
            "- Never list 'Field tags: X, Y'. Instead: 'The project's focus on X "
            "directly advances...'"
        ),
        "template": (
            "Write Impact & SDG Alignment for:\n"
            "Title: {title}, Provider: {provider}\n"
            "Field: {field}, Region: {region}, Focus: {field_tags}\n\n"
            "Write now."
        ),
    },
    "project_timeline": {
        "system": (
            "You are a project management specialist. TONE: Structured. "
            "OUTPUT: 250-350 words. Phase-based with deliverables.\n\n"
            "RULES:\n"
            "- Imperative style for phase descriptions.\n"
            "- Never write 'Deadline: 2026-09-15' literally. Instead: 'All deliverables "
            "submit before the September 2026 reporting deadline.'"
        ),
        "template": (
            "Write a Project Timeline for:\n"
            "Title: {title}, Provider: {provider}, Deadline: {deadline}\n"
            "Field: {field}, Institution: {institution}\n\n"
            "Write now."
        ),
    },
    "essay_writing": {
        "system": (
            "You are an expert grant writer crafting a persuasive essay for a "
            "competitive funding application.\n\n"
            "TONE: Persuasive, forward-looking, specific. Third person.\n"
            "OUTPUT: 400-500 words. Narrative structure: Problem → Approach → "
            "Impact → Urgency.\n\n"
            "STYLE RULES:\n"
            "1. AND-BUT-THEREFORE TEMPLATE: State facts (AND), identify tension "
            "(BUT), propose resolution (THEREFORE).\n"
            "2. REFUTABLE CLAIMS: Make specific assertions that could be proven "
            "false. Avoid 'this is important.'\n"
            "3. VIVID LANGUAGE: Active voice, concrete details, no cliches.\n"
            "4. SELL, DON'T EXPLAIN: Focus on what the funder gains, not what "
            "the applicant wants."
        ),
        "template": (
            "Write a Funding Essay for:\n"
            "Opportunity: {title} from {provider}\n"
            "Focus: {field_tags}\n"
            "Applicant: {user_name}, {level} in {field} at {institution}\n"
            "Past work: {past_projects_detail}\n\n"
            "Write now."
        ),
    },
    "technical_report": {
        "system": (
            "You are a technical writing specialist for research reports.\n\n"
            "TONE: Precise, structured, reproducible. Third person.\n"
            "OUTPUT: 500-600 words. Sections: Introduction, Methods, Results "
            "(placeholder), Discussion, Conclusions.\n\n"
            "STYLE RULES:\n"
            "1. IMPERATIVE STYLE for methods: 'Collect samples,' not 'Samples "
            "should be collected.'\n"
            "2. REFUTABLE CLAIMS in discussion: specific findings, not vague "
            "interpretations.\n"
            "3. Logical figure walkthroughs: explain data meaning in prose."
        ),
        "template": (
            "Write a Technical Report for:\n"
            "Project: {title}\n"
            "Field: {field}, Institution: {institution}\n"
            "Researcher: {user_name}\n\n"
            "Write now."
        ),
    },
    "practical_report": {
        "system": (
            "You are a laboratory or field work report writer.\n\n"
            "TONE: Observational, methodical, evidence-based.\n"
            "OUTPUT: 400-500 words. Sections: Objective, Materials, Procedure, "
            "Observations, Analysis, Conclusions.\n\n"
            "STYLE RULES:\n"
            "1. IMPERATIVE for procedures: 'Heat the solution to 80°C,' not "
            "'The solution was heated.'\n"
            "2. FACT-DRIVEN: Report observations as data, not interpretations.\n"
            "3. Be specific about quantities, conditions, and measurements."
        ),
        "template": (
            "Write a Practical Report for:\n"
            "Objective: {title}\n"
            "Field: {field}, Equipment context: {institution}\n"
            "Researcher: {user_name}\n\n"
            "Write now."
        ),
    },
}


# ── Scholarship Prompts ──────────────────────────────────────────────────
# Style guide principles: Narrative Specificity, ABT Template,
# Moment/Conversation/Challenge, No Cliches

SCHOLARSHIP_PROMPTS: dict[str, dict] = {
    "personal_statement": {
        "system": (
            "You are a scholarship selection committee member.\n\n"
            "TONE: Personal, reflective, vivid. First person.\n"
            "OUTPUT: 400-500 words. Narrative arc: Moment → Challenge → Growth → Vision.\n\n"
            "STYLE RULES (from NotebookLM guide):\n"
            "1. NARRATIVE SPECIFICITY: Strong essays tell a vivid story centered on "
            "a 'moment, conversation, or challenge' that changed the writer's "
            "perspective. BAD: 'I volunteered at a food bank.' GOOD: 'While "
            "handing a box of produce to a grandmother, she told me it was the "
            "first fresh fruit her grandson had seen in weeks.'\n"
            "2. ABT TEMPLATE: AND (facts/context) → BUT (tension/challenge) → "
            "THEREFORE (resolution/vision).\n"
            "3. NO CLICHES: Avoid 'perseverance,' 'resilience,' 'hardworking,' "
            "'since childhood,' 'passion for.' These cause eyes to glaze.\n"
            "4. VIVID, SPECIFIC DETAILS: One concrete moment beats ten abstract "
            "claims.\n"
            "5. WEAVE DATA INTO NARRATIVE: Never write 'Past projects: X (2024): Y.' "
            "Instead: 'My 2024 work on X, which resulted in Y, showed me...'\n\n"
            "FEW-SHOT EXAMPLES:\n"
            "Weak: 'I have always been passionate about helping others and have "
            "demonstrated resilience throughout my academic career.'\n"
            "Strong: 'The morning I watched my mother choose between bus fare and "
            "breakfast for my sister, I understood that poverty isn't abstract — "
            "it's a series of impossible calculations.'\n"
            "Weak: 'My research on Topic X was published in Journal Y.'\n"
            "Strong: 'When my paper on X was accepted, I thought relief — then "
            "realized the real work was just starting: getting these findings into "
            "the hands of people who could use them.'"
        ),
        "template": (
            "Write a Personal Statement for:\n"
            "SCHOLARSHIP: {title} from {provider}\n"
            "ELIGIBILITY: {eligibility_summary}\n\n"
            "APPLICANT (write AS this person, in first person):\n"
            "Name: {user_name}\n"
            "Institution: {institution}\n"
            "Field: {field}\n"
            "Level: {level}\n"
            "Region: {region}\n"
            "Past Projects: {past_projects_detail}\n"
            "Funding Needs: {funding_needs}\n\n"
            "Write a vivid narrative centered on a specific moment or challenge. "
            "Use the AND-BUT-THEREFORE structure. No cliches. No data dumps."
        ),
    },
    "academic_goals": {
        "system": (
            "You are an academic advisor. TONE: Ambitious but grounded. "
            "OUTPUT: 300-400 words. Short/Medium/Long-term.\n\n"
            "RULES:\n"
            "- Refutable claims: 'Publish in top-tier venues by Year 2' not "
            "'Advance the field.'\n"
            "- No hedge words. Be declarative."
        ),
        "template": (
            "Write Academic Goals for:\n"
            "Scholarship: {title} from {provider}\n"
            "Applicant: {user_name}, {level} in {field} at {institution}\n"
            "Past work: {past_projects_detail}\n\n"
            "Write now. Specific, measurable goals only."
        ),
    },
    "leadership_experience": {
        "system": (
            "You are a leadership evaluator. TONE: Evidence-based. "
            "OUTPUT: 250-350 words. STAR format.\n\n"
            "RULES:\n"
            "- Narrative specificity: describe ONE vivid moment that captures "
            "your leadership, not a list of roles.\n"
            "- Fact-driven proof: quantify impact."
        ),
        "template": (
            "Write Leadership Experience for:\n"
            "Scholarship: {title} from {provider}\n"
            "Applicant: {user_name}, {level} in {field}, {institution}, {region}\n"
            "Projects: {past_projects_detail}\n\n"
            "Write now. Tell a story, don't list credentials."
        ),
    },
    "recommendation_notes": {
        "system": (
            "You are an academic mentor. TONE: Professional, specific. "
            "OUTPUT: 200-300 words.\n\n"
            "RULES:\n"
            "- Fact-driven proof: specific evidence, not vague praise.\n"
            "- Refutable claims: 'This candidate's work on X demonstrated Y' not "
            "'This candidate is excellent.'"
        ),
        "template": (
            "Write Recommendation Notes for:\n"
            "Scholarship: {title} from {provider}\n"
            "Priorities: {eligibility_summary}\n"
            "Applicant: {user_name}, {level} in {field} at {institution}\n"
            "Research: {past_projects_detail}\n\n"
            "Write now. Specific evidence only."
        ),
    },
    "essay_writing": {
        "system": (
            "You are a scholarship essay specialist.\n\n"
            "TONE: Personal, vivid, persuasive. First person.\n"
            "OUTPUT: 500-600 words. Structure: Hook → Context → Challenge → "
            "Growth → Vision.\n\n"
            "STYLE RULES:\n"
            "1. NARRATIVE SPECIFICITY: Open with a concrete moment, not a "
            "generalization.\n"
            "2. ABT: AND (context) → BUT (tension) → THEREFORE (resolution).\n"
            "3. NO CLICHES: Avoid 'passion,' 'perseverance,' 'resilience.'\n"
            "4. SHOW, DON'T TELL: Describe what happened, not what you feel."
        ),
        "template": (
            "Write a Scholarship Essay for:\n"
            "Award: {title} from {provider}\n"
            "Applicant: {user_name}, {level} in {field} at {institution}\n"
            "Region: {region}\n"
            "Past work: {past_projects_detail}\n\n"
            "Write now. Start with a moment. No cliches."
        ),
    },
}


# ── Research Prompts ─────────────────────────────────────────────────────
# Style guide principles: Cross-Axis Comparison, Intentional Citing,
# Refutable Claims, Synthesis Not Listing

RESEARCH_PROMPTS: dict[str, dict] = {
    "literature_review": {
        "system": (
            "You are a senior researcher writing a literature review.\n\n"
            "TONE: Scholarly, synthesis-oriented, critical.\n"
            "OUTPUT: 400-500 words. Thematic synthesis, not paper-by-paper.\n\n"
            "STYLE RULES (from NotebookLM guide):\n"
            "1. CROSS-AXIS COMPARISON: Compare sources based on their strengths "
            "and weaknesses relative to each other. Example: 'While Brown (1960) "
            "pioneered transactions in this field, their approach is limited by "
            "high memory overhead, a gap this study addresses using a lighter "
            "algorithm.'\n"
            "2. INTENTIONAL CITING: Cite sources incidentally as you explain "
            "concepts, not as the subject of sentences. BAD: 'Smith (2024) found X. "
            "Lee (2025) found Y.' GOOD: 'The challenge of X (Smith, 2024) is "
            "compounded by Y (Lee, 2025).'\n"
            "3. SYNTHESIS, NOT LISTING: Group sources by argument, not by "
            "publication date. At least ONE sentence must explicitly contrast "
            "two or more sources.\n"
            "4. REFUTABLE CLAIMS: Make specific assertions about what the "
            "literature shows or fails to show.\n"
            "5. NEVER LIST CITATIONS SEQUENTIALLY. This is the #1 anti-pattern.\n\n"
            "FEW-SHOT EXAMPLES:\n"
            "Weak: 'Smith (2024) studied X. Lee (2025) studied Y. Patel (2024) "
            "studied Z.'\n"
            "Strong: 'While Smith (2024) demonstrated that X works under controlled "
            "conditions, Lee (2025) shows this finding degrades in real-world "
            "settings — a tension Patel (2024) attributes to ignored ethical "
            "constraints.'\n"
            "Weak: 'The literature shows gaps in the field.'\n"
            "Strong: 'Neither the technical advances of Smith (2024) nor the "
            "ethical frameworks of Patel (2024) address the deployment reality "
            "documented by Lee (2025).'"
        ),
        "template": (
            "Write a Literature Review for:\n"
            "PROPOSAL: {title}\n"
            "RESEARCHER: {user_name}, {field}, {institution}\n"
            "Past work: {past_projects_detail}\n\n"
            "RETRIEVED CITATIONS:\n"
            "{citations_summary}\n\n"
            "Write the review. Synthesize by theme. Compare sources explicitly. "
            "Never list citations sequentially."
        ),
    },
    "hypothesis": {
        "system": (
            "You are a research methodology expert. TONE: Precise, falsifiable. "
            "OUTPUT: 200-300 words.\n\n"
            "RULES:\n"
            "- Refutable claims: hypothesis must be falsifiable.\n"
            "- Active voice: 'We hypothesize,' not 'It is hypothesized.'\n"
            "- Ground in provided literature."
        ),
        "template": (
            "Write Hypothesis & Research Questions for:\n"
            "Proposal: {title}, Researcher: {user_name}, {field}\n"
            "Literature:\n{citations_summary}\n\n"
            "Write now."
        ),
    },
    "methodology": {
        "system": (
            "You are a research methods professor. TONE: Rigorous, reproducible. "
            "OUTPUT: 400-500 words.\n\n"
            "RULES:\n"
            "- Imperative style for procedures.\n"
            "- Justify each choice with literature evidence.\n"
            "- Refutable claims about expected outcomes."
        ),
        "template": (
            "Write Methodology for:\n"
            "Proposal: {title}, Field: {field}, Institution: {institution}\n"
            "Literature:\n{citations_summary}\n\n"
            "Write now."
        ),
    },
    "expected_outcomes": {
        "system": (
            "You are a research impact assessor. TONE: Concrete, measurable. "
            "OUTPUT: 250-350 words.\n\n"
            "RULES:\n"
            "- Refutable claims: specific, measurable outcomes.\n"
            "- Fact-driven proof: cite precedent from literature."
        ),
        "template": (
            "Write Expected Outcomes for:\n"
            "Proposal: {title}, Provider: {provider}, Field: {field}\n\n"
            "Write now."
        ),
    },
    "essay_writing": {
        "system": (
            "You are an academic essay writer for research contexts.\n\n"
            "TONE: Scholarly, analytical, evidence-based.\n"
            "OUTPUT: 400-500 words. Structure: Thesis → Evidence → Analysis → "
            "Implications.\n\n"
            "STYLE RULES:\n"
            "1. REFUTABLE CLAIMS: Make specific assertions.\n"
            "2. INTENTIONAL CITING: Cite incidentally, not as sentence subjects.\n"
            "3. CROSS-AXIS COMPARISON: Contrast viewpoints."
        ),
        "template": (
            "Write a Research Essay for:\n"
            "Topic: {title}\n"
            "Field: {field}, Researcher: {user_name}\n"
            "Citations:\n{citations_summary}\n\n"
            "Write now."
        ),
    },
    "technical_report": {
        "system": (
            "You are a technical report writer for research.\n\n"
            "TONE: Precise, reproducible, structured.\n"
            "OUTPUT: 500-600 words. Sections: Introduction, Methods, Results "
            "(placeholder), Discussion, Conclusions.\n\n"
            "STYLE RULES:\n"
            "1. IMPERATIVE for methods.\n"
            "2. REFUTABLE CLAIMS in discussion.\n"
            "3. Logical figure walkthroughs."
        ),
        "template": (
            "Write a Technical Report for:\n"
            "Project: {title}\n"
            "Field: {field}, Institution: {institution}\n"
            "Researcher: {user_name}\n\n"
            "Write now."
        ),
    },
    "practical_report": {
        "system": (
            "You are a practical/lab report writer.\n\n"
            "TONE: Observational, methodical.\n"
            "OUTPUT: 400-500 words. Sections: Objective, Materials, Procedure, "
            "Observations, Analysis, Conclusions.\n\n"
            "STYLE RULES:\n"
            "1. IMPERATIVE for procedures.\n"
            "2. FACT-DRIVEN for observations.\n"
            "3. Specific quantities and conditions."
        ),
        "template": (
            "Write a Practical Report for:\n"
            "Objective: {title}\n"
            "Field: {field}, Researcher: {user_name}\n\n"
            "Write now."
        ),
    },
}

TRACK_PROMPTS: dict[str, dict[str, dict]] = {
    "grant": GRANT_PROMPTS,
    "scholarship": SCHOLARSHIP_PROMPTS,
    "research": RESEARCH_PROMPTS,
}


# ── Context Enrichment ──────────────────────────────────────────────────

def _build_enriched_context(context: dict) -> dict:
    """Enrich context with formatted summaries for prompt injection."""
    enriched = dict(context)

    eligibility = context.get("eligibility_criteria") or {}
    if eligibility:
        parts = []
        if "degree" in eligibility:
            parts.append(f"Required degree: {eligibility['degree']}")
        if "field" in eligibility:
            parts.append(f"Preferred field: {eligibility['field']}")
        if "gpa" in eligibility:
            parts.append(f"Minimum GPA: {eligibility['gpa']}")
        if "region" in eligibility:
            parts.append(f"Eligible regions: {eligibility['region']}")
        enriched["eligibility_summary"] = "; ".join(parts) if parts else "Open"
    else:
        enriched["eligibility_summary"] = "Open"

    field_tags = context.get("field_tags") or []
    enriched["field_tags"] = ", ".join(field_tags) if field_tags else "interdisciplinary"

    past_projects = context.get("past_projects_raw") or []
    if past_projects:
        details = []
        for p in past_projects[:3]:
            if isinstance(p, dict):
                t = p.get("title", "Untitled")
                y = p.get("year", "n/a")
                o = p.get("outcome", "")
                details.append(f"- \"{t}\" ({y}): {o}" if o else f"- \"{t}\" ({y})")
        enriched["past_projects_detail"] = "\n".join(details) if details else "None"
        enriched["past_projects_first"] = past_projects[0].get("title", "previous work") if past_projects else "previous work"
    else:
        enriched["past_projects_detail"] = context.get("past_projects", "None")
        enriched["past_projects_first"] = context.get("past_projects", "previous work")

    citations = context.get("citations") or []
    if citations:
        cit_lines = []
        for i, c in enumerate(citations[:5], 1):
            if isinstance(c, dict):
                authors = c.get("authors", ["Unknown"])
                year = c.get("year", "n.d.")
                title = c.get("title", "Untitled")
                journal = c.get("journal", "")
                cit_lines.append(f"{i}. {', '.join(authors)} ({year}). {title}. {journal}.")
        enriched["citations_summary"] = "\n".join(cit_lines) if cit_lines else "None"
    else:
        enriched["citations_summary"] = context.get("citations_text", "None")

    enriched["user_name"] = context.get("user_name", "the applicant")
    return enriched


# ── Mock Content Generators ──────────────────────────────────────────────

def _mock_content(section_type: str, track_type: str, context: dict) -> list[str]:
    """Return structured sentences following NotebookLM style principles."""
    e = _build_enriched_context(context)
    title = e.get("title", "this program")
    provider = e.get("provider", "the funding body")
    field = e.get("field", "their field")
    institution = e.get("institution", "their institution")
    level = e.get("level", "graduate student")
    region = e.get("region", "their region")
    user_name = e.get("user_name", "the applicant")
    award = e.get("award_range", "competitive award")
    deadline = e.get("deadline", "TBD")
    field_tags = e.get("field_tags", "")
    past_detail = e.get("past_projects_detail", "no specific projects")
    past_first = e.get("past_projects_first", "previous work")
    citations = e.get("citations_summary", "no citations")
    eligibility = e.get("eligibility_summary", "open")

    sentences: dict[str, list[str]] = {
        # ── GRANT ──
        "technical_approach": [
            f"This project advances {provider}'s mission to strengthen {field_tags} "
            f"capacity — and {user_name}'s track record at {institution} makes her "
            f"the right person to execute it.",

            f"AND: {provider} has identified {field_tags} as priority areas, AND the "
            f"applicant brings doctoral training in {field} with published results "
            f"in high-impact venues. BUT: current approaches in {region} suffer from "
            f"limited computational infrastructure and fragmented data — a gap her "
            f"work directly addresses. THEREFORE, this project proposes a three-phase "
            f"methodology designed for {region}'s specific constraints.",

            f"Phase 1 (Months 1-6): computational framework development and baseline "
            f"establishment at {institution}, using {field_tags} methods validated in "
            f"the applicant's prior work on {past_first}. Phase 2 (Months 7-12): core "
            f"research execution with iterative validation against real-world datasets "
            f"from {region}. Phase 3 (Months 13-18): prototype refinement and "
            f"deliverables for {provider}.",

            f"Validation employs mixed-methods: quantitative benchmarks (accuracy, "
            f"sensitivity, specificity) against existing tools, plus expert review "
            f"from {region}-based collaborators. Risk mitigation includes quarterly "
            f"advisory board reviews aligned with {provider}'s reporting cadence.",

            f"The expected outcome is a validated {field_tags} framework that "
            f"performs at or above state-of-the-art on {region} data — a concrete, "
            f"testable claim this project is designed to prove or refute.",
        ],
        "budget_justification": [
            f"The proposed budget of {award} falls within {provider}'s specified "
            f"range and reflects a lean allocation optimized for research output.",

            f"Personnel (45%): One full-time postdoctoral researcher and partial "
            f"PI salary — justified by the computational complexity of {field} "
            f"analyses requiring dedicated expertise.",

            f"Equipment (15%): High-performance computing resources beyond "
            f"{institution}'s standard clusters, essential for the scale of "
            f"this work.",

            f"Travel (10%): Two conference presentations and one collaborative "
            f"meeting with {provider}-affiliated partners.",

            f"Other Direct Costs (15%): Open-access fees, cloud computing for "
            f"reproducibility, and clinical validation participant costs.",

            f"Indirect Costs (15%): At {institution}'s federally negotiated rate.",
        ],
        "impact_sdg": [
            f"This project advances SDG 4 (Quality Education) by developing "
            f"open-access {field} tools for researchers and practitioners "
            f"across {region}.",

            f"It also contributes to SDG 9 (Innovation) through novel analytical "
            f"frameworks aligned with {provider}'s identified priorities.",

            f"A third contribution maps to SDG 3 (Good Health) via clinical "
            f"applications for underserved populations in {region}.",

            f"In our pilot work, 80% of regional collaborators reported that "
            f"existing tools fail in their contexts — demonstrating a specific, "
            f"measurable unmet need this project addresses.",
        ],
        "project_timeline": [
            f"Phase 1 (Months 1-6): Literature synthesis, tool development, "
            f"baseline establishment. Deliverable: Technical specification. "
            f"Go/no-go: advisory board review at month 6.",

            f"Phase 2 (Months 7-12): Core research execution, iterative data "
            f"collection. Deliverable: Working prototype, interim report to "
            f"{provider}.",

            f"Phase 3 (Months 13-18): Advanced analysis, validation studies. "
            f"Deliverable: Two peer-reviewed submissions.",

            f"Phase 4 (Months 19-24): Dissemination, policy briefs, final "
            f"reporting. Deliverable: Open-source toolkit, policy document, "
            f"final report.",

            f"All deliverables submit before {provider}'s 12-month and "
            f"24-month reporting deadlines.",
        ],
        "essay_writing": [
            f"{provider}'s call for {field_tags} research identifies a gap that "
            f"{user_name} has spent her career at {institution} working to close.",

            f"AND: She has published in high-impact venues and led collaborative "
            f"projects in {region}. BUT: The tools she and her peers have built "
            f"consistently underperform when deployed outside laboratory conditions "
            f" — a problem the field has acknowledged but not solved. THEREFORE, "
            f"this project proposes a deployment-first methodology that inverts "
            f"the typical research sequence.",

            f"Instead of building in the lab and testing in the field, she will "
            f"co-design with {region} health workers from day one — ensuring the "
            f"final product meets the constraints of the contexts where it's "
            f"most needed.",

            f"The expected outcome is a validated framework that performs at or "
            f"above state-of-the-art on {region} data, plus a methodology "
            f"blueprint other {field} teams can replicate.",

            f"This is not just a research project. It's a direct investment in "
            f"{provider}'s mission: building {field} capacity where it matters "
            f"most.",
        ],
        "technical_report": [
            f"Introduction: {field} methods have shown promise in healthcare "
            f"applications, but deployment in {region} remains limited by "
            f"infrastructure constraints.",

            f"Methods: This study employs a three-phase design: framework "
            f"development at {institution}, iterative validation with {region} "
            f"datasets, and benchmarking against existing tools.",

            f"Data Collection: [To be completed during project execution. "
            f"Minimum 10,000 labeled cases across 3 sites in {region}.]",

            f"Analysis: Paired statistical comparisons with Bonferroni "
            f"correction. Primary endpoint: diagnostic accuracy vs. "
            f"state-of-the-art baseline.",

            f"Discussion: The methodology addresses the gap between bench-top "
            f"performance and deployment reality identified in the literature.",

            f"Conclusions: This report establishes the protocol for a study "
            f"designed to produce refutable evidence about {field} performance "
            f"in {region}.",
        ],
        "practical_report": [
            f"Objective: Evaluate {field} methods for healthcare applications "
            f"in {region} under realistic deployment conditions.",

            f"Materials: Computational resources at {institution}, clinical "
            f"datasets from {region} partners, benchmark comparison tools.",

            f"Procedure: (1) Configure baseline models using validated "
            f"architectures. (2) Run against {region} test datasets. "
            f"(3) Record accuracy, latency, and resource consumption.",

            f"Observations: [To be completed during execution. Expected: "
            f"performance degradation in low-resource settings consistent "
            f"with prior findings.]",

            f"Analysis: Compare observed performance against published "
            f"benchmarks. Quantify degradation magnitude.",

            f"Conclusions: [To be completed. Will document whether "
            f"context-adapted methods maintain clinically acceptable "
            f"performance thresholds.]",
        ],
        # ── SCHOLARSHIP ──
        "personal_statement": [
            f"The morning I watched my mother choose between bus fare and "
            f"breakfast for my sister, I understood that poverty isn't abstract — "
            f"it's a series of impossible calculations. That moment, in {region}, "
            f"is why I study {field}.",

            f"AND: I've spent three years at {institution} building the skills to "
            f"change this. My work on {past_first} {past_detail.split(':')[-1].strip() if ':' in past_detail else ''} — "
            f"but the real lesson wasn't technical. It was watching a prototype "
            f"fail in the field because we'd built it for lab conditions, not for "
            f"the clinics where it was needed most.",

            f"BUT: Every tool I've built has taught me something the next one "
            f"needs. The gap between what works in theory and what works in "
            f"{region} is not a failure — it's the problem worth solving. "
            f"THEREFORE, I'm applying to {title} at {provider} because this "
            f"scholarship funds the specific work my community needs.",

            f"When my paper on {past_first} was accepted, I felt relief — then "
            f"realized the harder work was just starting: getting these findings "
            f"into the hands of people who could use them.",

            f"This scholarship isn't financial support. It's the bridge between "
            f"where I am and where that work requires me to be.",
        ],
        "academic_goals": [
            f"Short-term (1-2 years): Publish findings from {past_first} in a "
            f"top-tier venue by Q4 of Year 1. Complete advanced {field} coursework "
            f"at {institution} with focus on {region}-specific applications.",

            f"Medium-term (3-5 years): Launch an independent research program "
            f"producing 3-5 publications and one validated tool with documented "
            f"deployment in {region}.",

            f"Long-term (5+ years): Lead an interdisciplinary team at the "
            f"intersection of {field} and {region} healthcare, with {provider}'s "
            f"support as the foundation.",

            f"Without {title}, I would need to pursue commercially viable but "
            f"less impactful work. This scholarship is the specific enabler.",
        ],
        "leadership_experience": [
            f"On {past_first}, I coordinated a team of four across two "
            f"institutions. The moment that defined my leadership philosophy "
            f"came when a junior researcher proposed an approach I initially "
            f"dismissed — and it turned out to be the breakthrough our project "
            f"needed.",

            f"I learned that day that leadership isn't about having the best "
            f"ideas. It's about creating conditions where better ideas can "
            f"emerge from anyone on the team.",

            f"Beyond formal roles, I started a workshop series in {region} that "
            f"reached 150+ researchers. Three of those workshops led to "
            f"collaborative projects — proof that distributed ownership works.",

            f"I will bring this model to the {provider} community: contribute "
            f"my perspective on building research teams in resource-constrained "
            f"settings, while learning from peers whose work challenges my "
            f"assumptions.",
        ],
        "recommendation_notes": [
            f"Academic Excellence: {user_name} does not merely perform well — "
            f"she reframes problems. Her work on {past_first} at {institution} "
            f"changed how our group thinks about {field} in {region}.",

            f"Research Potential: This is not a one-time success. She "
            f"consistently identifies the question behind the question — the "
            f"gap that others miss. That habit is rare and valuable.",

            f"Character: What distinguishes {user_name} is her commitment to "
            f"making {field} accessible. She invested significant time mentoring "
            f"junior researchers — not for career advancement, but because she "
            f"believes the field is stronger when more people participate.",

            f"Fit for {title}: Given {provider}'s priorities, her {field} "
            f"expertise at {institution}, combined with demonstrated leadership "
            f"in {region}, makes her an exceptional candidate.",
        ],
        "essay_writing": [
            f"The morning I watched my mother choose between bus fare and "
            f"breakfast, I understood that poverty isn't a statistic — it's a "
            f"series of impossible calculations.",

            f"AND: I've spent three years at {institution} building skills in "
            f"{field} to change this. BUT: Every tool I've built has failed in "
            f"the field — because we designed for labs, not for the clinics "
            f"where they're needed. THEREFORE, I'm applying to {title} at "
            f"{provider} to fund the specific work my community requires.",

            f"My paper on {past_first} was accepted last year. I felt relief — "
            f"then realized the harder work was just starting: getting findings "
            f"into the hands of people who could use them.",

            f"This scholarship isn't financial support. It's the bridge between "
            f"where I am and where that work requires me to be.",
        ],
        # ── RESEARCH ──
        "literature_review": [
            f"The application of {field} methods to healthcare in {region} "
            f"generates significant promise, yet a critical tension persists "
            f"between technical capability and deployment reality.",

            f"Osei et al. (2024) demonstrated that deep learning architectures "
            f"achieve high accuracy in diagnostic applications under controlled "
            f"conditions. However, this finding is directly challenged by Chen "
            f"& Wang (2025), who show that transfer learning models trained on "
            f"high-resource data degrade substantially in the low-resource "
            f"settings characteristic of {region} — undermining the "
            f"generalizability of Osei et al.'s results.",

            f"The tension deepens when Patel & Singh (2024) reframe the problem "
            f"entirely: even technically successful AI tools may fail if deployed "
            f"without robust ethical frameworks. Their analysis suggests the gap "
            f"between Osei et al.'s optimism and Chen & Wang's caution is not "
            f"merely technical but structural — current research optimizes for "
            f"accuracy metrics that don't align with {region} health system "
            f"priorities.",

            f"Adeyemi & Brown (2023) provide the epidemiological grounding, "
            f"documenting drug-resistant pathogen patterns in West Africa that "
            f"make computational surveillance both urgent and uniquely "
            f"challenging. Their work establishes the public health need while "
            f"highlighting a methodological gap: neither the technical advances "
            f"of Osei et al. nor the ethical frameworks of Patel & Singh "
            f"directly address how to build surveillance systems for contexts "
            f"where data is sparse and fragmented.",

            f"This project occupies precisely that gap. By combining the "
            f"computational methods validated by Osei et al. with the "
            f"deployment-aware design principles advocated by Patel & Singh, "
            f"and grounding the work in the epidemiological reality documented "
            f"by Adeyemi & Brown, we aim to produce tools that are both "
            f"technically sound and contextually appropriate for {region}.",
        ],
        "hypothesis": [
            f"We hypothesize that context-adapted {field} methods will maintain "
            f"diagnostic accuracy above 85% when transferred from high-resource "
            f"training data to {region} clinical datasets — a specific, testable "
            f"claim that would refute the pessimism of Chen & Wang (2025) if "
            f"confirmed.",

            f"Primary research question: How can {field} techniques be "
            f"systematically adapted to maintain performance when deployed in "
            f"low-resource settings?",

            f"Secondary questions: (1) Which representational features in "
            f"training data predict transfer degradation? (2) Can domain "
            f"adaptation reduce degradation below clinically acceptable "
            f"thresholds?",

            f"This framework is grounded in the transfer learning literature "
            f"and specifically in the gap identified by Chen & Wang (2025) "
            f"regarding African health contexts.",
        ],
        "methodology": [
            f"This study employs a sequential mixed-methods design in three "
            f"phases.",

            f"Phase 1 (Data Curation): Assemble multi-site datasets from "
            f"clinical partners in {region}, ensuring representation across "
            f"the geographic variables Adeyemi & Brown (2023) identify as "
            f"critical. Minimum 10,000 labeled cases across 3 sites.",

            f"Phase 2 (Model Development): Train baseline models using "
            f"architectures from Osei et al. (2024), then systematically "
            f"evaluate domain adaptation techniques to address the degradation "
            f"documented by Chen & Wang (2025). Analysis: paired statistical "
            f"comparisons with Bonferroni correction.",

            f"Phase 3 (Validation): Clinical validation with {region} health "
            f"workers, incorporating the ethical framework from Patel & Singh "
            f"(2024). Semi-structured interviews with 15+ clinicians.",

            f"Ethical considerations: IRB approval at {institution}, informed "
            f"consent for low-literacy populations, data governance agreements "
            f"with all sites.",
        ],
        "expected_outcomes": [
            f"First, methodological: 2-3 peer-reviewed publications on domain "
            f"adaptation techniques that maintain accuracy across resource "
            f"settings — directly addressing the tension between Osei et al.'s "
            f"(2024) results and Chen & Wang's (2025) concerns.",

            f"Second, practical: an open-source toolkit with documented "
            f"performance in {region}, designed for deployment by health "
            f"ministries. This addresses the 'last mile' problem identified by "
            f"Patel & Singh (2024).",

            f"Third, policy: a brief for {provider} and {region} governance "
            f"bodies on infrastructure requirements for responsible AI "
            f"deployment, drawing on Adeyemi & Brown (2023).",

            f"Dissemination: conference presentations, open-access datasets, "
            f"and partnerships with regional health organizations.",
        ],
        "essay_writing": [
            f"The challenge of deploying {field} tools in {region} is not "
            f"technical — it's structural.",

            f"AND: Osei et al. (2024) showed these methods work in controlled "
            f"settings. Chen & Wang (2025) showed they fail in the field. "
            f"BUT: Neither addresses the deployment infrastructure gap. "
            f"THEREFORE, this project inverts the typical sequence: we build "
            f"with {region} health workers from day one.",

            f"Patel & Singh (2024) argue that even successful AI tools fail "
            f"without ethical frameworks. We take this further: the framework "
            f"must be co-designed, not imposed.",

            f"This is not a research project that might someday help people. "
            f"It's a deployment project that starts with people and works "
            f"backward to the research.",
        ],
        "technical_report": [
            f"Introduction: {field} methods show promise for healthcare in "
            f"{region}, but deployment remains limited.",

            f"Methods: Three-phase design: framework development at "
            f"{institution}, validation with {region} datasets, benchmarking "
            f"against published baselines.",

            f"Results: [To be completed during execution.]",

            f"Discussion: The methodology addresses the gap between Osei et al.'s "
            f"(2024) bench-top results and Chen & Wang's (2025) deployment "
            f"concerns.",

            f"Conclusions: This protocol establishes a reproducible approach "
            f"for evaluating {field} in {region} contexts.",
        ],
        "practical_report": [
            f"Objective: Evaluate {field} methods under realistic {region} "
            f"deployment conditions.",

            f"Materials: {institution} computational resources, {region} "
            f"clinical datasets, benchmark tools.",

            f"Procedure: (1) Configure baseline models. (2) Run against "
            f"{region} test data. (3) Record accuracy, latency, resources.",

            f"Observations: [To be completed during execution.]",

            f"Analysis: Compare against published benchmarks. Quantify "
            f"performance degradation.",

            f"Conclusions: [To be completed. Will document whether "
            f"context-adapted methods maintain acceptable thresholds.]",
        ],
    }

    return sentences.get(section_type, [
        f"This section addresses {section_type.replace('_', ' ')} for "
        f"\"{title}\" sponsored by {provider}.",
        f"The applicant's background in {field} at {institution} provides "
        f"a foundation for this work.",
    ])


# ── Streaming Generator ──────────────────────────────────────────────────

async def generate_section_stream(
    section_type: str,
    track_type: str,
    context: dict,
):
    """Async generator that yields SSE-formatted text chunks."""
    content_sentences = _mock_content(section_type, track_type, context)

    full_text = " ".join(content_sentences)
    words = full_text.split()

    chunk_size = random.randint(2, 5)
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i : i + chunk_size])
        if i + chunk_size < len(words):
            chunk += " "
        yield f"data: {chunk}\n\n"
        await asyncio.sleep(0.05)

    yield "data: [DONE]\n\n"
