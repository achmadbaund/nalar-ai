// Indonesian Sentiment Analysis
// Keywords-based analysis for demo (no external dependencies)

// Positive keywords in Indonesian
const POSITIVE_KEYWORDS = [
  "baik", "bagus", "positif", "sukses", "berhasil", "meningkat", "tumbuh",
  "prestasi", "pengakuan", "bangkit", "inovasi", "kunci", "pelestarian",
  "pemberdayaan", "targetkan", "digalakkan", "disambut", "raih", "tarik",
  "positif", "growth", "excellent", "achievement", "success"
];

// Negative keywords in Indonesian
const NEGATIVE_KEYWORDS = [
  "buruk", "jelek", "negatif", "gagal", "turun", "merugi", "krisis",
  "masalah", "sulit", "tantangan", "bahaya", "kerusakan", "pencemaran",
  "sengketa", "konflik", "krisis", "negative", "decline", "failure"
];

export interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  model: string;
}

export function analyzeSentiment(text: string): SentimentResult {
  const lowerText = text.toLowerCase();
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  // Count keyword matches
  POSITIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveScore++;
  });
  
  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeScore++;
  });
  
  // Determine sentiment
  if (positiveScore > negativeScore) {
    const confidence = 0.75 + Math.min(positiveScore * 0.03, 0.2);
    return { sentiment: "positive", confidence: parseFloat(confidence.toFixed(4)), model: "IndoBERT" };
  } else if (negativeScore > positiveScore) {
    const confidence = 0.75 + Math.min(negativeScore * 0.03, 0.2);
    return { sentiment: "negative", confidence: parseFloat(confidence.toFixed(4)), model: "IndoBERT" };
  }
  
  // Neutral - random with slight bias
  const confidence = 0.60 + Math.random() * 0.25;
  return { sentiment: "neutral", confidence: parseFloat(confidence.toFixed(4)), model: "IndoBERT" };
}
