import uuid
import hashlib
import math
import re
from collections import Counter
from datetime import datetime, timezone

EMBEDDING_DIM = 128

MOCK_PAPERS = [
    {
        "id": "paper-001",
        "title": "CRISPR-Cas9 Gene Editing for Malaria Resistance: A Comprehensive Review",
        "authors": ["A. Osei", "K. Mensah", "J. Smith"],
        "abstract": "This paper reviews the application of CRISPR-Cas9 gene editing technology in developing malaria-resistant mosquito populations. We examine recent breakthroughs in vector control and discuss ethical implications of gene drive technologies in endemic regions.",
        "year": 2024,
        "journal": "Nature Genetics",
        "keywords": ["CRISPR", "malaria", "gene editing", "vector control", "genomics"],
        "doi": "10.1038/ng.2024.001",
        "volume": "56",
        "issue": "3",
        "pages": "234-251",
    },
    {
        "id": "paper-002",
        "title": "Machine Learning Approaches for Political Sentiment Analysis in Social Media",
        "authors": ["L. Chen", "M. Rodriguez", "S. Kim"],
        "abstract": "We present novel deep learning architectures for analyzing political sentiment across multiple social media platforms. Our approach achieves state-of-the-art accuracy in detecting nuanced political positions and propaganda.",
        "year": 2025,
        "journal": "Journal of Computational Political Science",
        "keywords": ["machine learning", "political science", "sentiment analysis", "social media", "NLP"],
        "doi": "10.1093/jcps.2025.012",
        "volume": "12",
        "issue": "1",
        "pages": "45-67",
    },
    {
        "id": "paper-003",
        "title": "Climate Change Impact on Global Food Security: A Meta-Analysis",
        "authors": ["R. Patel", "E. Johnson", "T. Wu"],
        "abstract": "This meta-analysis synthesizes 150 studies on climate change impacts on food production across 60 countries. Results indicate significant yield reductions in tropical regions with adaptive strategies showing limited effectiveness.",
        "year": 2024,
        "journal": "Environmental Science & Technology",
        "keywords": ["climate change", "food security", "agriculture", "meta-analysis", "sustainability"],
        "doi": "10.1021/es.2024.0456",
        "volume": "58",
        "issue": "12",
        "pages": "5678-5695",
    },
    {
        "id": "paper-004",
        "title": "Quantum Computing Applications in Drug Discovery: Current Progress and Future Directions",
        "authors": ["H. Nakamura", "P. Anderson", "L. Zhang"],
        "abstract": "We survey recent advances in quantum computing for molecular simulation and drug design. Current quantum algorithms show promise for protein folding problems, though practical implementation remains challenging.",
        "year": 2025,
        "journal": "Nature Computational Science",
        "keywords": ["quantum computing", "drug discovery", "molecular simulation", "pharmaceutical"],
        "doi": "10.1038/s43588-025-00034",
        "volume": "5",
        "issue": "2",
        "pages": "112-128",
    },
    {
        "id": "paper-005",
        "title": "Renewable Energy Integration in Developing Nations: Policy Frameworks and Economic Analysis",
        "authors": ["A. Okonkwo", "D. Müller", "S. Singh"],
        "abstract": "This study analyzes renewable energy adoption policies across 25 developing nations. We propose an economic model for optimizing energy mix transitions while maintaining grid stability and affordability.",
        "year": 2024,
        "journal": "Energy Policy",
        "keywords": ["renewable energy", "policy analysis", "developing nations", "economic modeling", "sustainability"],
        "doi": "10.1016/j.enpol.2024.113892",
        "volume": "189",
        "issue": None,
        "pages": "113892",
    },
    {
        "id": "paper-006",
        "title": "Deep Learning for Medical Image Analysis: A Systematic Review of Diagnostic Accuracy",
        "authors": ["Y. Lee", "K. Patel", "M. Garcia"],
        "abstract": "We systematically review 200 studies on deep learning applications in medical imaging. Our analysis reveals high accuracy in radiology and pathology, with limitations in generalizability across diverse patient populations.",
        "year": 2025,
        "journal": "The Lancet Digital Health",
        "keywords": ["deep learning", "medical imaging", "diagnostics", "healthcare AI", "radiology"],
        "doi": "10.1016/S2589-7500(25)00023",
        "volume": "7",
        "issue": "4",
        "pages": "e234-e248",
    },
    {
        "id": "paper-007",
        "title": "Neuroplasticity and Learning: Implications for Educational Technology Design",
        "authors": ["C. Williams", "R. Tanaka", "J. Brown"],
        "abstract": "This paper bridges neuroscience and educational technology by examining how neuroplasticity principles can inform adaptive learning systems. We present a framework for designing personalized learning experiences.",
        "year": 2024,
        "journal": "Educational Psychology Review",
        "keywords": ["neuroplasticity", "education", "learning science", "edtech", "cognitive science"],
        "doi": "10.1007/s10648-024-09834",
        "volume": "36",
        "issue": "2",
        "pages": "189-210",
    },
    {
        "id": "paper-008",
        "title": "Blockchain-Based Supply Chain Verification: A Case Study in Pharmaceutical Integrity",
        "authors": ["V. Singh", "A. Petrov", "L. Chen"],
        "abstract": "We evaluate blockchain implementation for pharmaceutical supply chain tracking. Our case study demonstrates 99.7% accuracy in detecting counterfeit medications across a pilot network spanning 12 countries.",
        "year": 2025,
        "journal": "IEEE Transactions on Engineering Management",
        "keywords": ["blockchain", "supply chain", "pharmaceutical", "anti-counterfeiting", "distributed systems"],
        "doi": "10.1109/TEM.2025.3012345",
        "volume": "72",
        "issue": "1",
        "pages": "45-58",
    },
    {
        "id": "paper-009",
        "title": "Urban Heat Island Effect Mitigation Through Green Infrastructure: A Multi-City Analysis",
        "authors": ["N. Thompson", "S. Park", "M. Ahmed"],
        "abstract": "This study analyzes green infrastructure effectiveness in reducing urban heat across 30 cities globally. Results show 2-5°C temperature reductions in areas with strategic vegetation placement and cool roof implementations.",
        "year": 2024,
        "journal": "Urban Climate",
        "keywords": ["urban heat island", "green infrastructure", "climate adaptation", "urban planning", "sustainability"],
        "doi": "10.1016/j.uclim.2024.101789",
        "volume": "55",
        "issue": None,
        "pages": "101789",
    },
    {
        "id": "paper-010",
        "title": "Artificial Intelligence Ethics in Healthcare: A Cross-Cultural Perspective",
        "authors": ["F. Adeyemi", "K. Sato", "R. Martinez"],
        "abstract": "We examine ethical considerations for AI deployment in healthcare across different cultural contexts. Our framework addresses bias, transparency, and patient autonomy in AI-assisted medical decision-making.",
        "year": 2025,
        "journal": "Journal of Medical Ethics",
        "keywords": ["AI ethics", "healthcare", "cross-cultural", "medical AI", "bioethics"],
        "doi": "10.1136/jme-2025-109876",
        "volume": "51",
        "issue": "3",
        "pages": "178-192",
    },
    {
        "id": "paper-011",
        "title": "Genomic Surveillance of Emerging Infectious Diseases: Lessons from COVID-19",
        "authors": ["J. Kim", "A. Osei", "D. Fischer"],
        "abstract": "This review analyzes genomic surveillance infrastructure developed during COVID-19 and proposes frameworks for monitoring future pandemic threats. We emphasize the role of international data sharing and real-time sequencing.",
        "year": 2024,
        "journal": "The Lancet Infectious Diseases",
        "keywords": ["genomic surveillance", "pandemic preparedness", "COVID-19", "public health", "bioinformatics"],
        "doi": "10.1016/S1473-3099(24)00456",
        "volume": "24",
        "issue": "8",
        "pages": "892-905",
    },
    {
        "id": "paper-012",
        "title": "Microplastic Contamination in Marine Ecosystems: Distribution, Effects, and Remediation",
        "authors": ["T. Yamamoto", "L. Santos", "K. Bergmann"],
        "abstract": "We present a comprehensive analysis of microplastic distribution across major ocean basins. Our findings reveal significant bioaccumulation in food chains and propose novel bioremediation approaches.",
        "year": 2025,
        "journal": "Marine Pollution Bulletin",
        "keywords": ["microplastics", "marine pollution", "bioremediation", "ocean ecology", "environmental science"],
        "doi": "10.1016/j.marpolbul.2025.116234",
        "volume": "203",
        "issue": None,
        "pages": "116234",
    },
    {
        "id": "paper-013",
        "title": "Digital Democracy: How Social Media Shapes Political Participation in Young Voters",
        "authors": ["M. Rodriguez", "S. Johnson", "A. Patel"],
        "abstract": "This study investigates the relationship between social media engagement and political participation among voters aged 18-29. We find that targeted digital campaigns significantly increase voter turnout in local elections.",
        "year": 2024,
        "journal": "American Political Science Review",
        "keywords": ["digital democracy", "social media", "political participation", "youth voting", "elections"],
        "doi": "10.1017/S0003055424000123",
        "volume": "118",
        "issue": "4",
        "pages": "1567-1584",
    },
    {
        "id": "paper-014",
        "title": "Artificial Neural Networks for Climate Prediction: Advances in Long-Range Forecasting",
        "authors": ["W. Zhang", "H. Schmidt", "N. Patel"],
        "abstract": "We present novel transformer-based architectures for seasonal climate prediction. Our models outperform traditional numerical weather prediction for 3-6 month forecasts, particularly in tropical regions.",
        "year": 2025,
        "journal": "Nature Climate Change",
        "keywords": ["neural networks", "climate prediction", "weather forecasting", "deep learning", "atmospheric science"],
        "doi": "10.1038/s41558-025-00189",
        "volume": "15",
        "issue": "5",
        "pages": "445-458",
    },
    {
        "id": "paper-015",
        "title": "Precision Agriculture Using IoT and Edge Computing: A Scalable Framework",
        "authors": ["R. Kumar", "E. Anderson", "Y. Liu"],
        "abstract": "This paper proposes a scalable IoT framework for precision agriculture integrating edge computing for real-time crop monitoring. Field trials demonstrate 23% improvement in water efficiency and 15% yield increase.",
        "year": 2024,
        "journal": "Computers and Electronics in Agriculture",
        "keywords": ["precision agriculture", "IoT", "edge computing", "smart farming", "sustainability"],
        "doi": "10.1016/j.compag.2024.109234",
        "volume": "225",
        "issue": None,
        "pages": "109234",
    },
    {
        "id": "paper-016",
        "title": "Social Robotics in Elderly Care: A Multi-Site Randomized Controlled Trial",
        "authors": ["K. Tanaka", "M. Williams", "P. Chen"],
        "abstract": "We conduct the largest randomized trial of social robots in elderly care facilities (n=500). Results show significant improvements in loneliness scores and cognitive engagement among participants using companion robots.",
        "year": 2025,
        "journal": "Science Robotics",
        "keywords": ["social robotics", "elderly care", "clinical trial", "human-robot interaction", "gerontechnology"],
        "doi": "10.1126/scirobotics.ade5678",
        "volume": "10",
        "issue": "47",
        "pages": "eade5678",
    },
    {
        "id": "paper-017",
        "title": "Sustainable Fashion: Consumer Behavior and Circular Economy Models",
        "authors": ["A. Müller", "J. Santos", "L. Kim"],
        "abstract": "This study examines consumer attitudes toward sustainable fashion and evaluates circular economy business models. We find that transparency in supply chains significantly influences purchasing decisions.",
        "year": 2024,
        "journal": "Journal of Cleaner Production",
        "keywords": ["sustainable fashion", "circular economy", "consumer behavior", "supply chain", "sustainability"],
        "doi": "10.1016/j.jclepro.2024.142567",
        "volume": "468",
        "issue": None,
        "pages": "142567",
    },
    {
        "id": "paper-018",
        "title": "Federated Learning for Privacy-Preserving Medical Research Across Institutions",
        "authors": ["D. Park", "S. Nakamura", "R. Brown"],
        "abstract": "We propose a federated learning framework enabling multi-institutional medical research without sharing patient data. Our approach maintains model accuracy while providing formal privacy guarantees.",
        "year": 2025,
        "journal": "Nature Medicine",
        "keywords": ["federated learning", "privacy", "medical research", "data security", "healthcare AI"],
        "doi": "10.1038/s41591-025-02345",
        "volume": "31",
        "issue": "2",
        "pages": "312-325",
    },
    {
        "id": "paper-019",
        "title": "Ocean Acidification Effects on Coral Reef Ecosystems: A 10-Year Longitudinal Study",
        "authors": ["M. Ahmed", "T. Yamamoto", "K. Fischer"],
        "abstract": "This decade-long study documents coral reef degradation across the Great Barrier Reef. We identify critical pH thresholds and propose intervention strategies including assisted evolution of heat-resistant coral strains.",
        "year": 2024,
        "journal": "Science",
        "keywords": ["ocean acidification", "coral reefs", "marine biology", "climate change", "conservation"],
        "doi": "10.1126/science.adq5678",
        "volume": "384",
        "issue": "6701",
        "pages": "1234-1240",
    },
    {
        "id": "paper-020",
        "title": "Explainable AI for Legal Decision Support: Balancing Transparency and Accuracy",
        "authors": ["J. Martinez", "C. Williams", "A. Petrov"],
        "abstract": "We develop explainable AI systems for legal decision support that maintain high accuracy while providing interpretable reasoning. Our system assists judges in sentencing recommendations with transparency metrics.",
        "year": 2025,
        "journal": "Artificial Intelligence and Law",
        "keywords": ["explainable AI", "legal AI", "decision support", "transparency", "justice"],
        "doi": "10.1007/s10506-025-09456",
        "volume": "33",
        "issue": "1",
        "pages": "67-89",
    },
    {
        "id": "paper-021",
        "title": "Vertical Farming Systems: Energy Optimization and Urban Food Production",
        "authors": ["S. Singh", "H. Nakamura", "E. Johnson"],
        "abstract": "This study optimizes energy consumption in vertical farming facilities using AI-controlled LED lighting and climate systems. Our results demonstrate 40% energy reduction while maintaining crop yields.",
        "year": 2024,
        "journal": "Applied Energy",
        "keywords": ["vertical farming", "energy optimization", "urban agriculture", "controlled environment", "sustainability"],
        "doi": "10.1016/j.apenergy.2024.123456",
        "volume": "368",
        "issue": None,
        "pages": "123456",
    },
    {
        "id": "paper-022",
        "title": "Natural Language Processing for Low-Resource African Languages: Benchmarks and Models",
        "authors": ["F. Adeyemi", "A. Osei", "V. Singh"],
        "abstract": "We present new benchmarks and pre-trained models for 15 low-resource African languages. Our approach leverages cross-lingual transfer learning to achieve competitive performance on downstream NLP tasks.",
        "year": 2025,
        "journal": "Transactions of the Association for Computational Linguistics",
        "keywords": ["NLP", "low-resource languages", "African languages", "transfer learning", "computational linguistics"],
        "doi": "10.1162/tacl_a_00678",
        "volume": "13",
        "issue": None,
        "pages": "234-250",
    },
    {
        "id": "paper-023",
        "title": "Neural Prosthetics for Motor Recovery: Clinical Outcomes and Future Prospects",
        "authors": ["Y. Lee", "K. Tanaka", "P. Anderson"],
        "abstract": "We report clinical outcomes from a multi-center trial of brain-computer interfaces for motor recovery in stroke patients. 67% of participants showed significant improvement in upper limb function.",
        "year": 2024,
        "journal": "Neuron",
        "keywords": ["neural prosthetics", "brain-computer interface", "motor recovery", "neuroscience", "clinical trial"],
        "doi": "10.1016/j.neuron.2024.08.012",
        "volume": "112",
        "issue": "15",
        "pages": "2345-2358",
    },
    {
        "id": "paper-024",
        "title": "Carbon Capture Technologies: Comparative Analysis of Direct Air Capture Approaches",
        "authors": ["D. Müller", "N. Thompson", "R. Kumar"],
        "abstract": "This comparative analysis evaluates 12 direct air capture technologies for cost-effectiveness and scalability. We identify promising pathways for achieving gigaton-scale carbon removal by 2050.",
        "year": 2025,
        "journal": "Joule",
        "keywords": ["carbon capture", "direct air capture", "climate technology", "net zero", "energy"],
        "doi": "10.1016/j.joule.2025.01.003",
        "volume": "9",
        "issue": "2",
        "pages": "345-362",
    },
]


def _text_to_embedding(text: str) -> list[float]:
    """Deterministic hash-based embedding for demo purposes."""
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    if not tokens:
        return [0.0] * EMBEDDING_DIM

    token_counts = Counter(tokens)
    total = len(tokens)
    vec = [0.0] * EMBEDDING_DIM

    for token, count in token_counts.items():
        tf = count / total
        digest = hashlib.sha256(token.encode()).digest()
        for i in range(EMBEDDING_DIM):
            sign = 1.0 if digest[i % 32] % 2 == 0 else -1.0
            magnitude = (digest[(i + 1) % 32] / 255.0) * 2.0
            vec[i] += sign * magnitude * tf

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a)) or 1.0
    norm_b = math.sqrt(sum(x * x for x in b)) or 1.0
    return dot / (norm_a * norm_b)


def _build_paper_text(paper: dict) -> str:
    """Build text representation of a paper for embedding."""
    parts = [paper["title"], paper["abstract"]]
    parts.extend(paper["keywords"])
    parts.append(paper["journal"])
    return " ".join(parts)


_paper_embeddings = {}


def _get_paper_embedding(paper: dict) -> list[float]:
    if paper["id"] not in _paper_embeddings:
        text = _build_paper_text(paper)
        _paper_embeddings[paper["id"]] = _text_to_embedding(text)
    return _paper_embeddings[paper["id"]]


def _precompute_embeddings():
    for paper in MOCK_PAPERS:
        _get_paper_embedding(paper)


_precompute_embeddings()


def search_papers(query: str, limit: int = 10) -> list[dict]:
    """Search papers using vector similarity."""
    query_vec = _text_to_embedding(query)

    results = []
    for paper in MOCK_PAPERS:
        paper_vec = _get_paper_embedding(paper)
        similarity = _cosine_similarity(query_vec, paper_vec)
        results.append({
            **paper,
            "relevance_score": round(similarity * 100, 2),
        })

    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return results[:limit]


def get_all_papers() -> list[dict]:
    """Return all papers in the database."""
    return MOCK_PAPERS


def format_citation_apa(citation: dict) -> str:
    """Format citation in APA style."""
    authors = citation["authors"]
    if len(authors) > 3:
        author_str = ", ".join(authors[:3]) + ", et al."
    else:
        author_str = ", ".join(authors[:-1]) + f", & {authors[-1]}" if len(authors) > 1 else authors[0]

    volume = citation.get("volume", "")
    issue = citation.get("issue", "")
    pages = citation.get("pages", "")

    vol_issue = f", {volume}"
    if issue:
        vol_issue += f"({issue})"
    if pages:
        vol_issue += f", {pages}"

    return f"{author_str} ({citation['year']}). {citation['title']}. {citation['journal']}{vol_issue}."


def format_citation_mla(citation: dict) -> str:
    """Format citation in MLA style."""
    authors = citation["authors"]
    if len(authors) > 3:
        author_str = f"{authors[0]}, et al."
    elif len(authors) == 2:
        author_str = f"{authors[0]}, and {authors[1]}"
    elif len(authors) == 3:
        author_str = f"{authors[0]}, {authors[1]}, and {authors[2]}"
    else:
        author_str = authors[0]

    volume = citation.get("volume", "")
    issue = citation.get("issue", "")
    pages = citation.get("pages", "")

    vol_str = f", vol. {volume}" if volume else ""
    issue_str = f", no. {issue}" if issue else ""
    pages_str = f", pp. {pages}" if pages else ""

    return f'{author_str}. "{citation["title"]}." {citation["journal"]}{vol_str}{issue_str}, {citation["year"]}{pages_str}.'


def format_citation_ieee(citation: dict) -> str:
    """Format citation in IEEE style."""
    authors = citation["authors"]
    formatted_authors = []
    for author in authors[:6]:
        parts = author.strip().split()
        if len(parts) >= 2:
            initials = " ".join([f"{p[0]}." for p in parts[:-1]])
            formatted_authors.append(f"{initials} {parts[-1]}")
        else:
            formatted_authors.append(author)

    if len(authors) > 6:
        formatted_authors.append("et al.")

    author_str = ", ".join(formatted_authors[:-1])
    if len(formatted_authors) > 1:
        author_str += f", and {formatted_authors[-1]}"
    else:
        author_str = formatted_authors[0]

    volume = citation.get("volume", "")
    issue = citation.get("issue", "")
    pages = citation.get("pages", "")

    vol_str = f"vol. {volume}" if volume else ""
    issue_str = f", no. {issue}" if issue else ""
    pages_str = f", pp. {pages}" if pages else ""

    return f'{author_str}, "{citation["title"]}," {citation["journal"]}, {vol_str}{issue_str}{pages_str}, {citation["year"]}.'


def format_citation(citation: dict, style: str) -> str:
    """Format citation in the specified style."""
    formatters = {
        "APA": format_citation_apa,
        "MLA": format_citation_mla,
        "IEEE": format_citation_ieee,
    }
    formatter = formatters.get(style)
    if not formatter:
        raise ValueError(f"Unsupported citation style: {style}")
    return formatter(citation)


def create_citation_id() -> str:
    return str(uuid.uuid4())
