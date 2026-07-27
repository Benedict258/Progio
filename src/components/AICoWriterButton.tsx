"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface AICoWriterButtonProps {
  trackType: string;
  sectionKey: string;
  onStream: (content: string) => void;
}

export function AICoWriterButton({
  trackType,
  sectionKey,
  onStream,
}: AICoWriterButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_type: sectionKey, track_type: trackType }),
      });

      if (!res.ok) {
        const fallback = getFallbackContent(trackType, sectionKey);
        onStream(fallback);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        const fallback = getFallbackContent(trackType, sectionKey);
        onStream(fallback);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        onStream(accumulated);
      }
    } catch {
      const fallback = getFallbackContent(trackType, sectionKey);
      onStream(fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Sparkles size={16} />
      )}
      {loading ? "Generating..." : "AI Co-Writer"}
    </button>
  );
}

function getFallbackContent(trackType: string, sectionKey: string): string {
  const fallbacks: Record<string, Record<string, string>> = {
    grant: {
      abstract:
        "This research project proposes an innovative approach to addressing critical challenges in the field. Our interdisciplinary team combines expertise in artificial intelligence, domain science, and public health to develop novel solutions that bridge the gap between cutting-edge research and real-world impact.",
      technical_approach:
        "We employ a mixed-methods approach combining machine learning algorithms with rigorous experimental design. Our technical framework leverages state-of-the-art deep learning architectures, validated through extensive benchmarking against established baselines.",
      budget:
        "The proposed budget covers personnel costs (2 postdoctoral researchers, 1 PhD student), equipment and computing resources, travel for collaborative meetings, and publication costs. Total requested: $250,000 over 3 years.",
      impact:
        "This project will advance fundamental understanding while delivering practical tools and frameworks that can be directly applied by practitioners and policymakers. The expected outcomes include peer-reviewed publications, open-source software, and policy recommendations.",
      timeline:
        "Year 1: Foundation and data collection (Months 1-12). Year 2: Core development and testing (Months 13-24). Year 3: Validation, dissemination, and impact activities (Months 25-36).",
    },
    scholarship: {
      personal_statement:
        "My journey in academic research began with a deep curiosity about how technology can transform healthcare delivery in underserved communities. Growing up in Accra, I witnessed firsthand the disparities in healthcare access that inspired me to pursue a career at the intersection of artificial intelligence and global health.",
      academic_goals:
        "My short-term goal is to complete my PhD research on AI-driven diagnostic tools for resource-limited settings. Long-term, I aim to establish a research laboratory focused on developing equitable AI solutions for healthcare in sub-Saharan Africa.",
      leadership:
        "As president of the Graduate Student Research Council, I organized symposiums that brought together over 200 researchers. I also mentored junior students and led diversity initiatives within our department.",
      recommendations:
        "Three letters of recommendation have been secured from leading researchers in the field, including my advisor Dr. Kwame Mensah, collaborator Dr. Sarah Chen at MIT, and department chair Prof. Aisha Patel.",
    },
    research: {
      literature_review:
        "Recent advances in transformer architectures have demonstrated remarkable performance across various NLP tasks. However, limited research has explored their application in low-resource languages prevalent in sub-Saharan Africa. This gap presents both a challenge and an opportunity for impactful research.",
      hypothesis:
        "We hypothesize that transfer learning techniques combined with culturally-informed data augmentation can significantly improve NLP model performance for African languages, reducing the performance gap with high-resource languages by at least 40%.",
      methodology:
        "Our approach combines quantitative experiments with qualitative evaluation. We will curate multilingual datasets, develop novel transfer learning architectures, and conduct extensive evaluation using both automatic metrics and human evaluation by native speakers.",
      expected_outcomes:
        "Expected outcomes include: (1) A comprehensive benchmark for African language NLP, (2) Novel transfer learning methods adapted for low-resource settings, (3) Open-source tools and datasets for the research community, (4) At least 3 publications in top-tier venues.",
    },
  };

  return fallbacks[trackType]?.[sectionKey] || "Content will be generated here...";
}
