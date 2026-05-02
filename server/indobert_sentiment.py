#!/usr/bin/env python3
"""
IndoBERT Sentiment Analysis Server
Runs on http://localhost:9014/api/v1/sentiment
"""

from flask import Flask, request, jsonify
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)

print("Loading IndoBERT sentiment model...")
try:
    # Indonesian sentiment model
    classifier = pipeline(
        "sentiment-analysis",
        model="w11wo/indonesian-roberta-base-sentiment-classifier",
        tokenizer="w11wo/indonesian-roberta-base-sentiment-classifier"
    )
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    # Fallback to multilingual model
    classifier = pipeline(
        "sentiment-analysis",
        model="nlptown/bert-base-multilingual-uncased-sentiment"
    )
    print("Using fallback model")

def map_sentiment(label):
    """Map model labels to standard sentiment"""
    label_lower = label.lower()
    if 'positive' in label_lower or '5' in label or '4' in label or label == 'POSITIVE':
        return 'positive'
    elif 'negative' in label_lower or '1' in label or '2' in label or label == 'NEGATIVE':
        return 'negative'
    else:
        return 'neutral'

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model": "indobert-sentiment"})

@app.route('/api/v1/sentiment', methods=['POST'])
@app.route('/api/v1/sentiment/', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({"error": "Text is required"}), 400

        # Truncate if too long
        text = text[:512]

        # Get prediction
        result = classifier(text)[0]

        sentiment = map_sentiment(result['label'])
        confidence = result['score']

        return jsonify({
            "text": text,
            "sentiment": sentiment,
            "confidence": round(confidence, 4),
            "model": "indobert-sentiment"
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "service": "IndoBERT Sentiment Analysis",
        "model": "w11wo/indonesian-roberta-base-sentiment-classifier",
        "endpoints": {
            "health": "/health",
            "sentiment": "/api/v1/sentiment (POST)"
        }
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("IndoBERT Sentiment Server")
    print("Running on http://localhost:9014")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=9014, debug=False)
