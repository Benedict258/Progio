import asyncio
import random
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.application import Application
from app.models.opportunity import Opportunity
from app.models.user import User

router = APIRouter(prefix="/api/applications", tags=["refine"])


class RefineSelectionRequest(BaseModel):
    selected_text: str = Field(..., description="The selected text to refine")
    instruction: str = Field(
        ...,
        description="Refinement instruction: make_more_academic | shorten | align_donor | improve_methodology | generate_abstract | custom",
    )
    custom_instruction: str | None = Field(
        None, description="Custom instruction text when instruction is 'custom'"
    )


REFINEMENT_PROMPTS: dict[str, dict] = {
    "make_more_academic": {
        "system": (
            "You are an expert academic writing editor. Your task is to refine text "
            "to be more scholarly and rigorous.\n\n"
            "TONE: Formal, precise, authoritative. Third person preferred.\n"
            "RULES:\n"
            "1. Replace informal language with academic equivalents.\n"
            "2. Use discipline-appropriate terminology.\n"
            "3. Strengthen claims with evidence-based language.\n"
            "4. Remove hedge words (maybe, I think, pretty much).\n"
            "5. Maintain the original meaning and argument structure.\n"
            "6. Keep the same approximate length.\n\n"
            "OUTPUT: Return ONLY the refined text, no explanations."
        ),
    },
    "shorten": {
        "system": (
            "You are an expert editor specializing in concise academic writing.\n\n"
            "TASK: Shorten the provided text while preserving all key points.\n"
            "RULES:\n"
            "1. Target 50-70% of original length.\n"
            "2. Remove redundancies and filler phrases.\n"
            "3. Combine related sentences.\n"
            "4. Use stronger, more concise vocabulary.\n"
            "5. Preserve technical accuracy and core meaning.\n"
            "6. Maintain academic tone.\n\n"
            "OUTPUT: Return ONLY the shortened text, no explanations."
        ),
    },
    "align_donor": {
        "system": (
            "You are a grant writing expert who aligns proposals with funder priorities.\n\n"
            "TASK: Rephrase the text to better align with donor/opportunity criteria.\n"
            "RULES:\n"
            "1. Emphasize impact and outcomes that match funder mission.\n"
            "2. Use language and keywords from the opportunity description.\n"
            "3. Frame contributions in terms of funder benefits.\n"
            "4. Strengthen connections to stated priorities.\n"
            "5. Maintain honesty — don't overstate alignment.\n"
            "6. Keep the same approximate length.\n\n"
            "OUTPUT: Return ONLY the refined text, no explanations."
        ),
    },
    "improve_methodology": {
        "system": (
            "You are a research methodology expert and peer reviewer.\n\n"
            "TASK: Suggest improvements to the methodology described in the text.\n"
            "RULES:\n"
            "1. Identify weaknesses or gaps in the approach.\n"
            "2. Suggest specific, actionable improvements.\n"
            "3. Strengthen rigor and reproducibility.\n"
            "4. Add appropriate controls, validation, or benchmarks where missing.\n"
            "5. Maintain the original scope and feasibility.\n"
            "6. Use imperative style for methodological procedures.\n\n"
            "OUTPUT: Return the improved text with methodology enhancements, no explanations."
        ),
    },
    "generate_abstract": {
        "system": (
            "You are an expert at writing concise, compelling abstracts.\n\n"
            "TASK: Generate a structured abstract from the surrounding context.\n"
            "STRUCTURE: Background → Objective → Methods → Results (if available) → Conclusions\n"
            "RULES:\n"
            "1. 150-250 words.\n"
            "2. Self-contained — no citations needed.\n"
            "3. Include key findings and implications.\n"
            "4. Use past tense for completed work, present for ongoing.\n"
            "5. End with a forward-looking statement.\n\n"
            "OUTPUT: Return ONLY the abstract, no explanations."
        ),
    },
}


def _build_refinement_context(context: dict) -> dict:
    """Enrich context with formatted summaries for refinement prompts."""
    enriched = dict(context)
    enriched["user_name"] = context.get("user_name", "the applicant")
    enriched["field"] = context.get("field", "their field")
    enriched["institution"] = context.get("institution", "their institution")
    enriched["title"] = context.get("title", "this project")
    enriched["provider"] = context.get("provider", "the funding body")
    return enriched


async def _generate_refinement_stream(
    selected_text: str,
    instruction: str,
    context: dict,
):
    """Async generator that yields SSE-formatted refined text chunks."""
    enriched = _build_refinement_context(context)

    if instruction == "custom":
        system_prompt = (
            "You are an expert writing assistant. Apply the user's custom "
            "instruction to refine the provided text while maintaining its "
            "core meaning and academic quality. Return ONLY the refined text."
        )
        custom = context.get("custom_instruction", "Improve the text")
        user_prompt = f"INSTRUCTION: {custom}\n\nTEXT TO REFINE:\n{selected_text}"
    elif instruction == "generate_abstract":
        system_prompt = REFINEMENT_PROMPTS[instruction]["system"]
        user_prompt = (
            f"Generate an abstract from this surrounding context:\n\n"
            f"{selected_text}"
        )
    else:
        system_prompt = REFINEMENT_PROMPTS[instruction]["system"]
        user_prompt = f"TEXT TO REFINE:\n{selected_text}"

    # Mock refinement: transform the text based on instruction
    refined_text = _mock_refine(selected_text, instruction, enriched)
    words = refined_text.split()

    chunk_size = random.randint(2, 5)
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i : i + chunk_size])
        if i + chunk_size < len(words):
            chunk += " "
        yield f"data: {chunk}\n\n"
        await asyncio.sleep(0.04)

    yield "data: [DONE]\n\n"


def _mock_refine(text: str, instruction: str, context: dict) -> str:
    """Generate refined text based on instruction type."""
    field = context.get("field", "the field")
    provider = context.get("provider", "the funding body")
    title = context.get("title", "this project")

    refinements = {
        "make_more_academic": (
            f"The aforementioned investigation demonstrates significant implications "
            f"for {field}. Empirical evidence substantiates the validity of the "
            f"proposed approach, with documented outcomes indicating measurable "
            f"advancement in the identified domain. The methodology employed "
            f"adheres to established scholarly standards, thereby ensuring "
            f"reproducibility and rigor in the analytical framework. "
            f"Furthermore, the systematic evaluation confirms that the research "
            f"objectives align with the stated theoretical foundations and "
            f"contribute meaningfully to the existing body of knowledge."
        ),
        "shorten": (
            f"This research addresses critical challenges in {field} through "
            f"a rigorous, evidence-based approach. The proposed methodology "
            f"yields measurable outcomes that advance the field while remaining "
            f"aligned with {provider}'s mission."
        ),
        "align_donor": (
            f"This initiative directly advances {provider}'s strategic priorities "
            f"by addressing key gaps in {field}. The proposed work delivers "
            f"tangible outcomes that support the funder's mission, including "
            f"open-access tools, peer-reviewed publications, and policy-relevant "
            f"recommendations. By focusing on {title}, the project creates "
            f"measurable impact that aligns with the stated evaluation criteria."
        ),
        "improve_methodology": (
            f"To enhance methodological rigor, the following improvements are "
            f"recommended: (1) Incorporate a mixed-methods design combining "
            f"quantitative analysis with qualitative validation. (2) Establish "
            f"baseline benchmarks using established protocols in {field}. "
            f"(3) Implement iterative validation cycles with domain experts. "
            f"(4) Add reproducibility checks through standardized documentation "
            f"and open-source code release. (5) Include sensitivity analyses to "
            f"assess robustness across varying conditions."
        ),
        "generate_abstract": (
            f"Background: Critical gaps persist in {field} research, particularly "
            f"regarding deployment in real-world settings. Objective: This study "
            f"proposes a novel framework to address these challenges through "
            f"integrated methodology. Methods: We employ a three-phase design "
            f"combining computational analysis with empirical validation. "
            f"Results: Preliminary findings suggest significant improvements "
            f"over existing approaches. Conclusions: The proposed framework "
            f"offers a viable path forward for advancing {field}, with direct "
            f"implications for {provider}'s strategic objectives."
        ),
    }

    base = refinements.get(instruction, text)

    # Ensure we have something reasonable
    if not text.strip():
        return f"Content will be refined here to address {field} considerations."

    return base


@router.post("/{app_id}/refine-selection")
async def refine_selection(
    app_id: str,
    payload: RefineSelectionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refine selected text using AI based on the provided instruction."""
    if payload.instruction not in REFINEMENT_PROMPTS and payload.instruction != "custom":
        raise HTTPException(
            status_code=400,
            detail=f"Invalid instruction '{payload.instruction}'. "
            f"Must be one of: make_more_academic, shorten, align_donor, "
            f"improve_methodology, generate_abstract, custom",
        )

    if payload.instruction == "custom" and not payload.custom_instruction:
        raise HTTPException(
            status_code=400,
            detail="custom_instruction is required when instruction is 'custom'",
        )

    app_obj = await db.get(Application, app_id)
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    user = await db.get(User, app_obj.user_id)
    opportunity = await db.get(Opportunity, app_obj.opportunity_id)

    context = {
        "title": opportunity.title if opportunity else "this project",
        "provider": opportunity.provider if opportunity else "the funding body",
        "field": user.field_of_study if user else "interdisciplinary studies",
        "institution": user.institution if user else "their institution",
        "user_name": user.name if user else "the applicant",
        "custom_instruction": payload.custom_instruction,
    }

    return StreamingResponse(
        _generate_refinement_stream(
            payload.selected_text,
            payload.instruction,
            context,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
