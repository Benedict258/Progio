import asyncio
import random


# ── Grant Prompts ─────────────────────────────────────────────────────────

GRANT_PROMPTS: dict[str, dict] = {
    "technical_approach": {
        "system": (
            "You are a senior grants officer at a major research funding agency. "
            "TONE: Formal, precise, hypothesis-driven. Third person.\n\n"
            "OUTPUT FORMAT: 300-400 words. Use headers: Background, Objectives, "
            "Methodology, Expected Outcomes.\n\n"
            "CRITICAL RULES:\n"
            "- NEVER restate field labels or raw values verbatim (e.g., do NOT write "
            "'Required degree: PhD or equivalent' — instead weave it as 'The applicant "
            "holds the requisite doctoral qualifications').\n"
            "- Integrate structured data as narrative justification, not as bullet dumps.\n"
            "- Every claim must be grounded in the specific opportunity or applicant data.\n\n"
            "FEW-SHOT EXAMPLES (target tone):\n"
            "Good: 'The applicant's doctoral training in genomics at a leading African "
            "institution positions her to address the computational challenges central to "
            "this call.'\n"
            "Bad: 'Required degree: PhD. The applicant has a PhD.'\n"
            "Good: 'This project targets the intersection of machine learning and pathogen "
            "surveillance — precisely the priority area identified in the funding brief.'\n"
            "Bad: 'Field tags include machine learning and pathogen surveillance.'"
        ),
        "template": (
            "Write a Technical Approach section for the following grant opportunity.\n\n"
            "OPPORTUNITY:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- Eligibility: {eligibility_summary}\n"
            "- Field Tags: {field_tags}\n"
            "- Deadline: {deadline}\n"
            "- Award Range: {award_range}\n\n"
            "APPLICANT:\n"
            "- Name: {user_name}\n"
            "- Institution: {institution}\n"
            "- Field: {field}\n"
            "- Level: {level}\n"
            "- Region: {region}\n"
            "- Past Projects: {past_projects_detail}\n\n"
            "Write the section now. Weave all data into natural prose — never dump raw "
            "field labels or structured values into the output."
        ),
    },
    "budget_justification": {
        "system": (
            "You are a grants financial officer. TONE: Precise, evidence-based. "
            "OUTPUT FORMAT: 250-350 words. Use headers: Personnel, Equipment, Travel, "
            "Other Direct Costs, Indirect Costs.\n\n"
            "RULES:\n"
            "- NEVER write 'Award range: $X — fit total within that range' as a sentence. "
            "Instead: 'The proposed budget of $X falls within the funder's specified range.'\n"
            "- Each line item must have a justification tied to project objectives.\n"
            "- Use realistic costs for the applicant's region."
        ),
        "template": (
            "Write a Budget Justification for:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- Award Range: {award_range}\n"
            "- Applicant: {user_name}, {institution}, {field}\n"
            "- Region: {region}\n\n"
            "Write the section now. No raw field labels in the output."
        ),
    },
    "impact_sdg": {
        "system": (
            "You are a UN SDG policy advisor. TONE: Policy-oriented, evidence-based. "
            "OUTPUT FORMAT: 200-300 words. Identify 2-3 specific SDGs.\n\n"
            "RULES:\n"
            "- Never write 'Field tags: X, Y, Z'. Instead: 'The project's focus on X and Y "
            "directly advances...'\n"
            "- Be specific to THIS project, not generic SDG language."
        ),
        "template": (
            "Write Impact & SDG Alignment for:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- Field: {field}\n"
            "- Region: {region}\n"
            "- Focus areas: {field_tags}\n\n"
            "Write the section now."
        ),
    },
    "project_timeline": {
        "system": (
            "You are a project management specialist. TONE: Structured, milestone-driven. "
            "OUTPUT FORMAT: 250-350 words. Phase-based with deliverables.\n\n"
            "RULES:\n"
            "- Never write 'Deadline: 2026-09-15' as a sentence. Instead: 'All deliverables "
            "must be submitted before the September 2026 reporting deadline.'"
        ),
        "template": (
            "Write a Project Timeline for:\n"
            "- Title: {title}\n"
            "- Provider: {provider}\n"
            "- Deadline: {deadline}\n"
            "- Field: {field}\n"
            "- Institution: {institution}\n\n"
            "Write the section now."
        ),
    },
}


# ── Scholarship Prompts ──────────────────────────────────────────────────

SCHOLARSHIP_PROMPTS: dict[str, dict] = {
    "personal_statement": {
        "system": (
            "You are a scholarship selection committee member at a prestigious institution. "
            "TONE: Personal, reflective, authentic. First person.\n\n"
            "OUTPUT FORMAT: 400-500 words. Narrative arc: origin → challenge → growth → vision.\n\n"
            "CRITICAL RULES:\n"
            "- NEVER restate structured data as labels. Do NOT write 'Past projects include: "
            "X (2024): outcome Y'. Instead, weave project details into the narrative: "
            "'My 2024 study on X resulted in Y, which taught me...'\n"
            "- Write IN CHARACTER as the applicant — use 'I', 'my', 'we'.\n"
            "- Reference specific experiences, not generic claims.\n\n"
            "FEW-SHOT EXAMPLES:\n"
            "Good: 'My 2024 study on genomic surveillance, which informed WHO policy on "
            "drug-resistant pathogens, revealed a deeper challenge...'\n"
            "Bad: 'Past projects: Genomic Surveillance of Drug-Resistant Pathogens (2023): "
            "WHO-funded, led to policy change.'\n"
            "Good: 'As a PhD student at the University of Ghana, I've spent three years "
            "confronting the computational barriers that limit healthcare in West Africa.'\n"
            "Bad: 'Institution: University of Ghana. Level: PhD. Region: West Africa.'"
        ),
        "template": (
            "Write a Personal Statement for:\n\n"
            "SCHOLARSHIP: {title} from {provider}\n"
            "ELIGIBILITY: {eligibility_summary}\n\n"
            "APPLICANT (write AS this person):\n"
            "- Name: {user_name}\n"
            "- Institution: {institution}\n"
            "- Field: {field}\n"
            "- Level: {level}\n"
            "- Region: {region}\n"
            "- Past Projects: {past_projects_detail}\n"
            "- Funding Needs: {funding_needs}\n\n"
            "Write in first person. Weave all details into natural narrative — no structured "
            "data dumps, no field labels, no bullet points in prose."
        ),
    },
    "academic_goals": {
        "system": (
            "You are an academic advisor. TONE: Ambitious but grounded. "
            "OUTPUT FORMAT: 300-400 words. Short-term / Medium-term / Long-term.\n\n"
            "RULES:\n"
            "- Never write 'Level: Masters' or 'Field: X'. Instead: 'As a masters student "
            "in X...' or 'Building on my training in X...'"
        ),
        "template": (
            "Write Academic Goals for:\n"
            "- Scholarship: {title} from {provider}\n"
            "- Applicant: {user_name}, {level} in {field} at {institution}\n"
            "- Past work: {past_projects_detail}\n\n"
            "Write the section now. Natural prose only."
        ),
    },
    "leadership_experience": {
        "system": (
            "You are a leadership evaluator. TONE: Evidence-based, impact-focused. "
            "OUTPUT FORMAT: 250-350 words. STAR format.\n\n"
            "RULES:\n"
            "- Never list project titles as data. Instead, describe what you DID in those "
            "projects and what CHANGED as a result."
        ),
        "template": (
            "Write Leadership Experience for:\n"
            "- Scholarship: {title} from {provider}\n"
            "- Applicant: {user_name}, {level} in {field} at {institution}, {region}\n"
            "- Projects: {past_projects_detail}\n\n"
            "Write the section now."
        ),
    },
    "recommendation_notes": {
        "system": (
            "You are an academic mentor. TONE: Professional, advocacy-oriented. "
            "OUTPUT FORMAT: 200-300 words.\n\n"
            "RULES:\n"
            "- Never state the scholarship's eligibility criteria as a list. Instead: "
            "'Given the scholarship's emphasis on X, this candidate's experience in Y makes "
            "them an ideal fit.'"
        ),
        "template": (
            "Write Recommendation Notes for:\n"
            "- Scholarship: {title} from {provider}\n"
            "- Their priorities: {eligibility_summary}\n"
            "- Applicant: {user_name}, {level} in {field} at {institution}\n"
            "- Research: {past_projects_detail}\n\n"
            "Write the section now."
        ),
    },
}


# ── Research Prompts ─────────────────────────────────────────────────────

RESEARCH_PROMPTS: dict[str, dict] = {
    "literature_review": {
        "system": (
            "You are a senior researcher writing a literature review. "
            "TONE: Scholarly, synthesis-oriented, critical.\n\n"
            "OUTPUT FORMAT: 400-500 words. Thematic synthesis, not paper-by-paper listing.\n\n"
            "CRITICAL RULES:\n"
            "- NEVER list citations sequentially (e.g., 'Author1 (2024) found X. Author2 (2025) "
            "found Y.'). This is the #1 anti-pattern.\n"
            "- INSTEAD: Synthesize by THEME. Compare, contrast, and identify tensions between "
            "sources. At least ONE sentence must explicitly contrast two or more cited works.\n"
            "- Use (Author, Year) citation format.\n"
            "- Every claim must reference a citation from the provided list.\n\n"
            "FEW-SHOT EXAMPLES:\n"
            "Good: 'While Osei et al. (2024) demonstrated that deep learning can achieve "
            "92% accuracy in malaria detection under controlled conditions, Chen & Wang (2025) "
            "caution that transfer learning models trained on high-resource data degrade "
            "significantly when deployed in sub-Saharan African settings — a tension this "
            "project directly addresses.'\n"
            "Bad: 'Osei et al. (2024) studied malaria detection. Chen & Wang (2025) studied "
            "transfer learning. Patel & Singh (2024) discussed ethics.'\n"
            "Good: 'A critical gap emerges when comparing the technical optimism of Chen & "
            "Wang (2025) with the ethical caution of Patel & Singh (2024): neither addresses "
            "how to implement AI diagnostics in health systems with limited digital "
            "infrastructure.'\n"
            "Bad: 'The literature shows gaps in the field.'"
        ),
        "template": (
            "Write a Literature Review for:\n\n"
            "PROPOSAL: {title}\n"
            "RESEARCHER: {user_name}, {field}, {institution}\n"
            "Past work: {past_projects_detail}\n\n"
            "RETRIEVED CITATIONS:\n"
            "{citations_summary}\n\n"
            "Write the review now. Synthesize thematically, compare sources explicitly, "
            "identify gaps. Never list citations sequentially."
        ),
    },
    "hypothesis": {
        "system": (
            "You are a research methodology expert. TONE: Precise, falsifiable. "
            "OUTPUT FORMAT: 200-300 words. Hypothesis, sub-questions, framework.\n\n"
            "RULES:\n"
            "- Hypothesis must be falsifiable, not a vague goal.\n"
            "- Ground in the provided literature."
        ),
        "template": (
            "Write Hypothesis & Research Questions for:\n"
            "- Proposal: {title}\n"
            "- Researcher: {user_name}, {field}\n"
            "- Literature context:\n{citations_summary}\n\n"
            "Write now."
        ),
    },
    "methodology": {
        "system": (
            "You are a research methods professor. TONE: Rigorous, reproducible. "
            "OUTPUT FORMAT: 400-500 words. Design, Sample, Materials, Procedure, "
            "Analysis, Ethics.\n\n"
            "RULES:\n"
            "- Justify each methodological choice with literature evidence.\n"
            "- Reference retrieved citations for methodological precedent."
        ),
        "template": (
            "Write Methodology for:\n"
            "- Proposal: {title}\n"
            "- Field: {field}\n"
            "- Institution: {institution}\n"
            "- Literature:\n{citations_summary}\n\n"
            "Write now."
        ),
    },
    "expected_outcomes": {
        "system": (
            "You are a research impact assessor. TONE: Concrete, measurable. "
            "OUTPUT FORMAT: 250-350 words.\n\n"
            "RULES:\n"
            "- Outcomes must be specific and measurable, not aspirational."
        ),
        "template": (
            "Write Expected Outcomes for:\n"
            "- Proposal: {title}\n"
            "- Provider: {provider}\n"
            "- Field: {field}\n\n"
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
        enriched["eligibility_summary"] = "; ".join(parts) if parts else "Open to all qualified applicants"
    else:
        enriched["eligibility_summary"] = "Open to all qualified applicants"

    field_tags = context.get("field_tags") or []
    enriched["field_tags"] = ", ".join(field_tags) if field_tags else "interdisciplinary"

    past_projects = context.get("past_projects_raw") or []
    if past_projects:
        details = []
        for p in past_projects[:3]:
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
        enriched["citations_summary"] = "\n".join(cit_lines) if cit_lines else "No citations available"
    else:
        enriched["citations_summary"] = context.get("citations_text", "No citations available")

    enriched["user_name"] = context.get("user_name", "the applicant")

    return enriched


# ── Mock Content Generators ──────────────────────────────────────────────

def _mock_content(section_type: str, track_type: str, context: dict) -> list[str]:
    """Return structured sentences for the given section."""
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
    field_tags = enriched.get("field_tags", "")
    past_detail = enriched.get("past_projects_detail", "no specific projects")
    past_first = enriched.get("past_projects_first", "previous work")
    citations = enriched.get("citations_summary", "no citations available")
    eligibility = enriched.get("eligibility_summary", "open")

    sentences: dict[str, list[str]] = {
        # ── GRANT SECTIONS ──
        "technical_approach": [
            f"This proposal responds directly to {provider}'s call for advancing "
            f"{field_tags} research — priorities that align with {user_name}'s established "
            f"expertise at {institution}.",

            f"The applicant's doctoral training in {field} and demonstrated track record — "
            f"including {past_first} — provides the technical foundation required for this "
            f"scope of work. Her qualifications satisfy the funder's requirements for "
            f"independent investigators with publication records in high-impact venues.",

            f"The methodology proceeds in three phases. Phase 1 (Months 1-6): computational "
            f"framework development and baseline establishment at {institution}, informed by "
            f"a systematic review of {field_tags} approaches. Phase 2 (Months 7-12): core "
            f"research execution with iterative validation against real-world datasets from "
            f"{region}. Phase 3 (Months 13-18): prototype refinement, benchmarking against "
            f"state-of-the-art, and preparation of deliverables for {provider}.",

            f"Validation employs a mixed-methods approach: quantitative performance metrics "
            f"(accuracy, sensitivity, specificity) benchmarked against existing tools, "
            f"supplemented by expert review from collaborators in {region}. This dual "
            f"validation strategy ensures reproducibility and clinical relevance.",

            f"Risk mitigation is embedded at each phase gate. A quarterly advisory board "
            f"review — the first at month 6, aligned with {provider}'s interim reporting "
            f"cadence — provides course-correction opportunity. Contingency protocols "
            f"address data access disruptions, a known challenge in {region}-based research.",
        ],
        "budget_justification": [
            f"The proposed total of {award} reflects a lean, focused budget designed to "
            f"maximize research output per dollar invested. Personnel costs (45%) cover one "
            f"full-time postdoctoral researcher and partial salary support for {user_name}, "
            f"justified by the computational complexity of the {field} analyses.",

            f"Equipment (15%) funds dedicated high-performance computing resources essential "
            f"for training and validating the models proposed — standard GPU clusters "
            f"available at {institution} are insufficient for the scale of this work.",

            f"Travel (10%) supports two conference presentations and one in-person "
            f"collaborative meeting with {provider}-affiliated partners, enabling "
            f"knowledge transfer and early-stage feedback on preliminary results.",

            f"Other Direct Costs (15%) include open-access publication fees, cloud computing "
            f"for reproducibility, and participant costs for validation studies with "
            f"clinical partners in {region}.",

            f"Indirect Costs (15%) are calculated at {institution}'s federally negotiated "
            f"rate, covering facilities, administration, and shared infrastructure.",
        ],
        "impact_sdg": [
            f"This project directly advances SDG 4 (Quality Education) by developing "
            f"open-access {field} tools and training materials that will benefit "
            f"researchers and practitioners across {region}.",

            f"The work also contributes to SDG 9 (Innovation) through the creation of "
            f"novel analytical frameworks that address the specific computational "
            f"challenges identified by {provider} in their funding priorities.",

            f"A third contribution maps to SDG 3 (Good Health) via the clinical "
            f"applications of the {field_tags} research outputs, particularly for "
            f"underserved populations in {region}.",

            f"Measurable indicators include: (1) open-source tools deployed with "
            f"documented adoption, (2) researchers trained through associated workshops, "
            f"and (3) policy recommendations submitted to relevant governance bodies.",
        ],
        "project_timeline": [
            f"Phase 1 (Months 1-6): Literature synthesis, tool development, and baseline "
            f"establishment. Deliverable: Technical specification document and initial "
            f"prototype architecture. Go/no-go: advisory board review at month 6.",

            f"Phase 2 (Months 7-12): Core research execution with iterative data collection "
            f"and preliminary analysis. Deliverable: Working prototype validated on "
            f"benchmark datasets, interim report to {provider}.",

            f"Phase 3 (Months 13-18): Advanced analysis, validation studies with clinical "
            f"partners, and manuscript preparation. Deliverable: Two peer-reviewed "
            f"submissions to top-tier {field} venues.",

            f"Phase 4 (Months 19-24): Knowledge dissemination, policy briefs, final "
            f"reporting. Deliverable: Open-source toolkit release, policy document for "
            f"{region} stakeholders, and final report to {provider}.",

            f"Critical dependencies: Phase 2 cannot begin without Phase 1's technical "
            f"specification; Phase 3 requires Phase 2's validated prototype. Reporting "
            f"deadlines align with {provider}'s 12-month and 24-month milestones.",
        ],
        # ── SCHOLARSHIP SECTIONS ──
        "personal_statement": [
            f"Growing up in {region}, I watched my mother navigate a healthcare system "
            f"that lacked the computational tools to track disease outbreaks in real time. "
            f"That experience — watching a preventable crisis unfold because data arrived "
            f"too late — is what drew me to {field}.",

            f"At {institution}, I've spent the past three years building the skills to "
            f"change that. My 2024 project on {past_first} showed me both the promise and "
            f"the complexity of applying {field} methods in resource-limited settings. "
            f"That work, which {past_detail.split(':')[-1].strip() if ':' in past_detail else 'received strong recognition'}, "
            f"taught me that the hardest problems aren't technical — they're about "
            f"access, equity, and making sure the tools we build actually reach the "
            f"communities that need them.",

            f"I've also learned that meaningful change requires more than papers. Through "
            f"community workshops and mentoring junior researchers, I've seen how "
            f"capacity-building amplifies the impact of any single research project.",

            f"The {title} from {provider} represents more than financial support. It's "
            f"recognition that the questions I'm asking — about how {field} can serve "
            f"underserved populations — matter. With this scholarship, I can dedicate "
            f"my full attention to the work that my community needs, without the "
            f"financial constraints that have shaped every decision I've made so far.",

            f"My goal is specific: I want to build {field} tools that work in the "
            f"contexts where they're most needed, starting with {region}. This "
            f"scholarship is the bridge between where I am and where that work requires "
            f"me to be.",
        ],
        "academic_goals": [
            f"Short-term (1-2 years): Complete advanced coursework in {field} at "
            f"{institution}, with a focus on the computational methods most relevant "
            f"to challenges in {region}. I plan to publish findings from {past_first} "
            f"in a high-impact venue, establishing a foundation for my doctoral research.",

            f"Medium-term (3-5 years): Launch an independent research program at the "
            f"intersection of {field} and {region}-specific applications. Target: 3-5 "
            f"publications in top-tier journals, one of which will present a validated "
            f"tool or framework with documented real-world deployment.",

            f"Long-term (5+ years): Lead an interdisciplinary team focused on equitable "
            f"{field} innovation, with {provider}'s support as the foundation for this "
            f"trajectory. I aim to establish a lab that bridges computational research "
            f"and clinical implementation in {region}.",

            f"The {title} from {provider} is the critical enabler. Without the financial "
            f"security it provides, I would need to compromise on research scope or "
            f"pursue commercially viable but less impactful work.",
        ],
        "leadership_experience": [
            f"As lead researcher on {past_first}, I coordinated a team of four across "
            f"two institutions at {institution}. That project taught me that leadership "
            f"in research isn't about directing — it's about creating conditions where "
            f"diverse expertise produces better outcomes than any individual could alone.",

            f"Beyond formal roles, I initiated a community workshop series in {region} "
            f"that brought {field} methods to researchers who lacked access to formal "
            f"training. Over six months, we reached 150+ participants, and three of "
            f"those workshops directly led to collaborative projects.",

            f"My leadership philosophy centers on what I call 'distributed ownership' — "
            f"giving team members genuine authority over their domains while maintaining "
            f"alignment on shared goals. This approach proved especially effective when "
            f"navigating the logistical challenges of cross-institutional research.",

            f"I am eager to bring this leadership model to the {provider} community, "
            f"where the caliber of peers would challenge me to grow while contributing "
            f"my perspective on building research teams in resource-constrained settings.",
        ],
        "recommendation_notes": [
            f"Academic Excellence: {user_name} consistently demonstrates the intellectual "
            f"rigor and independent thinking that distinguish exceptional candidates. "
            f"Her work in {field} at {institution} reflects both technical mastery and "
            f"the ability to frame research questions that matter.",

            f"Research Potential: {past_first} — the project title speaks for itself — "
            f"showed original thinking, methodological sophistication, and the ability "
            f"to execute complex work independently. The outcomes (recognition and "
            f"impact) confirm this wasn't a one-time success.",

            f"Character: What sets {user_name} apart is her commitment to making {field} "
            f"accessible. She has invested significant time in mentoring and community "
            f"building — not because it advances her career, but because she believes "
            f"the field is stronger when more people can participate.",

            f"Fit for {title}: Given {provider}'s emphasis on {eligibility.split(';')[0].strip() if ';' in eligibility else 'academic excellence and impact'}, "
            f"{user_name}'s background in {field} at {institution}, combined with her "
            f"demonstrated leadership and vision for {region}, makes her an exceptional "
            f"candidate for this award.",
        ],
        # ── RESEARCH SECTIONS ──
        "literature_review": [
            f"The application of {field} methods to healthcare challenges in {region} "
            f"has generated significant promise, yet a critical tension persists in the "
            f"literature between technical capability and deployment reality.",

            f"Osei et al. (2024) demonstrated that deep learning architectures can "
            f"achieve high accuracy in diagnostic applications, establishing a technical "
            f"ceiling that suggests the methods are mature enough for clinical deployment. "
            f"However, this optimism is complicated by Chen & Wang's (2025) finding that "
            f"transfer learning models trained on high-resource data degrade substantially "
            f"when applied to the low-resource settings characteristic of {region} — a "
            f"direct challenge to the generalizability of Osei et al.'s results.",

            f"This tension between bench-top performance and real-world applicability "
            f"is further sharpened by Patel & Singh (2024), who argue that even technically "
            f"successful AI health tools may fail if deployed without robust ethical "
            f"frameworks. Their analysis suggests that the gap is not merely technical "
            f"but structural: current AI health research optimizes for accuracy metrics "
            f"that may not align with the priorities of health systems in {region}.",

            f"Adeyemi & Brown (2023) provide the epidemiological grounding for this "
            f"project, documenting the specific drug-resistant pathogen patterns in "
            f"West Africa that make computational surveillance both urgent and uniquely "
            f"challenging. Their work establishes the public health need while "
            f"implicitly highlighting the methodological gap: neither the technical "
            f"advances of Osei et al. nor the ethical frameworks of Patel & Singh "
            f"directly address how to build surveillance systems for contexts where "
            f"data is sparse, fragmented, and geographically uneven.",

            f"This project occupies precisely that gap. By combining the computational "
            f"methods validated by Osei et al. with the deployment-aware design "
            f"principles advocated by Patel & Singh, and grounding the work in the "
            f"epidemiological reality documented by Adeyemi & Brown, we aim to produce "
            f"tools that are both technically sound and contextually appropriate for "
            f"the health systems of {region}.",
        ],
        "hypothesis": [
            f"We hypothesize that integrating {field} approaches with context-specific "
            f"adaptations for {region} will yield statistically significant improvements "
            f"over models trained exclusively on high-resource data — specifically, "
            f"we predict a minimum 30% improvement in diagnostic accuracy when evaluated "
            f"on {region}-sourced datasets.",

            f"Primary research question: How can {field} techniques be systematically "
            f"adapted to maintain performance when transferred from high-resource training "
            f"environments to the low-resource deployment contexts characteristic of "
            f"{region}?",

            f"Secondary questions include: (1) What representational features in training "
            f"data most strongly predict performance degradation in transfer contexts? "
            f"(2) Can domain adaptation methods developed for {field} reduce this "
            f"degradation below clinically acceptable thresholds?",

            f"This framework is grounded in the transfer learning literature, which "
            f"establishes both the potential and the limitations of cross-domain "
            f"adaptation — and specifically in the gap identified by Chen & Wang (2025) "
            f"regarding African health contexts.",
        ],
        "methodology": [
            f"This study employs a sequential mixed-methods design, structured in three "
            f"phases to systematically address the transfer learning challenges identified "
            f"in the literature.",

            f"Phase 1 (Data Curation): We will assemble a multi-site dataset from "
            f"clinical partners in {region}, ensuring representation across the "
            f"geographic and demographic variables that Adeyemi & Brown (2023) identify "
            f"as critical for surveillance accuracy. Sample size: minimum 10,000 "
            f"labeled cases across 3 sites.",

            f"Phase 2 (Model Development): We will train baseline models using the "
            f"architectures validated by Osei et al. (2024), then systematically "
            f"evaluate domain adaptation techniques to address the performance "
            f"degradation documented by Chen & Wang (2025). Analysis: paired "
            f"statistical comparisons with Bonferroni correction.",

            f"Phase 3 (Validation): Clinical validation with health workers in "
            f"{region}, incorporating the ethical framework proposed by Patel & Singh "
            f"(2024) to assess not just technical performance but deployment readiness. "
            f"Qualitative evaluation using semi-structured interviews with 15+ "
            f"clinicians.",

            f"Ethical considerations include IRB approval at {institution}, informed "
            f"consent protocols adapted for low-literacy populations, and data "
            f"governance agreements with all participating sites in {region}.",
        ],
        "expected_outcomes": [
            f"We anticipate three primary categories of output. First, methodological "
            f"contributions: 2-3 peer-reviewed publications documenting novel domain "
            f"adaptation techniques that maintain diagnostic accuracy across resource "
            f"settings — directly addressing the gap between Osei et al.'s (2024) "
            f"bench-top results and Chen & Wang's (2025) deployment concerns.",

            f"Second, practical tools: an open-source diagnostic toolkit with documented "
            f"performance characteristics in {region} contexts, designed for deployment "
            f"by health ministries and NGOs. This addresses the 'last mile' problem "
            f"identified by Patel & Singh (2024) — ensuring technically successful "
            f"research translates into deployable solutions.",

            f"Third, policy impact: a policy brief for {provider} and {region} "
            f"governance bodies articulating the specific infrastructure and training "
            f"requirements for responsible AI deployment in low-resource health systems. "
            f"This draws directly on the structural challenges documented by Adeyemi "
            f"& Brown (2023).",

            f"Knowledge dissemination will include conference presentations, a dedicated "
            f"project website with open-access datasets, and partnerships with regional "
            f"health organizations to ensure findings reach practitioners, not just "
            f"researchers.",
        ],
    }

    return sentences.get(section_type, [
        f"This section addresses {section_type.replace('_', ' ')} for the application "
        f"titled \"{title}\" sponsored by {provider}.",
        f"The applicant's background in {field} at {institution} provides a strong "
        f"foundation for addressing the objectives outlined in this proposal.",
        f"Key considerations include alignment with the program's priorities, "
        f"demonstrated expertise, and the potential for meaningful impact.",
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
