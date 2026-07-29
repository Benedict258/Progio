from pydantic import BaseModel, Field


class TemplateSection(BaseModel):
    key: str
    label: str
    description: str
    word_limit: int | None = None


class ParsedTemplate(BaseModel):
    title: str
    sections: list[TemplateSection]
    source_type: str  # "url" | "file"
    source_name: str


def parse_template(source: str, source_type: str = "url", filename: str | None = None) -> ParsedTemplate:
    """Parse a donor template from a URL or file. Returns structured template for demo."""
    source_name = filename or source

    # Determine a reasonable template based on keywords in the source
    source_lower = source.lower()

    if any(w in source_lower for w in ("nih", "nsf", "research", "science")):
        return ParsedTemplate(
            title="Research Grant Proposal",
            sections=[
                TemplateSection(key="abstract", label="Abstract", description="Brief summary of the proposed research (250 words max)", word_limit=250),
                TemplateSection(key="specific_aims", label="Specific Aims", description="One-page overview of the research objectives and hypotheses", word_limit=500),
                TemplateSection(key="research_plan", label="Research Plan", description="Detailed methodology, experimental design, and expected results", word_limit=3000),
                TemplateSection(key="budget_justification", label="Budget Justification", description="Itemized budget with narrative justification for each cost", word_limit=1500),
                TemplateSection(key="biographical_sketch", label="Biographical Sketch", description="Qualifications and relevant experience of key personnel", word_limit=1000),
                TemplateSection(key="references", label="References", description="Bibliography of cited literature", word_limit=2000),
            ],
            source_type=source_type,
            source_name=source_name,
        )
    elif any(w in source_lower for w in ("who", "unicef", "global", "health")):
        return ParsedTemplate(
            title="Global Health Grant Application",
            sections=[
                TemplateSection(key="cover_letter", label="Cover Letter", description="Introduction and summary of the proposal", word_limit=500),
                TemplateSection(key="problem_statement", label="Problem Statement", description="Description of the health challenge being addressed", word_limit=1000),
                TemplateSection(key="intervention", label="Proposed Intervention", description="Detailed description of the planned intervention", word_limit=2000),
                TemplateSection(key="monitoring", label="Monitoring & Evaluation", description="M&E framework with indicators and data collection methods", word_limit=1500),
                TemplateSection(key="sustainability", label="Sustainability Plan", description="How the project will continue beyond the funding period", word_limit=800),
                TemplateSection(key="budget", label="Budget", description="Detailed budget with cost categories", word_limit=1500),
            ],
            source_type=source_type,
            source_name=source_name,
        )
    else:
        return ParsedTemplate(
            title="Grant Proposal Template",
            sections=[
                TemplateSection(key="executive_summary", label="Executive Summary", description="High-level overview of the project", word_limit=300),
                TemplateSection(key="needs_assessment", label="Needs Assessment", description="Evidence-based analysis of the problem", word_limit=1000),
                TemplateSection(key="goals_objectives", label="Goals & Objectives", description="SMART goals and measurable objectives", word_limit=800),
                TemplateSection(key="methodology", label="Methodology", description="Approach, activities, and implementation plan", word_limit=2000),
                TemplateSection(key="evaluation", label="Evaluation Plan", description="How success will be measured", word_limit=1000),
                TemplateSection(key="organizational_capacity", label="Organizational Capacity", description="Team qualifications and organizational track record", word_limit=800),
                TemplateSection(key="budget", label="Budget & Budget Narrative", description="Cost breakdown with justification", word_limit=1500),
            ],
            source_type=source_type,
            source_name=source_name,
        )
