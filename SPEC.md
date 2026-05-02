# Sentimen Media - AI-Powered Media Sentiment Analyzer

## Concept & Vision

Sentimen Media adalah aplikasi web yang menganalisis sentimen dari artikel media (online/print) menggunakan AI. Aplikasi ini menggunakan karakter AI agent untuk memberikan pengalaman yang engaging dan personal dalam memahami sentimen berita.

**Personality:** Wise, analytical, slightly mystical. Like having a media analyst who speaks with wisdom and clarity.

**Character:** "Nalar" - An analytical spirit guide who interprets media sentiment with wisdom.

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, TailwindCSS, Framer Motion
- **AI Integration:** OpenRouter API (Claude for sentiment analysis)
- **Styling:** Custom CSS with cosmic dark theme
- **Icons:** Lucide React

## Design Language

**Aesthetic:** Dark analytical dashboard with mystical touches - professional yet engaging.

**Colors:**
- Primary: `#8B5CF6` (Violet - analytical)
- Secondary: `#06B6D4` (Cyan - clarity)
- Positive: `#22C55E` (Green)
- Negative: `#EF4444` (Red)
- Neutral: `#A1A1AA` (Gray)
- Background: `#0F0D1A` (Deep cosmic)
- Surface: `#1A1625` (Dark purple-gray)
- Text: `#E2E0F0` (Soft white)

**Typography:**
- Headers: Geist (modern, clean)
- Body: Geist (readable)

**Motion:** Smooth transitions, subtle fade-ins, progress indicators

## Core Features

### 1. Text Sentiment Analysis
- Input article text directly
- AI analyzes sentiment (positive/negative/neutral)
- Confidence score display
- Detailed breakdown with reasoning

### 2. Entity & Aspect Sentiment
- Extract named entities (people, organizations, locations)
- Aspect-based sentiment (harga, kualitas, layanan, produk)
- Per-entity sentiment scores

### 3. Emotion Detection
- Detect emotions: senang, marah, takut, sedih, terkejut, jijik
- Emotion intensity scores
- Emotion distribution chart

### 4. Media Summary
- Quick summary of overall sentiment
- Key positive/negative points
- Recommended action items

### 5. Sentiment History
- Store analysis results in localStorage
- Browse past analyses
- Compare sentiment over time

## Data Models

### SentimentAnalysis
```typescript
interface SentimentAnalysis {
  id: string;
  text: string;
  source: string;
  overall_sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  entities: Entity[];
  aspects: Aspect[];
  emotions: Emotion[];
  summary: string;
  key_points: KeyPoint[];
  analyzed_at: string;
}

interface Entity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'other';
  sentiment: 'positive' | 'negative' | 'neutral';
  mentions: number;
}

interface Aspect {
  name: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  evidence: string[];
}

interface Emotion {
  type: string;
  intensity: number; // 0-100
}

interface KeyPoint {
  type: 'positive' | 'negative' | 'neutral';
  text: string;
}
```

## API Endpoints

### POST /api/sentiment/analyze
Analyze sentiment of provided text

**Request:**
```json
{
  "text": "Artikel lengkap di sini...",
  "source": "kompas.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "overall_sentiment": "negative",
    "confidence": 0.85,
    "entities": [...],
    "aspects": [...],
    "emotions": [...],
    "summary": "...",
    "key_points": [...],
    "analyzed_at": "2026-05-02T10:00:00Z"
  }
}
```

## Pages

1. **/** - Landing with quick analysis input
2. **/analysis/[id]** - Full analysis view with visualizations
3. **/history** - Past analyses list

## Character: Nalar

**Appearance:** A mystical figure with glowing violet eyes, representing analytical wisdom.

**Personality:**
- Speaks with clarity and wisdom
- Provides insights, not just data
- Encourages critical thinking
- Indonesian language focus

**Messages:**
- Greeting: "Namaku Nalar. Aku akan membantumu memahami sentimen di balik kata-kata."
- Analyzing: "Aku sedang membaca... sabar sedikit ya."
- Positive: "Bagus! Ada cahaya di tengah kegelapan ini."
- Negative: "Hmm, tampak ada badai yang mendekat..."
- Neutral: "Seimbang, seperti langit sore yang tenang."

## Future Enhancements

1. PDF/Image upload with OCR
2. Batch analysis
3. Sentiment comparison dashboard
4. Alert system for brand monitoring
5. Multi-language support
