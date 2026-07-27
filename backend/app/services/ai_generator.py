import asyncio
import random


# ── Prompt templates per track ───────────────────────────────────────────

GRANT_PROMPTS: dict[str, dict] = {
    "technical_approach": {
        "system": (
            "You are a professional grant writer. Write a compelling technical approach section "
            "for a research grant proposal. Use formal academic language and cite methodologies."
        ),
        "template": (
            "Write a technical approach section for a grant application titled \"{title}\" "
            "funded by {provider}. The applicant studies {field} at {institution} and is a {level}. "
            "Their past projects include: {past_projects}. "
            "Include: methodology overview, technical implementation plan, expected milestones, "
            "and risk mitigation strategies."
        ),
    },
    "budget_justification": {
        "system": (
            "You are a grants management specialist. Write a clear budget justification "
            "that aligns costs with project objectives and demonstrates value for money."
        ),
        "template": (
            "Write a budget justification for a grant application titled \"{title}\" "
            "funded by {provider} with award range {award_range}. "
            "The applicant studies {field} at {institution}. "
            "Include: personnel costs, equipment, travel, materials, and indirect costs "
            "with clear justification for each category."
        ),
    },
    "impact_sdg": {
        "system": (
            "You are an SDG policy analyst. Write a section demonstrating how the proposed "
            "project contributes to the UN Sustainable Development Goals."
        ),
        "template": (
            "Write an impact and SDG alignment section for a grant titled \"{title}\" "
            "funded by {provider}. The project is in the field of {field}. "
            "Identify 2-3 relevant SDGs and explain how the project outcomes directly "
            "contribute to achieving them, including measurable indicators."
        ),
    },
    "project_timeline": {
        "system": (
            "You are a project planner for academic grants. Write a realistic project "
            "timeline with clear milestones and deliverables."
        ),
        "template": (
            "Write a project timeline for a grant titled \"{title}\" funded by {provider}. "
            "The project involves {field} research at {institution}. "
            "Include quarterly milestones for a 24-month period with key deliverables "
            "at each stage and dependencies between phases."
        ),
    },
}

SCHOLARSHIP_PROMPTS: dict[str, dict] = {
    "personal_statement": {
        "system": (
            "You are an admissions counselor at a top university. Write a compelling "
            "personal statement that highlights the applicant's unique journey and motivation."
        ),
        "template": (
            "Write a personal statement for a scholarship application to \"{title}\" "
            "offered by {provider}. The applicant is a {level} studying {field} "
            "at {institution} in {region}. Their funding needs include: {funding_needs}. "
            "Highlight personal motivation, challenges overcome, and future aspirations."
        ),
    },
    "academic_goals": {
        "system": (
            "You are an academic advisor. Write a section outlining clear, ambitious "
            "academic goals that align with the scholarship's objectives."
        ),
        "template": (
            "Write an academic goals section for a scholarship titled \"{title}\" "
            "offered by {provider}. The applicant is a {level} in {field} at {institution}. "
            "Their past projects include: {past_projects}. "
            "Outline short-term and long-term academic objectives and how this scholarship "
            "will enable them."
        ),
    },
    "leadership_experience": {
        "system": (
            "You are a leadership development specialist. Write a section showcasing "
            "the applicant's leadership qualities and community impact."
        ),
        "template": (
            "Write a leadership experience section for a scholarship titled \"{title}\" "
            "offered by {provider}. The applicant is a {level} in {field} at {institution}. "
            "Include examples of leadership roles, community involvement, initiative-taking, "
            "and measurable impact on their community."
        ),
    },
    "recommendation_notes": {
        "system": (
            "You are an academic mentor. Write concise notes that recommenders can use "
            "as reference when writing recommendation letters."
        ),
        "template": (
            "Write recommendation letter notes for a scholarship titled \"{title}\" "
            "offered by {provider}. The applicant is a {level} in {field} at {institution}. "
            "Their past projects include: {past_projects}. "
            "Provide key talking points about academic excellence, research potential, "
            "character, and suitability for this specific award."
        ),
    },
}

RESEARCH_PROMPTS: dict[str, dict] = {
    "literature_review": {
        "system": (
            "You are a senior researcher. Write a literature review that synthesizes "
            "key findings and identifies gaps in current research."
        ),
        "template": (
            "Write a literature review for a research proposal titled \"{title}\" "
            "under the {provider} program. The researcher studies {field} at {institution}. "
            "Their past projects include: {past_projects}. "
            "Synthesize 3-5 key themes from existing literature, identify methodological "
            "gaps, and position the proposed research within the current discourse."
        ),
    },
    "hypothesis": {
        "system": (
            "You are a research methodology expert. Write clear, testable hypotheses "
            "and well-formulated research questions."
        ),
        "template": (
            "Write the hypothesis and research questions for a study titled \"{title}\" "
            "under the {provider} program. The researcher is a {level} in {field} "
            "at {institution}. "
            "State the primary hypothesis, 2-3 sub-questions, and explain the theoretical "
            "framework underpinning the study."
        ),
    },
    "methodology": {
        "system": (
            "You are a research methods professor. Write a detailed methodology section "
            "with justified choices for data collection and analysis."
        ),
        "template": (
            "Write a methodology section for a research proposal titled \"{title}\" "
            "under the {provider} program. The researcher is in {field} at {institution}. "
            "Include: research design, data collection methods, sample selection, "
            "analysis techniques, ethical considerations, and validity threats."
        ),
    },
    "expected_outcomes": {
        "system": (
            "You are a research impact assessor. Write a section describing the expected "
            "outcomes and broader significance of the proposed research."
        ),
        "template": (
            "Write expected outcomes for a research proposal titled \"{title}\" "
            "under the {provider} program. The research is in {field} at {institution}. "
            "Include: anticipated findings, contribution to the field, practical applications, "
            "policy implications, and plans for knowledge dissemination."
        ),
    },
}

TRACK_PROMPTS: dict[str, dict[str, dict]] = {
    "grant": GRANT_PROMPTS,
    "scholarship": SCHOLARSHIP_PROMPTS,
    "research": RESEARCH_PROMPTS,
}


# ── Mock content generators ──────────────────────────────────────────────

def _context_words(user_name: str, field: str, institution: str) -> list[str]:
    return [w for w in [field, institution, user_name] if w]


def _mock_content(section_type: str, track_type: str, context: dict) -> list[str]:
    """Return a list of realistic sentences for the given section."""
    title = context.get("title", "this program")
    provider = context.get("provider", "the funding body")
    field = context.get("field", "their field")
    institution = context.get("institution", "their institution")
    level = context.get("level", "graduate student")
    region = context.get("region", "their region")
    past = context.get("past_projects", "relevant prior work")
    award = context.get("award_range", "competitive award")

    sentences: dict[str, list[str]] = {
        # ── Grant ──
        "technical_approach": [
            f"Our proposed methodology leverages state-of-the-art approaches in {field} "
            f"to address the core challenges identified in this call by {provider}.",
            f"The technical implementation follows a three-phase iterative design, beginning "
            f"with requirements analysis and culminating in validated prototypes at {institution}.",
            f"We employ mixed-methods validation combining quantitative benchmarks with "
            f"qualitative expert review, ensuring robust and reproducible results.",
            f"Risk mitigation is built into each phase through contingency protocols and "
            f"regular milestone checkpoints with the advisory board.",
        ],
        "budget_justification": [
            f"The total requested budget of {award} is allocated across four categories "
            f"to maximize research impact and ensure efficient resource utilization.",
            f"Personnel costs account for 45% of the budget, covering one full-time "
            f"research assistant and partial salary support for the principal investigator.",
            f"Equipment and travel represent 25% of the budget, with dedicated funds for "
            f"high-performance computing resources essential for {field} analysis.",
            f"Indirect costs are calculated at the standard institutional rate, covering "
            f"facilities, administration, and shared infrastructure at {institution}.",
        ],
        "impact_sdg": [
            f"This project directly advances SDG 4 (Quality Education) by developing "
            f"open-access {field} tools that will benefit educators and students globally.",
            f"The research outcomes also contribute to SDG 9 (Industry, Innovation, "
            f"Infrastructure) through the creation of novel analytical frameworks.",
            f"Measurable indicators include training materials delivered, tools deployed, "
            f"and policy recommendations submitted to relevant governance bodies.",
        ],
        "project_timeline": [
            f"Phase 1 (Months 1-6): Literature synthesis, tool development, and baseline "
            f"establishment at {institution} in {field}.",
            f"Phase 2 (Months 7-12): Core research execution with iterative data collection "
            f"and preliminary analysis of results.",
            f"Phase 3 (Months 13-18): Advanced analysis, validation studies, and preparation "
            f"of manuscripts for peer-reviewed publication.",
            f"Phase 4 (Months 19-24): Knowledge dissemination, policy briefs, and "
            f"final reporting to {provider}.",
        ],
        # ── Scholarship ──
        "personal_statement": [
            f"Growing up in {region}, I witnessed firsthand how limited access to {field} "
            f"resources can shape entire communities' trajectories.",
            f"My journey at {institution} has been driven by an unwavering commitment to "
            f"bridging the gap between theoretical knowledge and real-world impact.",
            f"This scholarship from {provider} represents not just financial support, but "
            f"validation that my vision for {field} has broader significance.",
            f"I am determined to leverage this opportunity to create lasting change in "
            f"how {field} is taught, practiced, and valued in {region}.",
        ],
        "academic_goals": [
            f"In the short term, I aim to deepen my expertise in {field} through advanced "
            f"coursework and independent research at {institution}.",
            f"My medium-term goal is to publish in top-tier journals and present at "
            f"international conferences, establishing myself as a thought leader in {field}.",
            f"Long-term, I aspire to lead an interdisciplinary research group that tackles "
            f"societal challenges through innovative {field} solutions.",
            f"This {level} program is the critical foundation upon which these goals rest, "
            f"and the {provider} scholarship removes the financial barriers to their achievement.",
        ],
        "leadership_experience": [
            f"As president of the {field} student association at {institution}, I organized "
            f"workshops and seminars that attracted over 200 participants.",
            f"I spearheaded a community outreach initiative that brought {field} education "
            f"to underserved schools in {region}, impacting 500+ students.",
            f"My leadership philosophy centers on collaborative empowerment — creating "
            f"environments where every team member can contribute their unique strengths.",
            f"These experiences have taught me that true leadership is about service, "
            f"and I am eager to bring this mindset to the {provider} community.",
        ],
        "recommendation_notes": [
            f"The applicant demonstrates exceptional aptitude in {field}, consistently "
            f"performing in the top 5% of their cohort at {institution}.",
            f"Research potential is evidenced by their independent project on {past}, "
            f"which showed original thinking and methodological rigor.",
            f"Character qualities include intellectual curiosity, resilience in the face "
            f"of setbacks, and genuine generosity in mentoring junior students.",
            f"This candidate is an ideal match for the {title} award due to their "
            f"alignment with {provider}'s mission and demonstrated commitment to excellence.",
        ],
        # ── Research ──
        "literature_review": [
            f"Recent studies in {field} have made significant progress in understanding "
            f"core mechanisms, yet fundamental gaps remain in how {institution}-level "
            f"research translates to scalable solutions.",
            f"Smith et al. (2024) demonstrated that traditional approaches in {field} "
            f"suffer from scalability limitations, while Lee and Park (2025) proposed "
            f"novel frameworks that address some but not all of these constraints.",
            f"A critical gap exists in the intersection of {field} and interdisciplinary "
            f"methods — precisely the space this research aims to occupy.",
            f"By building on the foundational work of prior researchers while introducing "
            f"innovative methodological advances, this study positions itself at the "
            f"cutting edge of {field} research.",
        ],
        "hypothesis": [
            f"We hypothesize that integrating novel {field} approaches will yield "
            f"statistically significant improvements over current state-of-the-art methods.",
            f"Primary research question: How can emerging techniques in {field} be "
            f"systematically applied to address the identified limitations?",
            f"Secondary questions examine the boundary conditions, scalability, and "
            f"practical applicability of the proposed solutions across different contexts.",
            f"This theoretical framework draws on established models in {field} while "
            f"extending them through interdisciplinary integration.",
        ],
        "methodology": [
            f"This study adopts a sequential mixed-methods design, combining quantitative "
            f"experiments with qualitative case studies in the {field} domain.",
            f"Data collection will follow a stratified sampling approach, ensuring "
            f"representation across the key variables identified in our literature review.",
            f"Quantitative analysis employs Bayesian statistical methods, while qualitative "
            f"data will be analyzed using thematic analysis with inter-rater reliability checks.",
            f"Ethical considerations include informed consent protocols, data anonymization, "
            f"and institutional review board approval at {institution}.",
        ],
        "expected_outcomes": [
            f"We anticipate that the proposed research will produce 2-3 peer-reviewed "
            f"publications in top {field} journals within 18 months of project completion.",
            f"The practical outcomes include an open-source toolkit and best-practice "
            f"guidelines that practitioners in {field} can immediately adopt.",
            f"Policy implications include evidence-based recommendations for {provider} "
            f"and related stakeholders on scaling {field} interventions.",
            f"Knowledge dissemination will extend through conference presentations, "
            f"webinars, and a dedicated project website for open access to all findings.",
        ],
    }

    return sentences.get(section_type, [
        f"This section provides a detailed overview of {section_type.replace('_', ' ')} "
        f"for the application titled \"{title}\" sponsored by {provider}.",
        f"The applicant's background in {field} at {institution} provides a strong "
        f"foundation for addressing the objectives outlined in this proposal.",
        f"Key considerations include alignment with the program's priorities, "
        f"demonstrated expertise, and the potential for meaningful impact.",
        f"By leveraging their experience as a {level} in {region}, the applicant "
        f"is well-positioned to deliver exceptional results.",
    ])


# ── Streaming generator ──────────────────────────────────────────────────

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
