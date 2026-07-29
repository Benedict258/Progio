import random
import time


def search_web(query: str) -> list[dict]:
    """Return mock search results for a given query. No actual web scraping."""
    query_lower = query.lower()

    # Academic / government result pools by topic
    pools = {
        "health": [
            {"title": "Global Health Statistics 2024 - WHO", "url": "https://www.who.int/data/gho", "snippet": "Comprehensive global health data including mortality, morbidity, and risk factors across 194 member states.", "source": "World Health Organization"},
            {"title": "CDC Morbidity and Mortality Weekly Report", "url": "https://www.cdc.gov/mmwr/", "snippet": "CDC's primary vehicle for scientific publication of timely, reliable, authoritative public health information.", "source": "Centers for Disease Control"},
            {"title": "Global Burden of Disease Study 2024", "url": "https://www.healthdata.org/gbd", "snippet": "Systematic analysis of mortality and disability from diseases, injuries, and risk factors in 204 countries.", "source": "IHME"},
            {"title": "UNICEF Data: Monitoring the Situation of Children", "url": "https://data.unicef.org/", "snippet": "UNICEF collects and disseminates data on the situation of children and women worldwide.", "source": "UNICEF"},
        ],
        "education": [
            {"title": "UNESCO Institute for Statistics", "url": "http://uis.unesco.org/", "snippet": "Official source of internationally comparable data on education, science, culture, and communication.", "source": "UNESCO"},
            {"title": "World Bank Education Statistics", "url": "https://datatopics.worldbank.org/education/", "snippet": "Education statistics covering enrollment, completion rates, and education quality indicators globally.", "source": "World Bank"},
            {"title": "National Center for Education Statistics", "url": "https://nces.ed.gov/", "snippet": "Primary federal entity for collecting and analyzing education data in the United States.", "source": "U.S. Department of Education"},
        ],
        "climate": [
            {"title": "IPCC Sixth Assessment Report", "url": "https://www.ipcc.ch/assessment-report/ar6/", "snippet": "Comprehensive assessment of climate change impacts, adaptation, and mitigation by the world's leading scientists.", "source": "IPCC"},
            {"title": "NASA Earth Observatory - Climate Data", "url": "https://earthobservatory.nasa.gov/", "snippet": "Satellite imagery and scientific information about our home planet's climate and environment.", "source": "NASA"},
            {"title": "NOAA Climate.gov", "url": "https://www.climate.gov/", "snippet": "Climate data, tools, and information to help people understand climate and make decisions.", "source": "NOAA"},
        ],
        "technology": [
            {"title": "IEEE Xplore - Digital Library", "url": "https://ieeexplore.ieee.org/", "snippet": "Access to over 5 million technical documents in engineering, computer science, and related fields.", "source": "IEEE"},
            {"title": "ACM Digital Library", "url": "https://dl.acm.org/", "snippet": "Full-text database of articles, proceedings, and magazines from the Association for Computing Machinery.", "source": "ACM"},
            {"title": "arXiv.org e-Print archive", "url": "https://arxiv.org/", "snippet": "Open-access archive for scholarly articles in physics, mathematics, computer science, and related fields.", "source": "arXiv / Cornell University"},
        ],
        "default": [
            {"title": "Google Scholar", "url": "https://scholar.google.com/", "snippet": "Search across scholarly literature including articles, theses, books, and court opinions.", "source": "Google Scholar"},
            {"title": "PubMed - National Library of Medicine", "url": "https://pubmed.ncbi.nlm.nih.gov/", "snippet": "Over 36 million citations for biomedical literature from MEDLINE, life science journals, and online books.", "source": "NLM / NIH"},
            {"title": "JSTOR Digital Library", "url": "https://www.jstor.org/", "snippet": "Digital library of academic journals, books, and primary sources across multiple disciplines.", "source": "JSTOR / ITHAKA"},
            {"title": "World Bank Open Data", "url": "https://data.worldbank.org/", "snippet": "Free and open access to global development data including economic, social, and environmental indicators.", "source": "World Bank"},
            {"title": "OECD Data Explorer", "url": "https://data-explorer.oecd.org/", "snippet": "Access to a wide range of statistics on economy, society, environment, and development from OECD countries.", "source": "OECD"},
        ],
    }

    # Pick a pool based on keywords
    pool_key = "default"
    if any(w in query_lower for w in ("health", "disease", "malaria", "covid", "medical", "patient")):
        pool_key = "health"
    elif any(w in query_lower for w in ("education", "school", "student", "learning", "teaching")):
        pool_key = "education"
    elif any(w in query_lower for w in ("climate", "environment", "carbon", "emission", "sustainable")):
        pool_key = "climate"
    elif any(w in query_lower for w in ("technology", "ai", "software", "computer", "algorithm")):
        pool_key = "technology"

    pool = pools[pool_key]

    # Return 3-5 random results
    count = random.randint(3, min(5, len(pool)))
    results = random.sample(pool, count)

    # Add a tiny simulated delay feel
    time.sleep(0.05)
    return results
