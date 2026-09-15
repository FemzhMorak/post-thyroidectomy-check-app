import { computeTrend } from '../utils/resultsHistory.js';

const COLOR = { green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)' };

export default function TrendPrediction({ history }) {
  const trend = computeTrend(history);
  if (!trend) return null;

  return (
    <div className="trend-prediction-card">
      <div className="trend-prediction-label">TSH Trend Prediction</div>
      <div className="trend-prediction-text" style={{ color: COLOR[trend.color] }}>
        {trend.message}
      </div>
    </div>
  );
}
