import { useEffect, useRef, useState } from 'react';
import ResultCards from '../components/ResultCards.jsx';
import MiniRiskGauge from '../components/MiniRiskGauge.jsx';
import UnitToggle from '../components/UnitToggle.jsx';
import SummaryStrip from '../components/SummaryStrip.jsx';
import MedicationSheet from '../components/MedicationSheet.jsx';
import WellnessSheet from '../components/WellnessSheet.jsx';
import { getStreak } from '../utils/doseLogs.js';
import { scheduleAllNotifications } from '../utils/notifications.js';
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
import { UNIT_FIELDS, refRowText, buildComparisonRows, formatNum } from '../utils/units.js';

const NO_SYMPTOM_VALUES = new Set(['', 'No prominent symptoms']);
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatHeaderDate(d) {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const TOTAL_MS = 3000;

export default function Home({ onDxChange, profile }) {
  const [form, setForm] = useState({
    tsh: '9.9646',
    tshUnit: 'mIU/L',
    ft3: '4.26',
    ft3Unit: 'pmol/L',
    ft4: '11.58',
    ft4Unit: 'pmol/L',
    dose: '100',
    age: '30',
    status: 'removed',
    symptom: 'Extreme fatigue / no energy',
    customSymptom: '',
    totalT4: '',
    totalT4Unit: 'nmol/L',
    totalT3: '',
    totalT3Unit: 'nmol/L',
    tpo: '',
    thyroglobulin: '',
    reverseT3: '',
    reverseT3Unit: 'ng/dL',
  });
  const [showMore, setShowMore] = useState(false);
  const [flashKey, setFlashKey] = useState(null);

  const [result, setResult] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [automations, setAutomations] = useState({ available: false });

  const [analyzing, setAnalyzing] = useState(false);
  const [fromScore, setFromScore] = useState(0);
  const [runId, setRunId] = useState(0);
  const [pulseTick, setPulseTick] = useState(0);
  const timersRef = useRef([]);

  const [medSheetOpen, setMedSheetOpen] = useState(false);
  const [wellnessSheetOpen, setWellnessSheetOpen] = useState(false);
  const [doseVersion, setDoseVersion] = useState(0);
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Notification scheduling only starts once a profile exists (permission is
  // requested during onboarding), and only while this tab stays open — this
  // app has no backend or service worker to deliver background pushes.
  useEffect(() => {
    if (!profile) return undefined;
    return scheduleAllNotifications({
      onOpenMedication: () => setMedSheetOpen(true),
      onOpenWellness: () => setWellnessSheetOpen(true),
      onOpenAnalyze: () => document.querySelector('.input-card')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }, [profile]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleUnit(key) {
    const cfg = UNIT_FIELDS[key];
    if (!cfg || cfg.units.length < 2) return;
    setForm((f) => {
      const curUnit = f[`${key}Unit`] || cfg.baseUnit;
      const idx = cfg.units.indexOf(curUnit);
      const nextUnit = cfg.units[(idx + 1) % cfg.units.length];
      const curNum = parseFloat(f[key]);
      let nextVal = f[key];
      if (!Number.isNaN(curNum)) {
        const base = cfg.toBase(curNum, curUnit);
        nextVal = formatNum(cfg.fromBase(base, nextUnit));
      }
      return { ...f, [key]: nextVal, [`${key}Unit`]: nextUnit };
    });
    setFlashKey(key);
    setTimeout(() => setFlashKey((k) => (k === key ? null : k)), 250);
  }

  function analyze() {
    const tshRaw = parseFloat(form.tsh);
    const ft3Raw = parseFloat(form.ft3);
    const ft4Raw = parseFloat(form.ft4);

    if (Number.isNaN(tshRaw) || Number.isNaN(ft3Raw) || Number.isNaN(ft4Raw)) {
      alert('Please enter all three values — TSH, Free T3, and Free T4.');
      return;
    }

    const tshUnit = form.tshUnit || 'mIU/L';
    const ft3Unit = form.ft3Unit || 'pmol/L';
    const ft4Unit = form.ft4Unit || 'pmol/L';

    // Canonical base-unit values — diagnose()/calculateRisk() are untouched
    // and still always operate on mIU/L + pmol/L, exactly as before.
    const tsh = UNIT_FIELDS.tsh.toBase(tshRaw, tshUnit);
    const ft3 = UNIT_FIELDS.ft3.toBase(ft3Raw, ft3Unit);
    const ft4 = UNIT_FIELDS.ft4.toBase(ft4Raw, ft4Unit);

    const dose = parseFloat(form.dose) || null;
    const age = parseFloat(form.age) || null;

    const target = TSH_TARGETS[form.status] || TSH_TARGETS.removed;
    const dx = diagnose(tsh, ft3, ft4, form.status);
    const severity = getSeverity(tsh);

    const resolvedSymptom = form.symptom === 'other' ? form.customSymptom.trim() : form.symptom;
    const symptomForMention = NO_SYMPTOM_VALUES.has(form.symptom) ? '' : resolvedSymptom;

    const score = calculateRisk(tsh, ft4, ft3, age ?? 30, form.status, resolvedSymptom);

    const comparison = compareToLast(tsh, target);
    saveLastResult({ tsh, target, date: new Date().toISOString().slice(0, 10), dx, dose });

    // Always derived fresh from whatever was actually entered this run —
    // no preset or cached assumptions about what the result "should" be.
    const comparisonRows = buildComparisonRows({
      tsh: tshRaw,
      tshUnit,
      ft4: ft4Raw,
      ft4Unit,
      ft3: ft3Raw,
      ft3Unit,
      status: form.status,
      optional: {
        totalT4: { value: form.totalT4, unit: form.totalT4Unit || 'nmol/L' },
        totalT3: { value: form.totalT3, unit: form.totalT3Unit || 'nmol/L' },
        tpo: { value: form.tpo, unit: 'IU/mL' },
        thyroglobulin: { value: form.thyroglobulin, unit: 'ug/L' },
        reverseT3: { value: form.reverseT3, unit: form.reverseT3Unit || 'ng/dL' },
      },
    });

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
      comparisonRows,
    };

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const hadResult = result !== null;
    setFromScore(riskScore);
    setRunId((id) => id + 1);
    setAnalyzing(true);

    const finishTimer = setTimeout(() => {
      setAutomations(comparison);
      setResult(data);
      setRiskScore(score);
      setAnalyzing(false);
      onDxChange?.(data.dx);
      if (hadResult) setPulseTick((t) => t + 1);
    }, TOTAL_MS);
    timersRef.current.push(finishTimer);
  }

  function handleNewResults() {
    setResult(null);
    setRiskScore(0);
    setAutomations({ available: false });
    onDxChange?.(null);
  }

  const gaugeState = analyzing ? 'analyzing' : result ? 'done' : 'idle';
  const streak = getStreak();
  const headerDate = formatHeaderDate(today);

  return (
    <>
      <header>
        <div className="logo">
          <div className="logo-icon">{'\u{1FAC0}'}</div>
          <div className="logo-text">
            Thyro<span>Track</span>
            {profile?.name && <span className="header-profile-name">{` · ${capitalize(profile.name)}`}</span>}
          </div>
        </div>
        <div className="header-right">
          {streak >= 2 && (
            <span className="header-streak" title="Medication streak — keep taking your dose at the same time daily">
              {`\u{1F525} ${streak} days`}
            </span>
          )}
          <span className="header-date">{headerDate}</span>
          <button type="button" className="med-pill-btn" onClick={() => setMedSheetOpen(true)} aria-label="Medication log">
            {'\u{1F48A}'}
          </button>
          <div className="header-badge">Thyroid Health Monitor</div>
        </div>
      </header>
      <div className="mobile-date-strip">{headerDate}</div>

      <main>
        <div className="app-columns">
        <div className="col-form">
        <div className="input-card">
          <svg className="form-watermark" viewBox="0 0 120 200" aria-hidden="true" focusable="false">
            <defs>
              <marker id="wmArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="white" />
              </marker>
            </defs>
            <circle cx="60" cy="14" r="10" fill="none" stroke="white" strokeWidth="2" />
            <text x="60" y="17" textAnchor="middle" fontSize="7" fill="white">Pituitary</text>
            <line x1="60" y1="24" x2="60" y2="44" stroke="white" strokeWidth="1.5" markerEnd="url(#wmArrow)" />

            <rect x="42" y="46" width="36" height="18" rx="4" fill="none" stroke="white" strokeWidth="2" />
            <text x="60" y="58" textAnchor="middle" fontSize="7" fill="white">TSH</text>
            <line x1="60" y1="64" x2="60" y2="84" stroke="white" strokeWidth="1.5" markerEnd="url(#wmArrow)" />

            <path d="M60 104 C50 91, 34 91, 32 104 C34 117, 50 117, 60 104 Z" fill="none" stroke="white" strokeWidth="2" />
            <path d="M60 104 C70 91, 86 91, 88 104 C86 117, 70 117, 60 104 Z" fill="none" stroke="white" strokeWidth="2" />
            <text x="60" y="128" textAnchor="middle" fontSize="7" fill="white">Thyroid</text>
            <line x1="60" y1="118" x2="60" y2="138" stroke="white" strokeWidth="1.5" markerEnd="url(#wmArrow)" />

            <rect x="38" y="140" width="44" height="18" rx="4" fill="none" stroke="white" strokeWidth="2" />
            <text x="60" y="152" textAnchor="middle" fontSize="7" fill="white">T3 / T4</text>
            <line x1="60" y1="158" x2="60" y2="178" stroke="white" strokeWidth="1.5" markerEnd="url(#wmArrow)" />

            <circle cx="60" cy="190" r="9" fill="none" stroke="white" strokeWidth="2" />
            <path d="M60 186 v8 M56 190 h8" stroke="white" strokeWidth="1.5" />
          </svg>

          <div className="input-card-header">
            <div className="ih-label section-label">Lab Results Entry</div>
            <div className="ih-title section-title">Enter your thyroid panel</div>
            <div className="ih-subtext section-sub">Input your most recent blood test values. All analysis is done locally — your data stays with you.</div>
            <MiniRiskGauge state={gaugeState} score={riskScore} fromScore={fromScore} triggerId={runId} />
          </div>

          <div className="mobile-card-strip">
            <ResultCards
              variant="mobile"
              result={result}
              riskScore={riskScore}
              onRiskScoreChange={setRiskScore}
              automations={automations}
              pulseTick={pulseTick}
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <label>TSH — Thyroid Stimulating Hormone</label>
              <div className="field-inner">
                <input className={flashKey === 'tsh' ? 'unit-flash' : ''} type="number" step="0.01" placeholder="e.g. 9.96" value={form.tsh} onChange={(e) => update('tsh', e.target.value)} />
                <UnitToggle unit={form.tshUnit || 'mIU/L'} onClick={() => toggleUnit('tsh')} />
              </div>
              <div className="ref-row">Ref: {refRowText('tsh', form.tshUnit)}</div>
            </div>
            <div className="field">
              <label>Free T3 — Triiodothyronine</label>
              <div className="field-inner">
                <input className={flashKey === 'ft3' ? 'unit-flash' : ''} type="number" step="0.01" placeholder="e.g. 4.26" value={form.ft3} onChange={(e) => update('ft3', e.target.value)} />
                <UnitToggle unit={form.ft3Unit || 'pmol/L'} onClick={() => toggleUnit('ft3')} />
              </div>
              <div className="ref-row">Ref: {refRowText('ft3', form.ft3Unit)}</div>
            </div>
            <div className="field">
              <label>Free T4 — Thyroxine</label>
              <div className="field-inner">
                <input className={flashKey === 'ft4' ? 'unit-flash' : ''} type="number" step="0.01" placeholder="e.g. 11.58" value={form.ft4} onChange={(e) => update('ft4', e.target.value)} />
                <UnitToggle unit={form.ft4Unit || 'pmol/L'} onClick={() => toggleUnit('ft4')} />
              </div>
              <div className="ref-row">Ref: {refRowText('ft4', form.ft4Unit)}</div>
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

          <button type="button" className="more-markers-toggle" onClick={() => setShowMore((s) => !s)}>
            {showMore ? '− Fewer markers' : '+ More markers'}
          </button>

          {showMore && (
            <div className="optional-markers-grid">
              <div className="field">
                <label>Total T4 <span className="optional-badge">Optional</span></label>
                <div className="field-inner">
                  <input className={flashKey === 'totalT4' ? 'unit-flash' : ''} type="number" step="0.1" placeholder="optional" value={form.totalT4} onChange={(e) => update('totalT4', e.target.value)} />
                  <UnitToggle unit={form.totalT4Unit || 'nmol/L'} onClick={() => toggleUnit('totalT4')} />
                </div>
                <div className="ref-row">Ref: {refRowText('totalT4', form.totalT4Unit)}</div>
              </div>

              <div className="field">
                <label>Total T3 <span className="optional-badge">Optional</span></label>
                <div className="field-inner">
                  <input className={flashKey === 'totalT3' ? 'unit-flash' : ''} type="number" step="0.01" placeholder="optional" value={form.totalT3} onChange={(e) => update('totalT3', e.target.value)} />
                  <UnitToggle unit={form.totalT3Unit || 'nmol/L'} onClick={() => toggleUnit('totalT3')} />
                </div>
                <div className="ref-row">Ref: {refRowText('totalT3', form.totalT3Unit)}</div>
              </div>

              <div className="field">
                <label>TPO Antibodies <span className="optional-badge">Optional</span></label>
                <div className="field-inner">
                  <input type="number" step="0.1" placeholder="optional" value={form.tpo} onChange={(e) => update('tpo', e.target.value)} />
                  <span className="unit-tag">IU/mL</span>
                </div>
                <div className="ref-row">Ref: {refRowText('tpo')}</div>
                <div className="field-note">Elevated suggests autoimmune thyroid disease</div>
              </div>

              {(form.status === 'removed' || form.status === 'cancer') && (
                <div className="field">
                  <label>Thyroglobulin <span className="optional-badge">Optional</span></label>
                  <div className="field-inner">
                    <input type="number" step="0.1" placeholder="optional" value={form.thyroglobulin} onChange={(e) => update('thyroglobulin', e.target.value)} />
                    <span className="unit-tag">ug/L</span>
                  </div>
                  <div className="ref-row">Ref: {refRowText('thyroglobulin')}</div>
                  <div className="field-note">Should be undetectable after total thyroidectomy</div>
                </div>
              )}

              <div className="field">
                <label>Reverse T3 <span className="optional-badge">Optional</span></label>
                <div className="field-inner">
                  <input className={flashKey === 'reverseT3' ? 'unit-flash' : ''} type="number" step="0.1" placeholder="optional" value={form.reverseT3} onChange={(e) => update('reverseT3', e.target.value)} />
                  <UnitToggle unit={form.reverseT3Unit || 'ng/dL'} onClick={() => toggleUnit('reverseT3')} />
                </div>
                <div className="ref-row">Ref: {refRowText('reverseT3', form.reverseT3Unit)}</div>
                <div className="field-note">Elevated suggests T4{'→'}T3 conversion issue</div>
              </div>
            </div>
          )}

          <button className={`btn-analyze${analyzing ? ' analyzing' : ''}`} onClick={analyze} disabled={analyzing}>
            {analyzing ? 'Analysing...' : 'Analyze my results'}
          </button>
        </div>
        </div>

        <div className="col-results">
          <ResultCards
            variant="desktop"
            result={result}
            riskScore={riskScore}
            onRiskScoreChange={setRiskScore}
            automations={automations}
            onNewResults={handleNewResults}
            pulseTick={pulseTick}
          />
          <SummaryStrip version={runId} />
        </div>
        </div>
      </main>

      <MedicationSheet
        open={medSheetOpen}
        onClose={() => setMedSheetOpen(false)}
        dose={form.dose}
        onLogged={() => setDoseVersion((v) => v + 1)}
      />
      <WellnessSheet open={wellnessSheetOpen} onClose={() => setWellnessSheetOpen(false)} />
    </>
  );
}
