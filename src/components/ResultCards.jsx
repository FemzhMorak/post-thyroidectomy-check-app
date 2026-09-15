import { useEffect, useState } from 'react';
import FlipCard from './FlipCard.jsx';
import GaugeCard from './GaugeCard.jsx';
import StatusBanner from './StatusBanner.jsx';
import DoseCard from './DoseCard.jsx';
import RiskGauge from './RiskGauge.jsx';
import Timeline from './Timeline.jsx';
import InterpretationBack from './InterpretationBack.jsx';
import ComparisonTable from './ComparisonTable.jsx';
import { ThyroidIcon, BrainIcon, MoleculeIcon, CalendarIcon } from './CardIllustrations.jsx';
import { REFS, STATE_LABEL, getUrgencyColor, getRiskZone, ABSORPTION_RULES } from '../utils/diagnose.js';

const BLANK_CARDS = [
  { id: 'overview', icon: '\u{1F7E1}', title: 'Overview', illustration: <ThyroidIcon /> },
  { id: 'interpretation', icon: '\u{1F9E0}', title: 'What this means', illustration: <BrainIcon /> },
  { id: 'supplements', icon: '\u{1F48A}', title: 'Supplements & Food', illustration: <MoleculeIcon /> },
  { id: 'action', icon: '\u{1F4CB}', title: 'Action Plan', illustration: <CalendarIcon /> },
];
const BLANK_GLOW = { shadow: '6px 8px 24px rgba(0,0,0,0.5)', glow: 'rgba(59,130,246,0.06)' };

// Rising-fill color per diagnosis state (also drives the background particle
// network's color shift, kept in sync via the same 4-state mapping).
const FILL_COLOR = {
  hypothyroid: 'rgba(239, 68, 68, 0.08)',
  borderline_hypo: 'rgba(245, 158, 11, 0.08)',
  borderline_hyper: 'rgba(245, 158, 11, 0.08)',
  hyperthyroid: 'rgba(245, 158, 11, 0.08)',
  optimal: 'rgba(16, 185, 129, 0.08)',
};

const URGENCY_LABEL = {
  hypothyroid: 'High Priority',
  hyperthyroid: 'High Priority',
  borderline_hypo: 'Monitor',
  borderline_hyper: 'Monitor',
  optimal: 'Routine',
};

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '');
}

function truncateWords(text, n) {
  const words = text.trim().split(/\s+/);
  if (words.length <= n) return text;
  return words.slice(0, n).join(' ') + '...';
}

const SYMPTOM_DOT_COLOR = { hypothyroid: 'var(--red)', borderline_hypo: 'var(--red)', hyperthyroid: 'var(--amber)', borderline_hyper: 'var(--amber)', optimal: 'var(--green)' };

export default function ResultCards({ result, riskScore, onRiskScoreChange, automations, onNewResults, pulseTick, variant = 'desktop' }) {
  const compact = variant === 'mobile';
  const deckClassName = compact ? 'card-deck card-deck-mobile' : 'card-deck';

  // Entrance animations should only ever play once, right when the deck first
  // appears — not every time a card is opened and closed again.
  const [entranceDone, setEntranceDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntranceDone(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Re-analyze flash: briefly apply a pulse class to every card whenever
  // pulseTick increments (existing already-populated results, not first fill).
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (!pulseTick) return;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 450);
    return () => clearTimeout(t);
  }, [pulseTick]);

  if (!result) {
    return (
      <div className={deckClassName}>
        {BLANK_CARDS.map((card, slot) => (
          <FlipCard
            key={card.id}
            slot={slot}
            stagger={slot}
            entering={!entranceDone}
            borderColor="var(--border)"
            glowColor={BLANK_GLOW}
            icon={card.icon}
            title={card.title}
            illustration={card.illustration}
            compact={compact}
            blank
          />
        ))}
      </div>
    );
  }

  const plainInterpretation = stripHtml(result.interpretation);
  const overviewIcon = riskScore > 60 ? '\u{1F534}' : riskScore > 20 ? '\u{1F7E1}' : '\u{1F7E2}';
  const actionIcon = riskScore > 60 ? '\u{1F6A8}' : '\u{1F4CB}';
  const urgencyColor = getUrgencyColor(result.dx);
  const riskColor = getRiskZone(riskScore).color;
  const fillColor = FILL_COLOR[result.dx] || FILL_COLOR.optimal;
  const topSupplementName = result.supplements.cards[0]?.name;

  const cardDefs = {
    overview: {
      id: 'overview',
      icon: overviewIcon,
      title: 'Overview',
      illustration: <ThyroidIcon />,
      mobileStat: <span style={{ color: riskColor }}>{`${result.tsh} ${STATE_LABEL[result.dx]}`}</span>,
      body: [
        <div className="card-summary-line">{`TSH ${result.tsh} · ${STATE_LABEL[result.dx]}`}</div>,
        <span className="card-badge" style={{ color: riskColor, borderColor: riskColor }}>{`Risk ${riskScore}`}</span>,
        <div className="card-tap-hint">{'Tap to open →'}</div>,
      ],
      borderColor: riskColor,
      glowColor: { shadow: '6px 8px 24px rgba(0,0,0,0.5)', glow: hexToRgba(riskColor, 0.2) },
      pulseWorse: automations.worse,
      improvingTag: automations.improved,
      renderBack: () => (
        <>
          <ComparisonTable rows={result.comparisonRows} />
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
      illustration: <BrainIcon />,
      mobileStat: truncateWords(plainInterpretation, 3),
      body: [
        <div className="card-summary-line">{truncateWords(plainInterpretation, 8)}</div>,
        <div className="card-tap-hint">{'Tap to open →'}</div>,
      ],
      borderColor: '#3B82F6',
      glowColor: { shadow: '-4px 8px 24px rgba(0,0,0,0.5)', glow: 'rgba(59,130,246,0.2)' },
      renderBack: () => (
        <>
          <ComparisonTable rows={result.comparisonRows} />
          <InterpretationBack
            text={plainInterpretation}
            symptoms={result.symptoms}
            actions={result.actions}
            ageNote={result.ageNote}
            statusNote={result.statusNote}
            dotColor={SYMPTOM_DOT_COLOR[result.dx]}
          />
        </>
      ),
    },
    supplements: {
      id: 'supplements',
      icon: '\u{1F48A}',
      title: 'Supplements & Food',
      illustration: <MoleculeIcon />,
      mobileStat: `${result.supplements.cards.length} supps`,
      body: [
        <div className="card-summary-line">{`${result.supplements.cards.length} supplements recommended`}</div>,
        <div className="card-preview-line">{topSupplementName}</div>,
        <div className="card-tap-hint">{'Tap to open →'}</div>,
      ],
      borderColor: '#8B5CF6',
      glowColor: { shadow: '5px 6px 20px rgba(0,0,0,0.5)', glow: 'rgba(139,92,246,0.2)' },
      renderBack: () => (
        <>
          <ComparisonTable rows={result.comparisonRows} />
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
      illustration: <CalendarIcon />,
      mobileStat: <span style={{ color: urgencyColor }}>{URGENCY_LABEL[result.dx]}</span>,
      body: [
        <div className="card-summary-line">{truncateWords(result.timeline[0].what, 10)}</div>,
        <span className="card-badge" style={{ color: urgencyColor, borderColor: urgencyColor }}>{URGENCY_LABEL[result.dx]}</span>,
        <div className="card-tap-hint">{'Tap to open →'}</div>,
      ],
      borderColor: urgencyColor,
      glowColor: { shadow: '-6px 10px 28px rgba(0,0,0,0.5)', glow: hexToRgba(urgencyColor, 0.2) },
      renderBack: (close) => (
        <>
          <ComparisonTable rows={result.comparisonRows} />
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

  const deck = (
    <div className={deckClassName}>
      {order.map((card, slot) => (
        <FlipCard
          key={card.id}
          slot={slot}
          stagger={slot}
          entering={!entranceDone}
          borderColor={card.borderColor}
          glowColor={card.glowColor}
          icon={card.icon}
          title={card.title}
          frontBody={card.body}
          mobileStat={card.mobileStat}
          illustration={card.illustration}
          fillColor={fillColor}
          pulseWorse={card.pulseWorse}
          improvingTag={card.improvingTag}
          renderBack={card.renderBack}
          pulse={pulsing}
          compact={compact}
        />
      ))}
    </div>
  );

  if (compact) return deck;

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

      {deck}
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
