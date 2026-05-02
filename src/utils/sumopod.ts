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
    // Mock explanation based on sentiment
    const sentimentLabel = sentiment === "positive" ? "positif" : sentiment === "negative" ? "negatif" : "netral";
    
    const mockExplanations: Record<string, string[]> = {
      positive: [
        `Artikel ini memberitakan tentang "${title}" yang menunjukkan perkembangan positif. Berita ini kemungkinan besar mempengaruhi persepsi publik secara konstruktif.`,
        `Dengan sentimen positif, artikel ini menyoroti aspek-aspek baik dari "${title}" yang layak diapresiasi dan bisa menjadi motivasi.`,
        `Topik "${title}" dibahas dengan sudut pandang yang mendukung dan memberikan optimism terhadap pembaca.`
      ],
      negative: [
        `Artikel ini menyoroti isu negatif terkait "${title}". Perlu perhatian khusus karena bisa mempengaruhi opini publik secara negatif.`,
        `Dengan sentimen negatif, "${title}" dibahas dari sisi permasalahannya yang perlu menjadi perhatian bersama.`,
        `Topik "${title}" diberitakan dengan pendekatan kritis yang mungkin mengindikasikan adanya tantangan atau masalah yang perlu diselesaikan.`
      ],
      neutral: [
        `Artikel ini menyampaikan informasi faktual tentang "${title}" tanpa memihak atau memberikan penilaian emosional.`,
        `Dengan pendekatan netral, "${title}" dibahas secara objektif sehingga pembaca bisa membentuk opini sendiri.`,
        `Topik "${title}" disampaikan secara balanced, memberikan fakta tanpa menambahkan opini yang bisa mempengaruhi persepsi pembaca.`
      ]
    };
    
    const explanations = mockExplanations[sentiment] || mockExplanations.neutral;
    const randomExplanation = explanations[Math.floor(Math.random() * explanations.length)];
    
    return {
      explanation: randomExplanation,
      model: "MiniMax (mock)",
    };
  }

  const sentimentLabel = sentiment === "positive" ? "positif" : sentiment === "negative" ? "negatif" : "netral";

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
            content: `Anda adalah Nalar, AI analis sentimen media cetak Indonesia. Jelaskan isi artikel dengan bahasa Indonesia yang mudah dipahami (3-4 kalimat). Fokus pada apa yang diberitakan dan implikasinya.`
          },
          {
            role: "user",
            content: `Jelaskan artikel berikut:\n\nJudul: "${title}"\nIsi: "${content}"\nMedia: ${newspaperName}\nSentimen: ${sentimentLabel} (${(confidence * 100).toFixed(0)}% keyakinan)`
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
      explanation: `Artikel "${title}" memiliki sentimen ${sentimentLabel} dengan ${(confidence * 100).toFixed(0)}% keyakinan.`,
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
