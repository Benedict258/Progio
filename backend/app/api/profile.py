import re
import io
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.schemas.profile import AIFillResponse, ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/api/profile", tags=["profile"])

DEMO_USER_ID = "user-001"

LEVEL_KEYWORDS = {
    "PhD": ["phd", "ph.d", "doctoral", "doctorate"],
    "Masters": ["masters", "master", "msc", "ma", "mba", "m.s.", "m.a."],
    "Bachelors": ["bachelors", "bachelor", "bsc", "ba", "b.s.", "b.a.", "undergraduate"],
    "Postdoc": ["postdoc", "post-doctoral", "postdoctoral"],
}

REGION_KEYWORDS = {
    "North America": ["north america", "usa", "united states", "canada", "us ", " u.s"],
    "Europe": ["europe", "uk", "united kingdom", "germany", "france", "netherlands", "sweden", "switzerland"],
    "Africa": ["africa", "nigeria", "kenya", "ghana", "south africa", "ethiopia", "tanzania", "egypt"],
    "Asia": ["asia", "china", "japan", "india", "korea", "singapore", "taiwan"],
    "South America": ["south america", "brazil", "argentina", "colombia", "chile", "peru"],
    "Oceania": ["oceania", "australia", "new zealand", "pacific"],
    "West Africa": ["west africa", "ghana", "nigeria", "senegal", "mali", "burkina"],
    "East Africa": ["east africa", "kenya", "ethiopia", "tanzania", "uganda"],
}


def calculate_completion(user: User) -> float:
    fields = [
        user.institution,
        user.field_of_study,
        user.level,
        user.region,
        user.funding_needs,
        user.past_projects,
    ]
    filled = sum(1 for f in fields if f is not None and f != "" and f != [])
    return round((filled / len(fields)) * 100, 1)


def infer_level(text: str) -> Optional[str]:
    lower = text.lower()
    for level, keywords in LEVEL_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                return level
    return None


def infer_region(text: str) -> Optional[str]:
    lower = text.lower()
    for region, keywords in REGION_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                return region
    return None


def infer_field_of_study(text: str) -> Optional[str]:
    lower = text.lower()
    field_patterns = {
        "Computer Science": ["computer science", "cs ", "machine learning", "artificial intelligence", "software engineering"],
        "Biology": ["biology", "biological", "biomedical", "genomics", "molecular biology", "genetics"],
        "Physics": ["physics", "quantum", "astrophysics", "theoretical physics"],
        "Chemistry": ["chemistry", "chemical", "organic chemistry", "biochemistry"],
        "Engineering": ["engineering", "mechanical", "electrical", "civil engineering"],
        "Economics": ["economics", "econometrics", "financial economics"],
        "Political Science": ["political science", "politics", "public policy", "international relations"],
        "Psychology": ["psychology", "cognitive", "behavioral science"],
        "Sociology": ["sociology", "social work", "social science"],
        "Environmental Science": ["environmental science", "ecology", "climate", "sustainability"],
        "Mathematics": ["mathematics", "math", "applied mathematics", "statistics"],
        "Medicine": ["medicine", "medical", "public health", "epidemiology", "health science"],
        "Law": ["law", "legal", "jurisprudence"],
        "Education": ["education", "teaching", "pedagogy"],
        "Arts": ["arts", "fine arts", "art history", "visual arts", "creative"],
        "Humanities": ["humanities", "history", "philosophy", "literature", "linguistics"],
        "Business": ["business", "mba", "management", "marketing", "finance"],
    }
    for field, keywords in field_patterns.items():
        for kw in keywords:
            if kw in lower:
                return field
    return None


def infer_institution(text: str) -> Optional[str]:
    institution_keywords = ["university", "institute", "college", "school"]
    common_words = {
        "i", "a", "an", "the", "at", "in", "from", "to", "for", "and", "or",
        "we", "my", "our", "your", "his", "her", "its", "their", "this", "that",
        "is", "was", "are", "were", "be", "been", "being", "have", "has", "had",
        "do", "does", "did", "will", "would", "could", "should", "may", "might",
        "shall", "can", "am", "studied", "studying", "student", "research",
        "phd", "msc", "ma", "bsc", "ba", "mba", "ms", "ph.d", "m.s", "b.s",
    }

    for line in text.split("\n"):
        # Pattern 1: "University of X" (preferred, more specific)
        for kw in institution_keywords:
            pattern = kw + r"\s+of\s+[A-Z][\w]+(?:\s+[A-Z][\w]+)*"
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                result = match.group(0).strip()
                # Clean up trailing punctuation
                result = result.rstrip(",.;:!?")
                if 5 < len(result) < 100:
                    return result

        # Pattern 2: "X University" - look for capitalized words before keyword
        for kw in institution_keywords:
            idx = line.lower().find(kw)
            if idx == -1:
                continue

            prefix = line[:idx].strip()
            prefix_words = prefix.split()
            institution_words = []
            for w in reversed(prefix_words[-4:]):
                if w.lower() in common_words:
                    break
                institution_words.insert(0, w)

            if not institution_words:
                continue

            institution_words.append(kw.capitalize())
            result = " ".join(institution_words).strip()
            if 5 < len(result) < 100:
                return result

    return None


def parse_extracted_text(text: str) -> dict:
    institution = infer_institution(text)
    field_of_study = infer_field_of_study(text)
    level = infer_level(text)
    region = infer_region(text)

    return {
        "institution": institution,
        "field_of_study": field_of_study,
        "level": level,
        "region": region,
    }


def extract_text_from_pdf(content: bytes) -> str:
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            text_parts = []
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF processing library not installed. Install pdfplumber.",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract PDF text: {str(e)}")


def extract_text_from_file(content: bytes, filename: str) -> str:
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        return extract_text_from_pdf(content)
    elif lower_name.endswith((".txt", ".md", ".csv", ".doc", ".docx")):
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return content.decode("latin-1")
            except Exception:
                return ""
    else:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return ""


@router.get("", response_model=ProfileResponse)
async def get_profile(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == DEMO_USER_ID))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == DEMO_USER_ID))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    user.profile_completion_pct = calculate_completion(user)

    await db.commit()
    await db.refresh(user)
    return user


@router.post("/ai-fill", response_model=AIFillResponse)
async def ai_fill_profile(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed_extensions = (".pdf", ".txt", ".md", ".csv", ".doc", ".docx")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}",
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    raw_text = extract_text_from_file(content, file.filename)

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file.")

    extracted = parse_extracted_text(raw_text)

    confidence = {}
    for key, value in extracted.items():
        if value:
            confidence[key] = "high" if len(value) > 3 else "medium"
        else:
            confidence[key] = "low"

    text_preview = raw_text[:500] + "..." if len(raw_text) > 500 else raw_text

    return AIFillResponse(
        institution=extracted.get("institution"),
        field_of_study=extracted.get("field_of_study"),
        level=extracted.get("level"),
        region=extracted.get("region"),
        raw_text_preview=text_preview,
        confidence=confidence,
    )
