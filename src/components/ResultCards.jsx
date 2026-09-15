import { useEffect, useState } from 'react';
import FlipCard from './FlipCard.jsx';
import GaugeCard from './GaugeCard.jsx';
import StatusBanner from './StatusBanner.jsx';
import DoseCard from './DoseCard.jsx';
import RiskGauge from './RiskGauge.jsx';
import Timeline from './Timeline.jsx';
import InterpretationBack from './InterpretationBack.jsx';
import { REFS, STATE_LABEL, getUrgencyColor, getRiskZone, ABSORPTION_RULES } from '../utils/diagnose.js';

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '');
}

function truncateWords(text, n) {
  const words = text.trim().split(/\s+/);
  if (words.length <= n) return text;
  return words.slice(0, n).join(' ') + '...';
}

const SYMPTOM_DOT_COLOR = { hypothyroid: 'var(--red)', borderline_hypo: 'var(--red)', hyperthyroid: 'var(--amber)', borderline_hyper: 'var(--amber)', optimal: 'var(--green)' };

export default function ResultCards({ result, riskScore, onRiskScoreChange, automations, onNewResults }) {
  // Entrance animations should only ever play once, right when the deck first
  // appears — not every time a card is opened and closed again.
  const [entranceDone, setEntranceDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntranceDone(true), 500);
    return () => clearTimeout(t);
  }, []);

  const plainInterpretation = stripHtml(result.interpretation);
  const overviewIcon = riskScore > 60 ? '\u{1F534}' : riskScore > 20 ? '\u{1F7E1}' : '\u{1F7E2}';
  const actionIcon = riskScore > 60 ? '\u{1F6A8}' : '\u{1F4CB}';
  const urgencyColor = getUrgencyColor(result.dx);
  const riskColor = getRiskZone(riskScore).color;

  const cardDefs = {
    overview: {
      id: 'overview',
      icon: overviewIcon,
      title: 'Overview',
      summary: `TSH ${result.tsh} · ${STATE_LABEL[result.dx]}`,
      borderColor: riskColor,
      glowColor: { shadow: '6px 8px 24px rgba(0,0,0,0.5)', glow: hexToRgba(riskColor, 0.2) },
      pulseWorse: automations.worse,
      improvingTag: automations.improved,
      renderBack: () => (
        <>
          <div style={{ maxWidth: 320, margin: '0 auto 1.5rem' }}>
            <RiskGauge score={riskScore} onChange={onRiskScoreChange} />
          </div>
          <div className="gauge-grid">
            <GaugeCard name="TSH · Thyroid Stimulating Hormone" value={result.tsh} unit={REFS.tsh.unit} range={REFS.tsh} override={result.tshOverride} />
            <GaugeCard name="Free T3 · Triiodothyronine" value={result.ft3} unit={REFS.ft3.unit} range={REFS.ft3} />
            <GaugeCard name="Free T4 · Thyroxine" value={result.ft4} unit={REFS.ft4.unit} range={REFS.ft4} />
          </div>
          <StatusBanner dxClass={result.banner.cssClass} icon={result.banner.icon} title={result.banner.title} desc={result.banner.desc} />
          <DoseCard guidance={result.doseGuidance} />
        </>
      ),
    },
    interpretation: {
      id: 'interpretation',
      icon: '\u{1F9E0}',
      title: 'What this means',
      summary: truncateWords(plainInterpretation, 8),
      borderColor: '#3B82F6',
      glowColor: { shadow: '-4px 8px 24px rgba(0,0,0,0.5)', glow: 'rgba(59,130,246,0.2)' },
      renderBack: () => (
        <InterpretationBack
          text={plainInterpretation}
          symptoms={result.symptoms}
          actions={result.actions}
          ageNote={result.ageNote}
          statusNote={result.statusNote}
          dotColor={SYMPTOM_DOT_COLOR[result.dx]}
        />
      ),
    },
    supplements: {
      id: 'supplements',
      icon: '\u{1F48A}',
      title: 'Supplements & Food',
      summary: `${result.supplements.cards.length} supplements recommended`,
      borderColor: '#8B5CF6',
      glowColor: { shadow: '5px 6px 20px rgba(0,0,0,0.5)', glow: 'rgba(139,92,246,0.2)' },
      renderBack: () => (
        <>
          {result.supplements.cards.map((c, i) => (
            <div className="supplement-card-stacked" key={c.name}>
              <div className="supplement-name">
                {c.name}
                {i === 0 && <span className="priority-badge">Priority #1</span>}
                {i === 1 && <span className="priority-badge">Priority #2</span>}
              </div>
              <div className="supplement-dose">{c.dose}</div>
              <div className="supplement-why">{c.why}</div>
              {c.note && <div className="supplement-note">{c.note}</div>}
              <div className="supplement-card-footer">
                <span className="supplement-timing">{c.timing}</span>
                {c.warning && <span className="supplement-warning">{c.warning}</span>}
              </div>
            </div>
          ))}
          {result.supplements.food && (
            <div className="food-grid">
              <div className="food-list-block">
                <div className="food-list-title eat">Eat more</div>
                <ul className="eat-list">
                  {result.supplements.food.eat.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
              <div className="food-list-block">
                <div className="food-list-title limit">Limit</div>
                <ul className="limit-list">
                  {result.supplements.food.limit.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            </div>
          )}
          <div className="supplement-disclaimer">Always consult your doctor before starting supplements, especially if on medication.</div>
        </>
      ),
    },
    action: {
      id: 'action',
      icon: actionIcon,
      title: 'Action Plan',
      summary: truncateWords(result.timeline[0].what, 10),
      borderColor: urgencyColor,
      glowColor: { shadow: '-6px 10px 28px rgba(0,0,0,0.5)', glow: hexToRgba(urgencyColor, 0.2) },
      renderBack: (close) => (
        <>
          <div className="section-label">Monitoring Plan</div>
          <div className="section-title" style={{ fontSize: '1rem' }}>Suggested clinic visit schedule</div>
          <Timeline items={result.timeline} />
          <div className="info-card" style={{ marginTop: '1.2rem' }}>
            <div className="info-card-title">
              <div className="dot" style={{ background: 'var(--purple)' }} />
              Levothyroxine absorption — critical rules
            </div>
            <ul className="action-list">
              {ABSORPTION_RULES.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
          <div className="disclaimer">
            <strong>Medical disclaimer:</strong> ThyroTrack is an informational tool only and does not constitute medical advice, diagnosis, or treatment. All dosage changes must be discussed with and approved by a qualified physician or endocrinologist. Never adjust your levothyroxine dose without medical supervision. Reference ranges used are standard laboratory values and may vary slightly by lab.
          </div>
          <button className="back-to-results-link" onClick={close}>{'← Back to results'}</button>
        </>
      ),
    },
  };

  // Default slot order: overview, interpretation, supplements, action.
  // Above risk score 60, Action Plan takes the top-left slot and Overview
  // takes its old bottom-right slot — everything else stays put.
  let order = [cardDefs.overview, cardDefs.interpretation, cardDefs.supplements, cardDefs.action];
  if (riskScore > 60) {
    order = [cardDefs.action, cardDefs.interpretation, cardDefs.supplements, cardDefs.overview];
  }

  return (
    <div>
      <div className="new-results-bar">
        <button className="new-results-link" onClick={onNewResults}>{'← New results'}</button>
      </div>

      {automations.same && (
        <div className="same-result-banner">
          Same result as your last entry — your levels have not changed since {automations.lastDate}.
        </div>
      )}

      <div className="card-deck">
        {order.map((card, slot) => (
          <FlipCard
            key={card.id}
            slot={slot}
            entering={!entranceDone}
            borderColor={card.borderColor}
            glowColor={card.glowColor}
            icon={card.icon}
            title={card.title}
            summary={card.summary}
            pulseWorse={card.pulseWorse}
            improvingTag={card.improvingTag}
            renderBack={card.renderBack}
          />
        ))}
      </div>
    </div>
  );
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
