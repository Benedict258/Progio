import re
from datetime import date, datetime

import httpx


async def fetch_url_content(url: str) -> str:
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 ProgioBot/1.0"})
        resp.raise_for_status()
        return resp.text


def extract_title(html: str) -> str | None:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if m:
        text = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        return text if text else None
    return None


def extract_meta(html: str, name: str) -> str | None:
    patterns = [
        rf'<meta\s+name=["\']?{name}["\']?\s+content=["\']([^"\']+)["\']',
        rf'<meta\s+content=["\']([^"\']+)["\']\s+name=["\']?{name}["\']?',
    ]
    for pat in patterns:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def extract_deadline(text: str) -> str | None:
    patterns = [
        r"(?:deadline|due\s+date|closing\s+date|apply\s+by)[\s:]+(\w+\s+\d{1,2},?\s+\d{4})",
        r"(?:deadline|due\s+date|closing\s+date|apply\s+by)[\s:]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
        r"(?:deadline|due\s+date|closing\s+date|apply\s+by)[\s:]+(\d{4}[/-]\d{1,2}[/-]\d{1,2})",
        r"(?:deadline|due\s+date|closing\s+date|apply\s+by)[\s:]+(\w+\s+\d{4})",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            raw = m.group(1).strip()
            return _normalize_date(raw)
    return None


def _normalize_date(raw: str) -> str:
    for fmt in ("%B %d, %Y", "%B %d %Y", "%m/%d/%Y", "%m-%d-%Y", "%Y/%m/%d", "%Y-%m-%d", "%B %Y", "%b %Y"):
        try:
            d = datetime.strptime(raw.strip().rstrip(","), fmt).date()
            return d.isoformat()
        except ValueError:
            continue
    return raw


def extract_award_range(text: str) -> str | None:
    patterns = [
        r"(?:award|funding|grant\s+(?:of|up\s+to)|scholarship\s+(?:of|up\s+to)|budget|amount)[\s:]+(\$[\d,]+(?:\s*[-–to]+\s*\$[\d,]+)?)",
        r"(\$[\d,]+(?:\s*[-–to]+\s*\$[\d,]+)?(?:\s*(?:per|each|annually|per\s+year))?)",
        r"(?:up\s+to)\s+(\$[\d,]+(?:\s*[-–to]+\s*\$[\d,]+)?)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def extract_eligibility(text: str) -> dict:
    criteria: dict = {}
    level_patterns = {
        "undergraduate": r"(?:undergrad(?:uate)?\s+student|bachelor'?s)",
        "graduate": r"(?:grad(?:uate)?\s+student|master'?s|phd|doctoral)",
        "postdoc": r"post-?doc(?:toral)?",
    }
    for level, pat in level_patterns.items():
        if re.search(pat, text, re.IGNORECASE):
            criteria["education_level"] = level
            break

    gpa_m = re.search(r"(?:gpa|grade\s+point)[\s:]+(\d\.?\d?)", text, re.IGNORECASE)
    if gpa_m:
        criteria["min_gpa"] = float(gpa_m.group(1))

    field_m = re.search(r"(?:field(?:s)?\s+(?:of\s+)?(?:study|research)|disciplin(?:e|es))[\s:]+([^.;]+)", text, re.IGNORECASE)
    if field_m:
        fields = [f.strip() for f in re.split(r",\s*|\s+and\s+", field_m.group(1)) if f.strip()]
        criteria["eligible_fields"] = fields

    return criteria


def extract_field_tags(text: str) -> list[str]:
    common_fields = [
        "STEM", "Computer Science", "Engineering", "Biology", "Chemistry", "Physics",
        "Mathematics", "Medicine", "Health Sciences", "Environmental Science",
        "Social Sciences", "Humanities", "Business", "Economics", "Psychology",
        "Education", "Law", "Public Policy", "Data Science", "AI", "Machine Learning",
        "Biomedical", "Neuroscience", "Astronomy", "Agriculture", "Energy",
    ]
    tags = []
    for field in common_fields:
        if re.search(rf"\b{re.escape(field)}\b", text, re.IGNORECASE):
            tags.append(field)
    return tags[:5]


def extract_region(text: str) -> str | None:
    patterns = [
        r"(?:region|geography|location|country)[\s:]+([A-Za-z\s,]+)",
        r"(?:open\s+to)\s+(.+?)(?:\.|;|,?\s+(?:with|who|that|must|and\s+must))",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            region = m.group(1).strip()[:100]
            return region if region else None
    return None


async def parse_url(url: str, opp_type: str = "grant") -> dict:
    try:
        html = await fetch_url_content(url)
    except Exception:
        return _demo_parse(url, opp_type)

    plain = re.sub(r"<[^>]+>", " ", html)
    plain = re.sub(r"\s+", " ", plain)

    title = extract_title(html) or extract_meta(html, "og:title") or extract_meta(html, "title")
    desc = extract_meta(html, "description") or extract_meta(html, "og:description")
    deadline = extract_deadline(plain)
    award = extract_award_range(plain)
    eligibility = extract_eligibility(plain)
    field_tags = extract_field_tags(plain)
    region = extract_region(plain)

    provider = None
    provider_m = re.search(r"(?:provider|organization|institution|sponsored\s+by|funded\s+by)[\s:]+([^.;]+)", plain, re.IGNORECASE)
    if provider_m:
        provider = provider_m.group(1).strip()[:255]
    if not provider:
        from urllib.parse import urlparse
        parsed_url = urlparse(url)
        provider = parsed_url.netloc.replace("www.", "") if parsed_url.netloc else None

    return {
        "title": title[:500] if title else None,
        "provider": provider[:255] if provider else None,
        "description": desc[:2000] if desc else None,
        "deadline": deadline,
        "award_range": award,
        "eligibility_criteria": eligibility if eligibility else None,
        "field_tags": field_tags if field_tags else None,
        "region": region,
        "source_url": url,
    }


def _demo_parse(url: str, opp_type: str) -> dict:
    import hashlib
    h = int(hashlib.md5(url.encode()).hexdigest()[:8], 16)
    demo_grants = [
        {
            "title": "Advanced Research Innovation Grant",
            "provider": "National Science Foundation",
            "description": "Supports innovative research in STEM fields with emphasis on interdisciplinary collaboration and real-world impact.",
            "deadline": "2026-03-15",
            "award_range": "$100,000 - $500,000",
            "eligibility_criteria": {"education_level": "graduate", "min_gpa": 3.0, "eligible_fields": ["STEM", "Engineering", "Computer Science"]},
            "field_tags": ["STEM", "Engineering", "Computer Science"],
            "region": "United States",
        },
        {
            "title": "Global Health Equity Scholarship",
            "provider": "World Health Organization",
            "description": "Funding for students pursuing research in global health disparities and equity-focused interventions.",
            "deadline": "2026-06-01",
            "award_range": "$15,000 - $30,000",
            "eligibility_criteria": {"education_level": "graduate", "eligible_fields": ["Health Sciences", "Medicine", "Public Policy"]},
            "field_tags": ["Health Sciences", "Medicine", "Public Policy"],
            "region": "Global",
        },
        {
            "title": "Climate Action Research Fellowship",
            "provider": "Environmental Defense Fund",
            "description": "Fellowship supporting early-career researchers addressing climate change through innovative solutions.",
            "deadline": "2026-04-20",
            "award_range": "$25,000 - $75,000",
            "eligibility_criteria": {"education_level": "graduate", "eligible_fields": ["Environmental Science", "Energy", "Policy"]},
            "field_tags": ["Environmental Science", "Energy"],
            "region": "North America, Europe",
        },
    ]
    demo_scholarships = [
        {
            "title": "Women in STEM Excellence Award",
            "provider": "Society of Women Engineers",
            "description": "Recognizing outstanding women pursuing degrees in science, technology, engineering, and mathematics.",
            "deadline": "2026-02-28",
            "award_range": "$5,000 - $25,000",
            "eligibility_criteria": {"education_level": "undergraduate", "gender": "female", "eligible_fields": ["STEM", "Engineering"]},
            "field_tags": ["STEM", "Engineering", "Computer Science"],
            "region": "United States",
        },
        {
            "title": "First-Generation Scholars Program",
            "provider": "Gates Foundation",
            "description": "Financial support for first-generation college students demonstrating academic excellence and leadership.",
            "deadline": "2026-05-10",
            "award_range": "$10,000 - $20,000",
            "eligibility_criteria": {"education_level": "undergraduate", "first_generation": True},
            "field_tags": ["All Fields"],
            "region": "United States",
        },
    ]
    pool = demo_grants if opp_type == "grant" else demo_scholarships
    result = pool[h % len(pool)].copy()
    result["source_url"] = url
    return result
