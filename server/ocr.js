const Tesseract = require('tesseract.js');

const PATTERNS = {
  tsh: /TSH[:\s]+(\d+\.?\d*)/i,
  ft3: /Free\s*T3[:\s]+(\d+\.?\d*)/i,
  ft4: /Free\s*T4[:\s]+(\d+\.?\d*)/i,
};

async function scanLabReport(buffer) {
  const { data } = await Tesseract.recognize(buffer, 'eng');
  const text = data.text || '';

  const extracted = {};
  const matchConfidences = [];

  for (const [key, pattern] of Object.entries(PATTERNS)) {
    const match = text.match(pattern);
    if (match) {
      extracted[key] = parseFloat(match[1]);
      matchConfidences.push(1);
    } else {
      matchConfidences.push(0);
    }
  }

  // Blend Tesseract's own word-level confidence (0-100) with how many of the
  // three expected markers we actually matched, so a clean OCR read of an
  // unrelated document doesn't score as "high confidence".
  const ocrConfidence = (data.confidence || 0) / 100;
  const matchRate = matchConfidences.reduce((a, b) => a + b, 0) / matchConfidences.length;
  const confidence = Math.round(((ocrConfidence * 0.4 + matchRate * 0.6)) * 100) / 100;

  return {
    tsh: extracted.tsh ?? null,
    ft3: extracted.ft3 ?? null,
    ft4: extracted.ft4 ?? null,
    confidence,
    rawTextLength: text.length,
  };
}

module.exports = { scanLabReport };
