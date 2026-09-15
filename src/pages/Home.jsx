import { useState } from 'react';
import AnalysisLoader from '../components/AnalysisLoader.jsx';
import ResultCards from '../components/ResultCards.jsx';
import {
  TSH_TARGETS,
  SYMPTOM_OPTIONS,
  diagnose,
  getSeverity,
  getTshDisplay,
  getBannerMeta,
  getBannerContent,
  getInterpretation,
  getSymptomMention,
  getStatusNote,
  getAgeNote,
  getSymptoms,
  getActions,
  getDoseGuidance,
  getTimeline,
  getSupplements,
  calculateRisk,
} from '../utils/diagnose.js';
import { compareToLast, saveLastResult } from '../utils/history.js';

const NO_SYMPTOM_VALUES = new Set(['', 'No prominent symptoms']);

export default function Home() {
  const [form, setForm] = useState({
    tsh: '9.9646',
    ft3: '4.26',
    ft4: '11.58',
    dose: '100',
    age: '30',
    status: 'removed',
    symptom: 'Extreme fatigue / no energy',
    customSymptom: '',
  });
  const [phase, setPhase] = useState('form'); // 'form' | 'exiting' | 'loading' | 'results'
  const [pending, setPending] = useState(null);
  const [result, setResult] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [automations, setAutomations] = useState({ available: false });

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function analyze() {
    const tsh = parseFloat(form.tsh);
    const ft3 = parseFloat(form.ft3);
    const ft4 = parseFloat(form.ft4);
    const dose = parseFloat(form.dose) || null;
    const age = parseFloat(form.age) || null;

    if (Number.isNaN(tsh) || Number.isNaN(ft3) || Number.isNaN(ft4)) {
      alert('Please enter all three values — TSH, Free T3, and Free T4.');
      return;
    }

    const target = TSH_TARGETS[form.status] || TSH_TARGETS.removed;
    const dx = diagnose(tsh, ft3, ft4, form.status);
    const severity = getSeverity(tsh);

    const resolvedSymptom = form.symptom === 'other' ? form.customSymptom.trim() : form.symptom;
    const symptomForMention = NO_SYMPTOM_VALUES.has(form.symptom) ? '' : resolvedSymptom;

    const score = calculateRisk(tsh, ft4, ft3, age ?? 30, form.status, resolvedSymptom);

    const comparison = compareToLast(tsh, target);
    saveLastResult({ tsh, target, date: new Date().toISOString().slice(0, 10) });

    const data = {
      tsh, ft3, ft4, dose, age, status: form.status, target, dx, severity,
      tshOverride: getTshDisplay(tsh, dx),
      banner: { ...getBannerMeta(dx), ...getBannerContent(dx, tsh, ft3, ft4, target, form.status) },
      interpretation: getInterpretation(dx, tsh, ft3, ft4, target) + getSymptomMention(dx, symptomForMention),
      statusNote: getStatusNote(form.status),
      ageNote: age != null ? getAgeNote(age, tsh) : null,
      symptomTag: symptomForMention || null,
      symptoms: getSymptoms(dx),
      actions: getActions(dx),
      doseGuidance: getDoseGuidance(dx, dose),
      timeline: getTimeline(dx, severity),
      supplements: getSupplements(dx),
    };

    setAutomations(comparison);
    setPending({ data, score });
    setPhase('exiting');
    setTimeout(() => setPhase('loading'), 400);
  }

  function goToNewResults() {
    setPhase('form');
    setResult(null);
    setPending(null);
  }

  return (
    <>
      <header>
        <div className="logo">
          <div className="logo-icon">{'\u{1FAC0}'}</div>
          <div className="logo-text">Thyro<span>Track</span></div>
        </div>
        <div className="header-badge">Thyroid Health Monitor</div>
      </header>

      <main>
        {(phase === 'form' || phase === 'exiting') && (
          <div className={`input-card${phase === 'exiting' ? ' form-exit' : ''}`}>
            <div className="section-label">Lab Results Entry</div>
            <div className="section-title">Enter your thyroid panel</div>
            <div className="section-sub">Input your most recent blood test values. All analysis is done locally — your data stays with you.</div>

            <div className="form-grid">
              <div className="field">
                <label>TSH — Thyroid Stimulating Hormone</label>
                <div className="field-inner">
                  <input type="number" step="0.01" placeholder="e.g. 9.96" value={form.tsh} onChange={(e) => update('tsh', e.target.value)} />
                  <span className="unit-tag">uIU/mL</span>
                </div>
                <div className="ref-row">Ref: 0.35 – 4.94</div>
              </div>
              <div className="field">
                <label>Free T3 — Triiodothyronine</label>
                <div className="field-inner">
                  <input type="number" step="0.01" placeholder="e.g. 4.26" value={form.ft3} onChange={(e) => update('ft3', e.target.value)} />
                  <span className="unit-tag">pmol/L</span>
                </div>
                <div className="ref-row">Ref: 2.43 – 6.02</div>
              </div>
              <div className="field">
                <label>Free T4 — Thyroxine</label>
                <div className="field-inner">
                  <input type="number" step="0.01" placeholder="e.g. 11.58" value={form.ft4} onChange={(e) => update('ft4', e.target.value)} />
                  <span className="unit-tag">pmol/L</span>
                </div>
                <div className="ref-row">Ref: 9.0 – 19.0</div>
              </div>
            </div>

            <div className="form-row-2">
              <div className="field">
                <label>Current Levothyroxine dose (optional)</label>
                <div className="field-inner">
                  <input type="number" step="25" placeholder="e.g. 100" value={form.dose} onChange={(e) => update('dose', e.target.value)} />
                  <span className="unit-tag">mcg</span>
                </div>
              </div>
              <div className="field">
                <label>Your age</label>
                <div className="field-inner">
                  <input type="number" min="1" max="120" step="1" placeholder="e.g. 30" value={form.age} onChange={(e) => update('age', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-row-2">
              <div className="field">
                <label>Thyroid status</label>
                <div className="field-inner">
                  <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                    {Object.entries(TSH_TARGETS).map(([value, t]) => (
                      <option key={value} value={value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Most prominent symptom right now</label>
                <div className="field-inner">
                  <select value={form.symptom} onChange={(e) => update('symptom', e.target.value)}>
                    {SYMPTOM_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {form.symptom === 'other' && (
              <div className="form-row-2" style={{ gridTemplateColumns: '1fr' }}>
                <div className="field">
                  <label>Describe your symptom</label>
                  <div className="field-inner">
                    <input type="text" placeholder="e.g. ringing in ears" value={form.customSymptom} onChange={(e) => update('customSymptom', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <button className="btn-analyze" onClick={analyze}>Analyze my results</button>
          </div>
        )}

        {phase === 'loading' && pending && (
          <AnalysisLoader
            targetScore={pending.score}
            onComplete={() => {
              setResult(pending.data);
              setRiskScore(pending.score);
              setPhase('results');
            }}
          />
        )}

        {phase === 'results' && result && (
          <ResultCards
            result={result}
            riskScore={riskScore}
            onRiskScoreChange={setRiskScore}
            automations={automations}
            onNewResults={goToNewResults}
          />
        )}
      </main>
    </>
  );
}
