// Sumopod AI - Nalar Avatar Explanations

const SUMOPOD_API_URL = process.env.ANTHROPIC_BASE_URL || "https://ai.sumopod.com";
const SUMOPOD_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const SUMOPOD_MODEL = process.env.ANTHROPIC_MODEL || "MiniMax-M2.7-highspeed";

export interface ExplanationResult {
  explanation: string;
  model: string;
}

// Explain article content - Nalar explains what the article means
export async function explainArticle(
  title: string,
  content: string,
  sentiment: string,
  confidence: number,
  newspaperName: string
): Promise<ExplanationResult> {
  if (!SUMOPOD_API_KEY) {
    const mockExplanations: Record<string, string[]> = {
      positive: [
        `This article reports on "${title}", highlighting positive developments. The coverage is likely to shape public perception constructively.`,
        `With a positive sentiment, this article emphasizes the favorable aspects of "${title}" that deserve recognition and can serve as motivation.`,
        `The topic "${title}" is discussed from a supportive angle, offering readers a sense of optimism.`
      ],
      negative: [
        `This article highlights negative issues surrounding "${title}". Special attention is warranted as it may influence public opinion adversely.`,
        `With a negative sentiment, "${title}" is examined from a critical perspective, pointing to challenges that require collective attention.`,
        `The topic "${title}" is reported critically, potentially indicating underlying problems or tensions that need to be addressed.`
      ],
      neutral: [
        `This article presents factual information about "${title}" without taking sides or making emotional judgments.`,
        `With a neutral approach, "${title}" is discussed objectively, allowing readers to form their own opinions.`,
        `The topic "${title}" is covered in a balanced manner, providing facts without adding opinions that could sway reader perception.`
      ]
    };
    
    const explanations = mockExplanations[sentiment] || mockExplanations.neutral;
    const randomExplanation = explanations[Math.floor(Math.random() * explanations.length)];
    
    return {
      explanation: randomExplanation,
      model: "MiniMax (mock)",
    };
  }

  const sentimentLabel = sentiment === "positive" ? "positive" : sentiment === "negative" ? "negative" : "neutral";

  try {
    
    const response = await fetch(`${SUMOPOD_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUMOPOD_API_KEY}`,
      },
      body: JSON.stringify({
        model: SUMOPOD_MODEL,
        messages: [
          {
            role: "system",
            content: `You are Nalar, an AI sentiment analyst for print media. Explain the article content in clear English (3-4 sentences). Focus on what is reported and its implications.`
          },
          {
            role: "user",
            content: `Explain the following article:\n\nTitle: "${title}"\nContent: "${content}"\nMedia: ${newspaperName}\nSentiment: ${sentimentLabel} (${(confidence * 100).toFixed(0)}% confidence)`
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sumopod API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "";

    return {
      explanation: explanation.trim(),
      model: SUMOPOD_MODEL,
    };
  } catch (error) {
    console.error("Sumopod API error:", error);
    return {
      explanation: `The article "${title}" has a ${sentimentLabel} sentiment with ${(confidence * 100).toFixed(0)}% confidence.`,
      model: "MiniMax (error)",
    };
  }
}

// Get general sentiment overview for a batch of articles
export async function getSentimentOverview(
  articles: Array<{ title: string; sentiment: string }>,
  sourceName: string
): Promise<ExplanationResult> {
  if (!SUMOPOD_API_KEY) {
    const positiveCount = articles.filter(a => a.sentiment === "positive").length;
    const negativeCount = articles.filter(a => a.sentiment === "negative").length;
    const neutralCount = articles.filter(a => a.sentiment === "neutral").length;
    
    return {
      explanation: `Dari ${articles.length} artikel di ${sourceName}: ${positiveCount} positif, ${neutralCount} netral, ${negativeCount} negatif. Overall cenderung ${positiveCount > negativeCount ? 'positif' : negativeCount > positiveCount ? 'negatif' : 'netral'}.`,
      model: "MiniMax (mock)",
    };
  }

  try {
    const response = await fetch(`${SUMOPOD_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUMOPOD_API_KEY}`,
      },
      body: JSON.stringify({
        model: SUMOPOD_MODEL,
        messages: [
          {
            role: "system",
            content: `Anda adalah Nalar, AI analis media cetak. Berikan ringkasan sentimen dalam 2-3 kalimat.`
          },
          {
            "role": "user",
            content: `Ringkas sentimen dari ${articles.length} artikel di ${sourceName}:\n\n${articles.map((a, i) => `${i + 1}. "${a.title}" - ${a.sentiment}`).join('\n')}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sumopod API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "";

    return {
      explanation: explanation.trim(),
      model: SUMOPOD_MODEL,
    };
  } catch (error) {
    console.error("Sumopod API error:", error);
    return {
      explanation: `Total ${articles.length} artikel.`,
      model: "MiniMax (error)",
    };
  }
}
