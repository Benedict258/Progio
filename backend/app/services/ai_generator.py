import asyncio
import random
import json


# ── Grant Prompts ─────────────────────────────────────────────────────────
# Principle: Specificity over Generosity — constrain to technical proposal shape
# Principle: Context Injection — inject eligibility_criteria, field_tags, deadline
# Principle: Output Format Constraints — explicit structure, word count, tone

GRANT_PROMPTS: dict[str, dict] = {
    "technical_approach": {
        "system": (
            "You are a senior grants officer at a major research funding agency. "
            "Your role is to help applicants write technically rigorous proposals. "
            "TONE: Formal, precise, hypothesis-driven. "
            "OUTPUT FORMAT: 300-400 words. Use headers: Background, Objectives, "
            "Methodology, Expected Outcomes. Write in third person."
        ),
        "template": (
            "Write a Technical Approach section for the following grant opportunity:\n\n"
            "OPPORTUNITY:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- Eligibility: {eligibility_summary}\n"
            "- Field Tags: {field_tags}\n"
            "- Deadline: {deadline}\n"
            "- Award Range: {award_range}\n\n"
            "APPLICANT PROFILE:\n"
            "- Name: {user_name}\n"
            "- Institution: {institution}\n"
            "- Field of Study: {field}\n"
            "- Level: {level}\n"
            "- Region: {region}\n"
            "- Past Projects: {past_projects_detail}\n\n"
            "REQUIREMENTS:\n"
            "1. Background: Why this research matters, grounded in the opportunity's stated priorities\n"
            "2. Objectives: 2-3 specific, measurable objectives aligned with {provider}'s goals\n"
            "3. Methodology: Step-by-step technical approach with justification for each choice\n"
            "4. Expected Outcomes: Concrete deliverables tied to the opportunity's criteria\n\n"
            "CONSTRAINTS:\n"
            "- Reference the opportunity's eligibility criteria explicitly\n"
            "- Align methodology with the stated field tags\n"
            "- Do NOT use generic placeholder text\n"
            "- Write as if this is a real proposal for THIS specific opportunity"
        ),
    },
    "budget_justification": {
        "system": (
            "You are a grants financial officer who reviews budget justifications. "
            "TONE: Precise, evidence-based, cost-conscious. "
            "OUTPUT FORMAT: 250-350 words. Use headers: Personnel, Equipment, "
            "Travel, Other Direct Costs, Indirect Costs. Include dollar ranges."
        ),
        "template": (
            "Write a Budget Justification for the following grant:\n\n"
            "OPPORTUNITY:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- Award Range: {award_range}\n"
            "- Eligibility: {eligibility_summary}\n\n"
            "APPLICANT:\n"
            "- Institution: {institution}\n"
            "- Field: {field}\n"
            "- Level: {level}\n\n"
            "REQUIREMENTS:\n"
            "1. Personnel: Roles, time allocation, justification for each position\n"
            "2. Equipment: Specific items needed, why they are essential\n"
            "3. Travel: Conference visits, field work, collaborative meetings\n"
            "4. Other Direct Costs: Materials, publications, participant costs\n"
            "5. Indirect Costs: At institutional rate\n\n"
            "CONSTRAINTS:\n"
            "- Total must fit within {award_range}\n"
            "- Each line item must have a clear justification tied to project objectives\n"
            "- Use realistic cost estimates for the applicant's region ({region})"
        ),
    },
    "impact_sdg": {
        "system": (
            "You are a UN SDG policy advisor reviewing grant proposals for alignment "
            "with the Sustainable Development Goals. "
            "TONE: Policy-oriented, evidence-based, globally aware. "
            "OUTPUT FORMAT: 200-300 words. Identify 2-3 specific SDGs with targets."
        ),
        "template": (
            "Write an Impact & SDG Alignment section for:\n\n"
            "OPPORTUNITY:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- Field Tags: {field_tags}\n\n"
            "PROJECT CONTEXT:\n"
            "- Field: {field}\n"
            "- Institution: {institution}\n"
            "- Region: {region}\n\n"
            "REQUIREMENTS:\n"
            "1. Identify 2-3 specific SDGs (with target numbers if possible)\n"
            "2. For each SDG: explain the causal pathway from project activities to outcomes\n"
            "3. Include measurable indicators (quantitative where possible)\n"
            "4. Reference {provider}'s stated priorities from the opportunity\n\n"
            "CONSTRAINTS:\n"
            "- Be specific to THIS project, not generic SDG language\n"
            "- Include both direct and indirect contributions\n"
            "- Mention the geographic relevance to {region}"
        ),
    },
    "project_timeline": {
        "system": (
            "You are a project management specialist for academic research. "
            "TONE: Structured, milestone-driven, realistic. "
            "OUTPUT FORMAT: 250-350 words. Use a phase-based structure with "
            "specific deliverables and dependencies."
        ),
        "template": (
            "Write a Project Timeline for:\n\n"
            "OPPORTUNITY:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- Deadline: {deadline}\n\n"
            "PROJECT:\n"
            "- Field: {field}\n"
            "- Institution: {institution}\n\n"
            "REQUIREMENTS:\n"
            "1. Phase 1 (Months 1-6): Setup, literature review, baseline\n"
            "2. Phase 2 (Months 7-12): Core research execution\n"
            "3. Phase 3 (Months 13-18): Analysis, validation\n"
            "4. Phase 4 (Months 19-24): Dissemination, reporting\n\n"
            "For each phase include:\n"
            "- Key deliverables (specific, not vague)\n"
            "- Dependencies on previous phases\n"
            "- Go/no-go decision points\n"
            "- Risk mitigation milestones\n\n"
            "CONSTRAINTS:\n"
            "- Timeline must be realistic for the scope\n"
            "- Include reporting deadlines for {provider}\n"
            "- Account for {region}-specific considerations (e.g., academic calendar)"
        ),
    },
}

# ── Scholarship Prompts ──────────────────────────────────────────────────
# Principle: Domain Knowledge Injection — personal statement tone
# Principle: Dynamic Prompt Population — inject real profile data

SCHOLARSHIP_PROMPTS: dict[str, dict] = {
    "personal_statement": {
        "system": (
            "You are a scholarship selection committee member at a prestigious institution. "
            "You evaluate personal statements for authenticity, depth, and alignment with "
            "the scholarship's mission. "
            "TONE: Personal, reflective, authentic. First person. "
            "OUTPUT FORMAT: 400-500 words. Narrative structure with a clear arc: "
            "origin → challenge → growth → vision."
        ),
        "template": (
            "Write a Personal Statement for:\n\n"
            "SCHOLARSHIP:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- Eligibility: {eligibility_summary}\n\n"
            "APPLICANT PROFILE (write as THIS person):\n"
            "- Name: {user_name}\n"
            "- Institution: {institution}\n"
            "- Field of Study: {field}\n"
            "- Level: {level}\n"
            "- Region: {region}\n"
            "- Funding Needs: {funding_needs}\n"
            "- Past Projects: {past_projects_detail}\n\n"
            "NARRATIVE STRUCTURE:\n"
            "1. Opening Hook: A specific moment or experience that sparked their passion\n"
            "2. Journey: How their background in {region} shaped their perspective\n"
            "3. Challenges: Concrete obstacles they overcame (financial, academic, personal)\n"
            "4. Growth: What they learned from {past_projects_first}\n"
            "5. Vision: How this scholarship enables their specific future goals\n\n"
            "CONSTRAINTS:\n"
            "- Write in FIRST PERSON as {user_name}\n"
            "- Reference specific experiences from their past projects\n"
            "- Explain WHY this specific scholarship from {provider} matters to THEM\n"
            "- Be authentic, not generic — no clichés like 'since childhood I always...'\n"
            "- Connect their {field} expertise to broader impact"
        ),
    },
    "academic_goals": {
        "system": (
            "You are an academic advisor helping a student articulate their research "
            "and career trajectory. "
            "TONE: Ambitious but grounded, specific, forward-looking. "
            "OUTPUT FORMAT: 300-400 words. Use headers: Short-term (1-2 years), "
            "Medium-term (3-5 years), Long-term (5+ years)."
        ),
        "template": (
            "Write Academic Goals for:\n\n"
            "SCHOLARSHIP:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n\n"
            "APPLICANT:\n"
            "- Name: {user_name}\n"
            "- Level: {level}\n"
            "- Field: {field}\n"
            "- Institution: {institution}\n"
            "- Past Projects: {past_projects_detail}\n\n"
            "REQUIREMENTS:\n"
            "1. Short-term: Specific coursework, research objectives, skill development\n"
            "2. Medium-term: Publication targets, conference presentations, collaborations\n"
            "3. Long-term: Career vision, leadership aspirations, field contributions\n\n"
            "CONSTRAINTS:\n"
            "- Goals must be SPECIFIC and MEASURABLE (not 'advance the field')\n"
            "- Show how {provider}'s scholarship is the CRITICAL enabler\n"
            "- Reference their existing work in {past_projects_first}\n"
            "- Goals must be realistic for a {level} in {field}"
        ),
    },
    "leadership_experience": {
        "system": (
            "You are a leadership development evaluator for competitive scholarships. "
            "TONE: Evidence-based, impact-focused, specific. "
            "OUTPUT FORMAT: 250-350 words. Use STAR format: Situation, Task, Action, Result."
        ),
        "template": (
            "Write Leadership Experience for:\n\n"
            "SCHOLARSHIP:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n\n"
            "APPLICANT:\n"
            "- Name: {user_name}\n"
            "- Level: {level}\n"
            "- Field: {field}\n"
            "- Institution: {institution}\n"
            "- Region: {region}\n"
            "- Past Projects: {past_projects_detail}\n\n"
            "REQUIREMENTS:\n"
            "1. 2-3 specific leadership examples using STAR format\n"
            "2. Each example must show: what they did, how they did it, what changed\n"
            "3. Quantify impact where possible (people led, events organized, funds raised)\n"
            "4. Connect leadership to their {field} expertise\n\n"
            "CONSTRAINTS:\n"
            "- Use SPECIFIC examples, not generic claims\n"
            "- Show leadership in {region} context where relevant\n"
            "- Demonstrate how leadership connects to scholarship values\n"
            "- Include both formal roles and informal initiative-taking"
        ),
    },
    "recommendation_notes": {
        "system": (
            "You are an academic mentor helping a student prepare recommendation materials. "
            "TONE: Professional, specific, advocacy-oriented. "
            "OUTPUT FORMAT: 200-300 words. Use headers: Academic Excellence, "
            "Research Potential, Character, Fit for Award."
        ),
        "template": (
            "Write Recommendation Notes for:\n\n"
            "SCHOLARSHIP:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- What they value: {eligibility_summary}\n\n"
            "APPLICANT:\n"
            "- Name: {user_name}\n"
            "- Level: {level}\n"
            "- Field: {field}\n"
            "- Institution: {institution}\n"
            "- Past Projects: {past_projects_detail}\n\n"
            "REQUIREMENTS:\n"
            "1. Academic Excellence: Class rank, specific achievements, intellectual qualities\n"
            "2. Research Potential: Evidence from {past_projects_first}, methodology skills\n"
            "3. Character: Personal qualities, resilience, collaboration\n"
            "4. Fit for Award: Why THIS candidate for THIS scholarship from {provider}\n\n"
            "CONSTRAINTS:\n"
            "- Write as if recommending to {provider}'s selection committee\n"
            "- Use SPECIFIC evidence, not vague praise\n"
            "- Address the scholarship's stated priorities\n"
            "- Include concrete examples from their research in {field}"
        ),
    },
}

# ── Research Prompts ─────────────────────────────────────────────────────
# Principle: Citation-Aware Generation — inject retrieved papers BEFORE generation
# Principle: Explicit Constraint Setting — literature-grounded writing

RESEARCH_PROMPTS: dict[str, dict] = {
    "literature_review": {
        "system": (
            "You are a senior researcher writing a literature review section. "
            "You must ground every claim in the provided citations. "
            "TONE: Scholarly, synthesis-oriented, critical. "
            "OUTPUT FORMAT: 400-500 words. Use thematic synthesis, not paper-by-paper summary. "
            "Cite sources using (Author, Year) format."
        ),
        "template": (
            "Write a Literature Review for:\n\n"
            "RESEARCH PROPOSAL:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n\n"
            "RESEARCHER:\n"
            "- Field: {field}\n"
            "- Institution: {institution}\n"
            "- Past Projects: {past_projects_detail}\n\n"
            "RETRIEVED CITATIONS (use these as the evidence base):\n"
            "{citations_summary}\n\n"
            "REQUIREMENTS:\n"
            "1. Synthesize THEMATICALLY, not paper-by-paper\n"
            "2. Every claim must reference a citation from the list above\n"
            "3. Identify 2-3 clear gaps in the literature\n"
            "4. Position this research as filling those specific gaps\n\n"
            "STRUCTURE:\n"
            "- Opening: State the broad area and its importance\n"
            "- Theme 1: [Synthesize findings from relevant citations]\n"
            "- Theme 2: [Synthesize findings from relevant citations]\n"
            "- Gap Analysis: What remains unexplored?\n"
            "- Positioning: How this research addresses the gaps\n\n"
            "CONSTRAINTS:\n"
            "- ONLY cite papers from the provided list (do not invent citations)\n"
            "- Use Author, Year format for all references\n"
            "- Be critical, not just descriptive — evaluate quality and limitations\n"
            "- 400-500 words maximum"
        ),
    },
    "hypothesis": {
        "system": (
            "You are a research methodology expert who helps formulate testable hypotheses. "
            "TONE: Precise, falsifiable, theoretically grounded. "
            "OUTPUT FORMAT: 200-300 words. State primary hypothesis, 2-3 sub-questions, "
            "and theoretical framework."
        ),
        "template": (
            "Write Hypothesis & Research Questions for:\n\n"
            "PROPOSAL:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n\n"
            "RESEARCHER:\n"
            "- Field: {field}\n"
            "- Past Projects: {past_projects_detail}\n\n"
            "RETRIEVED CONTEXT:\n"
            "{citations_summary}\n\n"
            "REQUIREMENTS:\n"
            "1. Primary Hypothesis: One clear, testable statement\n"
            "2. Sub-questions: 2-3 questions that operationalize the hypothesis\n"
            "3. Theoretical Framework: Which theories/models ground this study\n"
            "4. Justification: Why this hypothesis matters for {field}\n\n"
            "CONSTRAINTS:\n"
            "- Hypothesis must be FALSIFIABLE (not vague goals)\n"
            "- Ground in the literature provided above\n"
            "- Use precise, measurable variables\n"
            "- 200-300 words maximum"
        ),
    },
    "methodology": {
        "system": (
            "You are a research methods professor reviewing a methodology section. "
            "TONE: Rigorous, reproducible, justified. "
            "OUTPUT FORMAT: 400-500 words. Use standard methodology structure: "
            "Design, Participants, Materials, Procedure, Analysis, Ethics."
        ),
        "template": (
            "Write Methodology for:\n\n"
            "PROPOSAL:\n"
            "- Title: {title}\n"
            "- Field: {field}\n"
            "- Institution: {institution}\n\n"
            "LITERATURE CONTEXT:\n"
            "{citations_summary}\n\n"
            "REQUIREMENTS:\n"
            "1. Research Design: Type of study, rationale for design choice\n"
            "2. Participants/Sample: Target population, sampling strategy, power analysis\n"
            "3. Materials: Instruments, measures, tools — with justification\n"
            "4. Procedure: Step-by-step data collection process\n"
            "5. Analysis: Statistical/analytical methods, software\n"
            "6. Ethics: IRB considerations, informed consent, data protection\n\n"
            "CONSTRAINTS:\n"
            "- Justify EACH methodological choice with literature evidence\n"
            "- Reference the retrieved citations for methodological precedent\n"
            "- Ensure reproducibility — another researcher could follow these steps\n"
            "- Address validity threats specific to {field}\n"
            "- 400-500 words maximum"
        ),
    },
    "expected_outcomes": {
        "system": (
            "You are a research impact assessor evaluating proposals for funding agencies. "
            "TONE: Concrete, measurable, forward-looking. "
            "OUTPUT FORMAT: 250-350 words. Use headers: Contributions, Applications, "
            "Dissemination, Impact."
        ),
        "template": (
            "Write Expected Outcomes for:\n\n"
            "PROPOSAL:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- Field: {field}\n\n"
            "RESEARCH CONTEXT:\n"
            "{citations_summary}\n\n"
            "REQUIREMENTS:\n"
            "1. Contributions: What new knowledge will this produce?\n"
            "2. Applications: How can practitioners use the results?\n"
            "3. Dissemination: Where and how will findings be shared?\n"
            "4. Impact: Broader significance for {field} and society\n\n"
            "CONSTRAINTS:\n"
            "- Outcomes must be SPECIFIC and MEASURABLE\n"
            "- Reference the gaps identified in the literature review\n"
            "- Include both academic outputs (papers, datasets) and practical outputs\n"
            "- 250-350 words maximum"
        ),
    },
}

TRACK_PROMPTS: dict[str, dict[str, dict]] = {
    "grant": GRANT_PROMPTS,
    "scholarship": SCHOLARSHIP_PROMPTS,
    "research": RESEARCH_PROMPTS,
}


# ── Context Enrichment ──────────────────────────────────────────────────
# Principle: Dynamic Prompt Population — 80% dynamic, 20% static

def _build_enriched_context(context: dict) -> dict:
    """Enrich context with formatted summaries for prompt injection."""
    enriched = dict(context)

    # Build eligibility summary from raw criteria
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
        enriched["eligibility_summary"] = "; ".join(parts) if parts else "Open to all qualified applicants"
    else:
        enriched["eligibility_summary"] = "Open to all qualified applicants"

    # Format field tags
    field_tags = context.get("field_tags") or []
    enriched["field_tags"] = ", ".join(field_tags) if field_tags else "interdisciplinary"

    # Format past projects with full details
    past_projects = context.get("past_projects_raw") or []
    if past_projects:
        details = []
        for p in past_projects[:3]:  # Limit to 3 most recent
            if isinstance(p, dict):
                title = p.get("title", "Untitled")
                year = p.get("year", "n/a")
                outcome = p.get("outcome", "")
                details.append(f"- \"{title}\" ({year}): {outcome}" if outcome else f"- \"{title}\" ({year})")
        enriched["past_projects_detail"] = "\n".join(details) if details else "No specific projects listed"
        enriched["past_projects_first"] = past_projects[0].get("title", "previous work") if past_projects else "previous work"
    else:
        enriched["past_projects_detail"] = context.get("past_projects", "No specific projects listed")
        enriched["past_projects_first"] = context.get("past_projects", "previous work")

    # Format citations for research prompts
    citations = context.get("citations") or []
    if citations:
        cit_lines = []
        for i, c in enumerate(citations[:5], 1):  # Top 5 citations
            if isinstance(c, dict):
                authors = c.get("authors", ["Unknown"])
                year = c.get("year", "n.d.")
                title = c.get("title", "Untitled")
                journal = c.get("journal", "")
                cit_lines.append(f"{i}. {authors[0] if authors else 'Unknown'} ({year}). {title}. {journal}.")
        enriched["citations_summary"] = "\n".join(cit_lines) if cit_lines else "No citations available"
    else:
        enriched["citations_summary"] = context.get("citations_text", "No citations available — use general knowledge")

    # Add user name for personal prompts
    enriched["user_name"] = context.get("user_name", "the applicant")

    return enriched


# ── Mock Content Generators ──────────────────────────────────────────────
# Principle: Few-Shot Examples — content follows exact structure from prompts

def _mock_content(section_type: str, track_type: str, context: dict) -> list[str]:
    """Return structured sentences for the given section, following the prompt constraints."""
    enriched = _build_enriched_context(context)
    title = enriched.get("title", "this program")
    provider = enriched.get("provider", "the funding body")
    field = enriched.get("field", "their field")
    institution = enriched.get("institution", "their institution")
    level = enriched.get("level", "graduate student")
    region = enriched.get("region", "their region")
    user_name = enriched.get("user_name", "the applicant")
    award = enriched.get("award_range", "competitive award")
    deadline = enriched.get("deadline", "TBD")
    eligibility = enriched.get("eligibility_summary", "open")
    field_tags = enriched.get("field_tags", "")
    past_detail = enriched.get("past_projects_detail", "no specific projects")
    citations = enriched.get("citations_summary", "no citations available")

    sentences: dict[str, list[str]] = {
        # ── GRANT SECTIONS ──
        "technical_approach": [
            f"This proposal addresses the priorities outlined by {provider} in the call for {field_tags} research.",
            f"Based on {eligibility}, {user_name} at {institution} brings the required expertise to execute this project.",
            f"The methodology follows a three-phase design: (1) requirements analysis aligned with {provider}'s criteria, "
            f"(2) iterative development at {institution}, and (3) validated prototypes tested against benchmarks.",
            f"We employ mixed-methods validation combining quantitative metrics with expert review, ensuring "
            f"reproducible results that meet {provider}'s quality standards.",
            f"Risk mitigation includes contingency protocols, quarterly milestone checkpoints, and an advisory board "
            f"review at month 12 — aligned with {deadline} reporting requirements.",
        ],
        "budget_justification": [
            f"The total requested budget of {award} is allocated across five categories to maximize impact.",
            f"Personnel (45%): One full-time research assistant and partial PI salary, justified by the "
            f"methodological complexity required for {field} research.",
            f"Equipment (15%): High-performance computing resources essential for {field} analysis, "
            f"with institutional cost-sharing at {institution}.",
            f"Travel (10%): Two conference presentations and one collaborative meeting with {provider}-funded partners.",
            f"Other Direct Costs (15%): Publication fees, materials, and participant costs for validation studies.",
            f"Indirect Costs (15%): At the standard institutional rate for {institution}.",
        ],
        "impact_sdg": [
            f"This project directly advances SDG 4 (Quality Education) by developing open-access {field} tools "
            f"that benefit educators and students in {region}.",
            f"Secondary contribution to SDG 9 (Innovation) through novel analytical frameworks applicable to "
            f"challenges identified by {provider}.",
            f"Measurable indicators: (1) Number of tools deployed, (2) Users trained, "
            f"(3) Policy recommendations submitted to relevant bodies in {region}.",
            f"Alignment with {provider}'s stated priority: {field_tags}.",
        ],
        "project_timeline": [
            f"Phase 1 (Months 1-6): Literature synthesis, tool development, and baseline establishment at {institution}. "
            f"Deliverable: Technical specification document.",
            f"Phase 2 (Months 7-12): Core research execution with iterative data collection and preliminary analysis. "
            f"Deliverable: Working prototype and interim report to {provider}.",
            f"Phase 3 (Months 13-18): Advanced analysis, validation studies, and manuscript preparation. "
            f"Deliverable: 2 peer-reviewed submissions.",
            f"Phase 4 (Months 19-24): Knowledge dissemination, policy briefs, and final reporting to {provider}. "
            f"Deliverable: Final report and open-source toolkit.",
        ],
        # ── SCHOLARSHIP SECTIONS ──
        "personal_statement": [
            f"My journey in {field} began with a specific observation: the gap between theoretical advances and "
            f"real-world application in {region}.",
            f"At {institution}, I have pursued this question through {past_detail}, which taught me both the "
            f"technical skills and the resilience needed for impactful research.",
            f"Growing up in {region}, I witnessed how limited access to {field} resources shapes communities' "
            f"trajectories — this experience drives my commitment to equitable solutions.",
            f"The {title} from {provider} represents not just financial support, but validation that my vision "
            f"for {field} has broader significance.",
            f"My goal is to leverage this opportunity to create lasting change in how {field} is practiced "
            f"and valued in {region}.",
        ],
        "academic_goals": [
            f"Short-term (1-2 years): Complete advanced coursework in {field} at {institution} and publish "
            f"findings from {past_detail} in a peer-reviewed venue.",
            f"Medium-term (3-5 years): Establish a research program focused on {field} applications for "
            f"challenges specific to {region}, with 3-5 publications in top-tier journals.",
            f"Long-term (5+ years): Lead an interdisciplinary team tackling {field} challenges, with {provider}'s "
            f"scholarship as the foundation for this trajectory.",
            f"This {level} program is the critical enabler — without the financial support from {title}, "
            f"these goals remain out of reach.",
        ],
        "leadership_experience": [
            f"As lead researcher on {past_detail}, I coordinated a team of 4 researchers across "
            f"2 institutions at {institution}.",
            f"I initiated a community workshop series in {region} that brought {field} education to "
            f"underserved audiences, reaching 150+ participants over 6 months.",
            f"My leadership approach centers on collaborative empowerment — creating environments "
            f"where diverse perspectives strengthen the research output.",
            f"These experiences demonstrate my readiness to contribute to the {provider} community "
            f"as both a scholar and a leader.",
        ],
        "recommendation_notes": [
            f"Academic Excellence: {user_name} consistently performs in the top tier of their cohort at "
            f"{institution} in {field}.",
            f"Research Potential: Their work on {past_detail} shows original thinking, methodological rigor, "
            f"and the ability to execute complex projects independently.",
            f"Character: Demonstrated resilience, intellectual curiosity, and genuine commitment to mentoring "
            f"junior students in {field}.",
            f"Fit for {title}: Their background in {region} and expertise in {field} align directly with "
            f"{provider}'s mission and the scholarship's stated priorities.",
        ],
        # ── RESEARCH SECTIONS ──
        "literature_review": [
            f"The field of {field} has seen significant advances, yet fundamental gaps remain in "
            f"applying these methods to challenges in {region}.",
            f"Recent studies demonstrate the potential of {field} approaches, but limited research has "
            f"explored their application in resource-constrained contexts — precisely the gap this work addresses.",
            f"A critical gap exists at the intersection of {field} and {region}-specific methodologies, "
            f"which is the space this research occupies.",
            f"By building on established foundations while introducing novel approaches, this study "
            f"positions itself at the cutting edge of {field} research.",
            f"The retrieved literature supports this positioning: {citations}.",
        ],
        "hypothesis": [
            f"We hypothesize that integrating {field} approaches with {region}-specific adaptations "
            f"will yield significant improvements over current state-of-the-art methods.",
            f"Primary research question: How can {field} techniques be systematically adapted to address "
            f"the specific challenges identified in {region}?",
            f"Secondary questions examine boundary conditions, scalability, and practical applicability "
            f"across different contexts within {field}.",
            f"This theoretical framework draws on established models while extending them through "
            f"interdisciplinary integration grounded in {citations}.",
        ],
        "methodology": [
            f"This study adopts a sequential mixed-methods design, combining quantitative experiments "
            f"with qualitative evaluation in the {field} domain.",
            f"Data collection follows a stratified sampling approach, ensuring representation across "
            f"key variables identified in our literature review ({citations}).",
            f"Quantitative analysis employs established statistical methods, while qualitative data "
            f"will be analyzed using thematic analysis with inter-rater reliability checks.",
            f"Ethical considerations include informed consent, data anonymization, and IRB approval "
            f"at {institution}.",
        ],
        "expected_outcomes": [
            f"We anticipate producing 2-3 peer-reviewed publications in top {field} journals within "
            f"18 months of project completion.",
            f"Practical outcomes include an open-source toolkit and best-practice guidelines that "
            f"practitioners in {field} can immediately adopt.",
            f"Policy implications include evidence-based recommendations for {provider} and stakeholders "
            f"on scaling {field} interventions in {region}.",
            f"Knowledge dissemination will extend through conference presentations, webinars, and "
            f"a dedicated project website for open access to all findings.",
        ],
    }

    return sentences.get(section_type, [
        f"This section provides a detailed overview of {section_type.replace('_', ' ')} "
        f"for the application titled \"{title}\" sponsored by {provider}.",
        f"The applicant's background in {field} at {institution} provides a strong foundation "
        f"for addressing the objectives outlined in this proposal.",
        f"Key considerations include alignment with the program's priorities, "
        f"demonstrated expertise, and the potential for meaningful impact.",
        f"By leveraging their experience as a {level} in {region}, the applicant "
        f"is well-positioned to deliver exceptional results.",
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
