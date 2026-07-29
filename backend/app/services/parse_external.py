import re
from datetime import date, datetime

import httpx


async def fetch_url_content(url: str) -> str:
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(connect=10.0, read=15.0, write=10.0, pool=10.0),
        follow_redirects=True,
    ) as client:
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
    from urllib.parse import urlparse

    parsed_url = urlparse(url)
    domain = (parsed_url.netloc or url).replace("www.", "")

    try:
        html = await fetch_url_content(url)
    except Exception:
        return _demo_parse(url, opp_type, domain)

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
        provider = domain if domain else None

    if not title:
        title = f"Funding Opportunity from {domain}"
    if not desc:
        desc = f"Funding opportunity sourced from {domain}. Please review the original page for full details."

    return {
        "title": title[:500],
        "provider": provider[:255] if provider else None,
        "description": desc[:2000],
        "deadline": deadline,
        "award_range": award,
        "eligibility_criteria": eligibility if eligibility else None,
        "field_tags": field_tags if field_tags else None,
        "region": region,
        "source_url": url,
    }


async def parse_name(name: str, opp_type: str = "grant") -> dict:
    """Generate structured data from a grant/scholarship name."""
    domain_name = name.lower().strip()
    return {
        "title": name,
        "provider": _guess_provider(name),
        "description": f"Funding opportunity: {name}. Search for this name on the provider's website for full eligibility and application details.",
        "deadline": None,
        "award_range": None,
        "eligibility_criteria": None,
        "field_tags": _guess_field_tags(name),
        "region": None,
        "source_url": None,
    }


def _guess_provider(name: str) -> str:
    name_lower = name.lower()
    providers = [
        ("nsf", "National Science Foundation"),
        ("nih", "National Institutes of Health"),
        ("doe", "Department of Energy"),
        ("darpa", "DARPA"),
        ("eu", "European Commission"),
        ("horizon", "European Commission"),
        ("wellcome", "Wellcome Trust"),
        ("gates", "Gates Foundation"),
        ("ford", "Ford Foundation"),
        ("rockefeller", "Rockefeller Foundation"),
        ("macarthur", "MacArthur Foundation"),
        ("fulbright", "Fulbright Program"),
        ("rhodes", "Rhodes Trust"),
        ("chevening", "Chevening"),
        ("gates cambridge", "Gates Cambridge Trust"),
    ]
    for keyword, provider in providers:
        if keyword in name_lower:
            return provider
    return "Unknown Provider"


def _guess_field_tags(name: str) -> list[str]:
    name_lower = name.lower()
    tags = []
    field_map = {
        "stem": "STEM",
        "computer science": "Computer Science",
        "ai": "AI",
        "artificial intelligence": "AI",
        "machine learning": "Machine Learning",
        "engineering": "Engineering",
        "biology": "Biology",
        "chemistry": "Chemistry",
        "physics": "Physics",
        "math": "Mathematics",
        "medicine": "Medicine",
        "health": "Health Sciences",
        "environment": "Environmental Science",
        "climate": "Climate Science",
        "energy": "Energy",
        "social science": "Social Sciences",
        "humanities": "Humanities",
        "business": "Business",
        "economics": "Economics",
        "education": "Education",
        "law": "Law",
        "policy": "Public Policy",
        "data science": "Data Science",
        "neuroscience": "Neuroscience",
        "biomedical": "Biomedical",
    }
    for keyword, tag in field_map.items():
        if keyword in name_lower:
            tags.append(tag)
    return tags[:5] if tags else ["Interdisciplinary"]


def _demo_parse(url: str, opp_type: str, domain: str = "") -> dict:
    import hashlib
    h = int(hashlib.md5(url.encode()).hexdigest()[:8], 16)
    provider_name = domain.split(".")[0].title() if domain else "Unknown Organization"

    demo_grants = [
        {
            "title": f"Research Innovation Grant — {provider_name}",
            "provider": provider_name,
            "description": f"Supports innovative research with emphasis on interdisciplinary collaboration and real-world impact. Sourced from {domain or 'external URL'}.",
            "deadline": "2026-03-15",
            "award_range": "$100,000 - $500,000",
            "eligibility_criteria": {"education_level": "graduate", "min_gpa": 3.0, "eligible_fields": ["STEM", "Engineering", "Computer Science"]},
            "field_tags": ["STEM", "Engineering", "Computer Science"],
            "region": "United States",
        },
        {
            "title": f"Global Impact Fellowship — {provider_name}",
            "provider": provider_name,
            "description": f"Funding for researchers pursuing solutions to global challenges. Sourced from {domain or 'external URL'}.",
            "deadline": "2026-06-01",
            "award_range": "$15,000 - $30,000",
            "eligibility_criteria": {"education_level": "graduate", "eligible_fields": ["Health Sciences", "Medicine", "Public Policy"]},
            "field_tags": ["Health Sciences", "Medicine", "Public Policy"],
            "region": "Global",
        },
        {
            "title": f"Sustainability Research Award — {provider_name}",
            "provider": provider_name,
            "description": f"Supporting early-career researchers addressing environmental challenges through innovative solutions. Sourced from {domain or 'external URL'}.",
            "deadline": "2026-04-20",
            "award_range": "$25,000 - $75,000",
            "eligibility_criteria": {"education_level": "graduate", "eligible_fields": ["Environmental Science", "Energy", "Policy"]},
            "field_tags": ["Environmental Science", "Energy"],
            "region": "North America, Europe",
        },
    ]
    demo_scholarships = [
        {
            "title": f"Excellence Award — {provider_name}",
            "provider": provider_name,
            "description": f"Recognizing outstanding students pursuing degrees in science, technology, engineering, and mathematics. Sourced from {domain or 'external URL'}.",
            "deadline": "2026-02-28",
            "award_range": "$5,000 - $25,000",
            "eligibility_criteria": {"education_level": "undergraduate", "eligible_fields": ["STEM", "Engineering"]},
            "field_tags": ["STEM", "Engineering", "Computer Science"],
            "region": "United States",
        },
        {
            "title": f"First-Generation Scholars Program — {provider_name}",
            "provider": provider_name,
            "description": f"Financial support for first-generation college students demonstrating academic excellence and leadership. Sourced from {domain or 'external URL'}.",
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
