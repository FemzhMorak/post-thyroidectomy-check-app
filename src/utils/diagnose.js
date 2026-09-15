// Reference ranges plus the "ideal" (target) bands used in the clinical interpretation
// and target-pill display for Free T3/Free T4. TSH's target now varies by thyroid
// status — see TSH_TARGETS below — rather than a single fixed post-thyroidectomy band.
export const REFS = {
  tsh: { low: 0.35, high: 4.94, unit: 'uIU/mL' },
  ft3: { low: 2.43, high: 6.02, unit: 'pmol/L', ideal_low: 3.5, ideal_high: 5.5 },
  ft4: { low: 9.0, high: 19.0, unit: 'pmol/L', ideal_low: 12.0, ideal_high: 17.0 },
};

// Each thyroid status carries its own therapeutic TSH target — tighter or looser
// than the standard 0.35-4.94 lab range depending on the clinical picture (e.g.
// thyroid cancer patients are often intentionally suppressed below the standard floor).
export const TSH_TARGETS = {
  removed: { low: 0.5, high: 2.0, label: 'Thyroid fully removed (total thyroidectomy)' },
  partial: { low: 0.5, high: 3.0, label: 'Thyroid partially removed (hemithyroidectomy)' },
  rai: { low: 0.5, high: 2.0, label: 'Radioactive iodine ablation (RAI)' },
  hashimotos: { low: 1.0, high: 3.0, label: "Hashimoto's disease" },
  graves: { low: 0.35, high: 2.0, label: "Graves' disease" },
  intact_hypo: { low: 0.5, high: 2.5, label: 'Thyroid intact — on levothyroxine' },
  intact_hyper: { low: 0.35, high: 4.94, label: 'Thyroid intact — on anti-thyroid medication' },
  nodules: { low: 0.35, high: 4.94, label: 'Thyroid nodules (monitoring only)' },
  cancer: { low: 0.1, high: 0.5, label: 'Thyroid cancer (post-treatment)' },
};

function fmt(n) {
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

export function formatTarget(target) {
  return `${fmt(target.low)}–${fmt(target.high)}`;
}

export function diagnose(tsh, ft3, ft4, status = 'removed') {
  const target = TSH_TARGETS[status] || TSH_TARGETS.removed;
  const REF_LOW = REFS.tsh.low;
  const REF_HIGH = REFS.tsh.high;

  if (tsh > REF_HIGH || ft4 < REFS.ft4.low || ft3 < REFS.ft3.low) return 'hypothyroid';
  if (ft4 > REFS.ft4.high || ft3 > REFS.ft3.high) return 'hyperthyroid';
  // Some statuses (thyroid cancer suppression therapy) intentionally target a TSH
  // below the standard lab floor, so only being below BOTH floors counts as truly
  // "too suppressed" rather than just being below the standard range.
  if (tsh < REF_LOW && tsh < target.low) return 'hyperthyroid';
  if (tsh > target.high) return 'borderline_hypo';
  if (tsh < target.low) return 'borderline_hyper';
  return 'optimal';
}

export function getSeverity(tsh) {
  if (tsh > 10) return 'severe';
  if (tsh > 7) return 'moderate';
  if (tsh > 4.94) return 'mild';
  if (tsh < 0.1) return 'severe_hyper';
  if (tsh < 0.35) return 'mild_hyper';
  return 'none';
}

// Quartile-based classification used purely for the gauge bar's color/flag —
// independent of the person's own TSH target used by diagnose().
export function classifyValue(val, ref) {
  if (val < ref.low) return 'low';
  if (val > ref.high) return 'high';
  const lower25 = ref.low + (ref.high - ref.low) * 0.25;
  const upper75 = ref.low + (ref.high - ref.low) * 0.75;
  if (val < lower25 || val > upper75) return 'borderline';
  return 'normal';
}

export function getBarPercent(val, ref) {
  const span = ref.high - ref.low;
  const extLow = ref.low - span * 0.2;
  const extHigh = ref.high + span * 0.2;
  return Math.max(2, Math.min(98, ((val - extLow) / (extHigh - extLow)) * 100));
}

// TSH's gauge card is overridden on top of the quartile classification so the
// person's own target shows up even when TSH is still inside the standard lab range.
export function getTshDisplay(tsh, dx) {
  if (dx === 'hypothyroid') return { cls: 'high', flag: 'High — action needed' };
  if (dx === 'hyperthyroid') return { cls: 'low', flag: 'Low — action needed' };
  if (dx === 'borderline_hypo') return { cls: 'borderline', flag: 'Above target' };
  if (dx === 'borderline_hyper') return { cls: 'borderline', flag: 'Below target' };
  return { cls: 'normal', flag: 'Within range' };
}

const FLAG_TEXT = {
  normal: 'Within range',
  high: 'Above range',
  low: 'Below range',
  borderline: 'Borderline',
};

export function getFlagText(cls) {
  return FLAG_TEXT[cls];
}

const BANNER = {
  hypothyroid: { cssClass: 'hypo', icon: '\u{1F534}' },
  borderline_hypo: { cssClass: 'hyper', icon: '\u{1F7E1}' },
  hyperthyroid: { cssClass: 'hyper', icon: '\u{1F7E1}' },
  borderline_hyper: { cssClass: 'hyper', icon: '\u{1F7E1}' },
  optimal: { cssClass: 'optimal', icon: '\u{1F7E2}' },
};

export function getBannerMeta(dx) {
  return BANNER[dx];
}

// Statuses where the standard replacement medication is levothyroxine, used to
// decide whether the "optimal" banner mentions "good levothyroxine replacement therapy".
const NOT_ON_LEVOTHYROXINE = new Set(['intact_hyper', 'nodules']);

export function getBannerContent(dx, tsh, ft3, ft4, target, status) {
  const targetStr = formatTarget(target);
  if (dx === 'hypothyroid') {
    return {
      title: `Hypothyroid state detected — TSH significantly elevated (${tsh} uIU/mL)`,
      desc: `Your TSH is ${tsh} uIU/mL — well above the 0.35–4.94 reference range, and above your ${targetStr} uIU/mL target. Your body is signalling that it needs more thyroid hormone. This strongly suggests your levothyroxine dose needs to be reviewed and likely increased.`,
    };
  }
  if (dx === 'borderline_hypo') {
    return {
      title: `TSH above target — within range but not optimal (${tsh} uIU/mL)`,
      desc: `Your TSH is ${tsh} uIU/mL, which is inside the standard 0.35–4.94 reference range but above your ${targetStr} uIU/mL target. This is a mild, early signal that your dose may be slightly under what your body is asking for.`,
    };
  }
  if (dx === 'hyperthyroid') {
    return {
      title: `Hyperthyroid state detected — TSH suppressed (${tsh} uIU/mL)`,
      desc: `Your TSH is below the lower reference limit, suggesting excess thyroid hormone. This could indicate your levothyroxine dose is too high, or your remaining thyroid tissue is overactive. Symptoms of over-replacement include heart palpitations, anxiety, and weight loss.`,
    };
  }
  if (dx === 'borderline_hyper') {
    return {
      title: `TSH below target — within range but not optimal (${tsh} uIU/mL)`,
      desc: `Your TSH is ${tsh} uIU/mL, which is inside the standard reference range but below your ${targetStr} uIU/mL target. This is a mild, early signal your dose may be a little higher than your body currently needs.`,
    };
  }
  return {
    title: 'Thyroid levels well-controlled',
    desc: `Your TSH, Free T3, and Free T4 are all within reference ranges${NOT_ON_LEVOTHYROXINE.has(status) ? '' : ' and consistent with good levothyroxine replacement therapy'}. Continue your current management and maintain your scheduled monitoring visits.`,
  };
}

export function getInterpretation(dx, tsh, ft3, ft4, target) {
  const targetStr = formatTarget(target);
  if (dx === 'hypothyroid') {
    const t4pos = ft4 < 12 ? 'low-normal' : 'mid-range';
    return `Your results show a <strong>classic hypothyroid pattern</strong>. The TSH — produced by your pituitary gland — is elevated to <strong>${tsh} uIU/mL</strong> because your brain is detecting insufficient thyroid hormone and sending distress signals to compensate. Your Free T4 at <strong>${ft4} pmol/L</strong> is ${t4pos}, and your Free T3 at <strong>${ft3} pmol/L</strong> sits in the mid-range — your body is doing its best to convert available T4 into the active T3 form, which is why T3 looks relatively better than T4 or TSH. However, the elevated TSH overrides this: it is the most sensitive marker of thyroid sufficiency, and at ${tsh}, it is clear that current hormone levels are not meeting your body's needs. Your therapeutic target is <strong>${targetStr} uIU/mL</strong> — your current TSH of ${tsh} is approximately ${(tsh / 4.94).toFixed(1)}× the upper limit of the standard reference range.`;
  }
  if (dx === 'borderline_hypo') {
    return `Your results sit just above the therapeutic target. TSH at <strong>${tsh} uIU/mL</strong> is inside the standard 0.35–4.94 reference range, but above your <strong>${targetStr} uIU/mL</strong> target. Free T3 (<strong>${ft3} pmol/L</strong>) and Free T4 (<strong>${ft4} pmol/L</strong>) are both within range. A standard lab report would call this "normal", but for your situation it may mean your dose is a touch low.`;
  }
  if (dx === 'hyperthyroid') {
    return `Your results suggest <strong>excess thyroid hormone</strong>. The suppressed TSH indicates your pituitary gland has detected too much thyroid hormone and has stopped stimulating production. This pattern is seen with over-replacement on levothyroxine — a common finding if the dose has not been adjusted in a while or if absorption has recently improved. Sustained TSH suppression carries risks including atrial fibrillation and bone density loss over time.`;
  }
  if (dx === 'borderline_hyper') {
    return `Your results sit just below the therapeutic target. TSH at <strong>${tsh} uIU/mL</strong> is inside the standard reference range, but below your <strong>${targetStr} uIU/mL</strong> target. Free T3 (<strong>${ft3} pmol/L</strong>) and Free T4 (<strong>${ft4} pmol/L</strong>) remain within range. This is an early sign your dose may be a little higher than your body currently needs.`;
  }
  return `Your thyroid panel is <strong>well within normal limits</strong>. TSH at <strong>${tsh} uIU/mL</strong> sits comfortably within the reference range and within your <strong>${targetStr} uIU/mL</strong> target. Free T4 and Free T3 are both in healthy positions within their ranges. Your current management appears to be working well.`;
}

const STATE_ADJECTIVE = {
  hypothyroid: 'hypothyroid',
  borderline_hypo: 'hypothyroid',
  hyperthyroid: 'hyperthyroid',
  borderline_hyper: 'hyperthyroid',
  optimal: 'well-controlled',
};

// A short sentence tying the patient's self-reported symptom to their result pattern.
// Returns '' for no symptom selected / "no prominent symptoms" so callers can just
// concatenate it onto the interpretation string.
export function getSymptomMention(dx, symptomPhrase) {
  if (!symptomPhrase) return '';
  return ` Your reported symptom of <strong>${symptomPhrase.toLowerCase()}</strong> is consistent with the ${STATE_ADJECTIVE[dx]} pattern shown in your results.`;
}

const STATUS_NOTES = {
  removed: `Because your thyroid has been fully removed, your body relies entirely on levothyroxine — there is no natural thyroid tissue left to compensate for an off-target dose.`,
  partial: `With a partial thyroidectomy, your remaining thyroid tissue may still produce some hormone, so your levothyroxine needs can shift over time as that tissue's function changes.`,
  rai: `After radioactive iodine ablation, thyroid tissue destruction can continue for months — your dose may need re-checking more frequently during the first year.`,
  hashimotos: `Given your Hashimoto's diagnosis, consider also testing TPO antibodies at your next visit as levels can fluctuate.`,
  graves: `Graves' disease patients on anti-thyroid medication should watch for signs of agranulocytosis — sore throat or fever requires immediate medical attention.`,
  intact_hypo: `Since your thyroid is intact, some natural hormone production may continue alongside your levothyroxine — dose needs can shift as thyroid function changes.`,
  intact_hyper: `While on anti-thyroid medication, periodic liver function and white blood cell count checks are often recommended alongside your thyroid panel.`,
  nodules: `Continue routine monitoring of your nodules by ultrasound as advised by your doctor, alongside these thyroid function tests.`,
  cancer: `For thyroid cancer patients, TSH is often intentionally kept suppressed below 0.5 to reduce recurrence risk. Follow your oncologist's specific targets.`,
};

export function getStatusNote(status) {
  return STATUS_NOTES[status] || null;
}

export const SYMPTOM_OPTIONS = [
  { value: '', label: 'Select a symptom...' },
  { value: 'Extreme fatigue / no energy', label: 'Extreme fatigue / no energy' },
  { value: 'Feeling cold all the time', label: 'Feeling cold all the time' },
  { value: 'Brain fog / poor concentration', label: 'Brain fog / poor concentration' },
  { value: 'Low mood / depression', label: 'Low mood / depression' },
  { value: 'Weight gain (unexplained)', label: 'Weight gain (unexplained)' },
  { value: 'Hair loss / thinning', label: 'Hair loss / thinning' },
  { value: 'Constipation', label: 'Constipation' },
  { value: 'Dry skin', label: 'Dry skin' },
  { value: 'Slow heart rate / sluggishness', label: 'Slow heart rate / sluggishness' },
  { value: 'Puffy face or eyes', label: 'Puffy face or eyes' },
  { value: 'Heart palpitations', label: 'Heart palpitations' },
  { value: 'Anxiety / restlessness', label: 'Anxiety / restlessness' },
  { value: 'Feeling hot / sweating excessively', label: 'Feeling hot / sweating excessively' },
  { value: 'Weight loss (unexplained)', label: 'Weight loss (unexplained)' },
  { value: 'Trembling hands', label: 'Trembling hands' },
  { value: 'Insomnia / poor sleep', label: 'Insomnia / poor sleep' },
  { value: 'Loose stools / diarrhea', label: 'Loose stools / diarrhea' },
  { value: 'Muscle weakness or aches', label: 'Muscle weakness or aches' },
  { value: 'Joint pain', label: 'Joint pain' },
  { value: 'No prominent symptoms', label: 'No prominent symptoms' },
  { value: 'other', label: 'Other' },
];

export const HIGH_RISK_SYMPTOMS = ['Heart palpitations', 'Extreme fatigue', 'Slow heart rate', 'Trembling hands', 'Muscle weakness'];

export function calculateRisk(tsh, ft4, ft3, age, thyroidStatus, prominentSymptom) {
  let score = 0;

  // TSH is most weighted
  if (tsh > 10) score += 40;
  else if (tsh > 7) score += 30;
  else if (tsh > 4.94) score += 20;
  else if (tsh < 0.1) score += 45;
  else if (tsh < 0.35) score += 25;

  // FT4
  if (ft4 < 9.0 || ft4 > 19.0) score += 15;
  else if (ft4 < 11.0 || ft4 > 17.0) score += 7;

  // FT3
  if (ft3 < 2.43 || ft3 > 6.02) score += 10;

  // Age
  if (age > 65) score *= 1.4;
  else if (age > 50) score *= 1.2;
  else if (age < 18) score *= 1.1;

  // No thyroid adds risk
  if (thyroidStatus === 'removed') score *= 1.1;

  // High-risk symptoms
  if (HIGH_RISK_SYMPTOMS.some((s) => prominentSymptom?.includes(s))) score += 10;

  return Math.min(100, Math.round(score));
}

export const RISK_ZONES = [
  { min: 0, max: 20, color: '#10B981', label: 'Stable', message: 'Your thyroid appears well controlled. Maintain current dose and routine monitoring schedule.' },
  { min: 21, max: 40, color: '#84CC16', label: 'Monitor', message: 'Levels are slightly off target. Monitor symptoms closely and flag at your next routine appointment.' },
  { min: 41, max: 60, color: '#F59E0B', label: 'Attention needed', message: 'Your levels need attention. Book an appointment with your doctor within the next 2–4 weeks.' },
  { min: 61, max: 80, color: '#F97316', label: 'Urgent', message: 'This is urgent. Contact your doctor or endocrinologist this week and show them your results.' },
  { min: 81, max: 100, color: '#EF4444', label: 'Critical', message: 'This is critical. Seek medical attention as soon as possible. Do not wait for a scheduled appointment.' },
];

export function getRiskZone(score) {
  return RISK_ZONES.find((z) => score >= z.min && score <= z.max) || RISK_ZONES[0];
}

export function getAgeNote(age, tsh) {
  if (age == null || Number.isNaN(age)) return null;
  if (age < 18) {
    return 'Thyroid management in patients under 18 requires specialist paediatric endocrinology care.';
  }
  if (age > 65) {
    if (tsh < 0.5) {
      return 'In patients over 65, even mildly suppressed TSH significantly increases fracture risk and cardiovascular risk. Urgent review with your doctor is needed.';
    }
    if (tsh > 7) {
      return 'Severely elevated TSH in patients over 65 can impair heart function. Seek prompt medical review.';
    }
    return null;
  }
  if (age > 50) {
    if (tsh < 0.35) {
      return 'At your age, a suppressed TSH raises your risk of atrial fibrillation. An ECG is recommended. Ask your doctor about a bone density scan if TSH has been suppressed for over a year.';
    }
    return null;
  }
  return null;
}

const SYMPTOMS = {
  hypothyroid: ['Persistent fatigue and low energy', 'Feeling cold even in warm environments', 'Brain fog, slow thinking, poor concentration', 'Low mood or mild depression', 'Weight gain or difficulty losing weight', 'Constipation', 'Dry skin, brittle nails, hair thinning', 'Slow heart rate (bradycardia)', 'Puffy face, especially around the eyes'],
  borderline_hypo: ['Mild, low-grade fatigue', 'Slight sensitivity to cold', 'Subtle brain fog or slower concentration', 'Difficulty losing weight despite effort'],
  hyperthyroid: ['Anxiety, nervousness, restlessness', 'Heart palpitations or rapid heartbeat', 'Feeling hot and sweating excessively', 'Unexplained weight loss', 'Trembling hands', 'Insomnia or difficulty sleeping', 'Loose stools or frequent bowel movements', 'Irritability and mood swings'],
  borderline_hyper: ['Mild jitteriness or restlessness', 'Slightly faster resting heart rate', 'Trouble settling down at night'],
  optimal: ['Energy levels should feel stable', 'Weight should be relatively stable', 'Mood and concentration should be good', 'Heart rate should be normal (60–80 bpm)', 'Bowel movements should be regular'],
};

export function getSymptoms(dx) {
  return SYMPTOMS[dx];
}

const ACTIONS = {
  hypothyroid: [
    'Book an appointment with your endocrinologist or GP urgently — show them this TSH result',
    'Discuss a levothyroxine dose increase (typically 25mcg increments)',
    'Retest TSH, Free T3, Free T4 six to eight weeks after any dose change',
    'Do not change your dose on your own — always do it under medical supervision',
    'Review your medication timing — ensure you are taking it on an empty stomach',
    'Check for interactions with calcium, iron supplements, or antacids',
  ],
  borderline_hypo: [
    'Mention this result at your next routine review — it may not need immediate action',
    'Keep a symptom diary; a consistent low-energy pattern strengthens the case for a small dose adjustment',
    'Double-check you are taking levothyroxine consistently, on an empty stomach, at the same time each day',
  ],
  hyperthyroid: [
    'Contact your doctor — a dose reduction is likely needed',
    'Do not stop taking levothyroxine abruptly without medical guidance',
    'Monitor your heart rate — sustained rapid heartbeat warrants urgent review',
    'Retest in six to eight weeks after any dose adjustment',
    'Consider requesting a bone density scan if TSH has been suppressed long-term',
  ],
  borderline_hyper: [
    'Mention this result at your next routine review',
    'Keep an eye on heart rate, sleep and any jitteriness',
    'Avoid stacking extra levothyroxine sources (e.g. combination supplements) without checking with your doctor',
  ],
  optimal: [
    'Continue your current levothyroxine dose and timing routine',
    'Maintain your regular monitoring schedule (typically every six to twelve months)',
    'Continue taking medication at the same time daily on an empty stomach',
    'Report any new symptoms to your doctor even between scheduled visits',
  ],
};

export function getActions(dx) {
  return ACTIONS[dx];
}

export function getDoseGuidance(dx, dose) {
  if (dx === 'hypothyroid') {
    return dose
      ? { current: dose, suggested: dose + 25, direction: 'increase', note: `Standard clinical practice for hypothyroidism is to increase levothyroxine in increments of <strong>25 mcg</strong> at a time, with a retest after 6–8 weeks. Going from ${dose} mcg to ${dose + 25} mcg is the typical next step, but your doctor will make the final call based on your weight, age, and overall clinical picture. <em>Never self-adjust your dose.</em>` }
      : { current: null, suggested: null, direction: 'increase', note: `Your TSH suggests under-replacement. Standard practice is to increase levothyroxine in <strong>25 mcg increments</strong>, followed by a retest in 6–8 weeks. Enter your current dose above to see a specific suggestion. Discuss with your doctor before making any changes.` };
  }
  if (dx === 'borderline_hypo') {
    return dose
      ? { current: dose, suggested: dose + 25, direction: 'increase', note: `TSH is above your target but still within the standard range. Some clinicians hold the dose and retest, others make a small <strong>25 mcg</strong> increase (to ${dose + 25} mcg) — this is a discussion to have with your doctor.` }
      : { current: null, suggested: null, direction: 'increase', note: `TSH is above your target but still within the standard range. Enter your current dose above to see a possible adjustment, and discuss with your doctor.` };
  }
  if (dx === 'hyperthyroid') {
    return dose
      ? { current: dose, suggested: Math.max(25, dose - 25), direction: 'decrease', note: `Over-replacement is typically corrected by reducing in <strong>25 mcg increments</strong>. Going from ${dose} mcg to ${Math.max(25, dose - 25)} mcg is the likely direction, with a retest in 6–8 weeks. Your doctor will confirm.` }
      : { current: null, suggested: null, direction: 'decrease', note: `Your TSH suggests over-replacement. Standard practice is to reduce levothyroxine in <strong>25 mcg increments</strong>, followed by a retest in 6–8 weeks. Enter your current dose above to see a specific suggestion.` };
  }
  if (dx === 'borderline_hyper') {
    return dose
      ? { current: dose, suggested: Math.max(25, dose - 25), direction: 'decrease', note: `TSH is below your target but still within the standard range. Some clinicians hold the dose and retest, others make a small <strong>25 mcg</strong> reduction (to ${Math.max(25, dose - 25)} mcg) — discuss with your doctor.` }
      : { current: null, suggested: null, direction: 'decrease', note: `TSH is below your target but still within the standard range. Enter your current dose above to see a possible adjustment, and discuss with your doctor.` };
  }
  return {
    current: dose || null,
    suggested: null,
    direction: null,
    note: `Your thyroid levels appear well-controlled. No dose adjustment is suggested at this time. Continue your current routine and maintain your monitoring schedule.`,
  };
}

const TIMELINES = {
  hypothyroid: {
    severe: [
      { when: 'This week', what: 'Contact your doctor or endocrinologist and share these results. A TSH above 10 is significant and warrants prompt review.', color: 'var(--red)' },
      { when: '6–8 weeks', what: 'Retest TSH, Free T3, and Free T4 after your dose is adjusted. This is the minimum time needed to see a meaningful shift in levels.', color: 'var(--amber)' },
      { when: '3 months', what: 'Follow-up visit to confirm levels are trending toward target. Further adjustment may be needed.', color: 'var(--blue)' },
      { when: '6 months', what: 'Once stable, your monitoring frequency can be reduced to every 6 months.', color: 'var(--green)' },
      { when: 'Annually', what: 'Once well-controlled, annual thyroid panels are generally sufficient — unless new symptoms arise.', color: 'var(--green)' },
    ],
    moderate: [
      { when: 'Within 2 weeks', what: 'Book an appointment with your doctor to review your dose. TSH is moderately elevated and needs addressing.', color: 'var(--amber)' },
      { when: '6–8 weeks', what: 'Retest after dose adjustment. TSH can take up to 8 weeks to fully reflect a dosage change.', color: 'var(--blue)' },
      { when: '3–6 months', what: 'Confirm stable levels and discuss long-term monitoring plan with your doctor.', color: 'var(--green)' },
      { when: 'Annually', what: 'Ongoing annual monitoring once well-controlled.', color: 'var(--green)' },
    ],
    mild: [
      { when: 'Next routine appointment', what: 'Discuss your mildly elevated TSH with your doctor. A dose adjustment may or may not be needed depending on your symptoms and history.', color: 'var(--amber)' },
      { when: '3 months', what: 'Retest to confirm whether levels have stabilised or are continuing to drift.', color: 'var(--blue)' },
      { when: '6–12 months', what: 'If stable, return to standard annual monitoring.', color: 'var(--green)' },
    ],
  },
  borderline_hypo: [
    { when: 'Next routine appointment', what: 'Mention this result — it is within the standard range but above your personal target.', color: 'var(--amber)' },
    { when: '3–6 months', what: 'Retest to see whether TSH is trending up or holding steady.', color: 'var(--blue)' },
    { when: 'Annually', what: 'Continue routine annual monitoring if levels remain stable.', color: 'var(--green)' },
  ],
  hyperthyroid: [
    { when: 'Within 1–2 weeks', what: 'Consult your doctor about a potential dose reduction. Sustained TSH suppression has long-term risks for your heart and bones.', color: 'var(--amber)' },
    { when: '6–8 weeks', what: 'Retest after any dose adjustment to confirm TSH has risen back into the target range.', color: 'var(--blue)' },
    { when: '6 months', what: 'Confirm stable, well-controlled levels with your endocrinologist.', color: 'var(--green)' },
    { when: 'Annually', what: 'Annual monitoring once well-controlled. Ask your doctor about a bone density scan if TSH has been suppressed for over a year.', color: 'var(--green)' },
  ],
  borderline_hyper: [
    { when: 'Next routine appointment', what: 'Mention this result — it is within the standard range but below your personal target.', color: 'var(--amber)' },
    { when: '3–6 months', what: 'Retest to see whether TSH is trending down or holding steady.', color: 'var(--blue)' },
    { when: 'Annually', what: 'Continue routine annual monitoring if levels remain stable.', color: 'var(--green)' },
  ],
  optimal: [
    { when: 'Every 6 months', what: 'Routine thyroid panel to confirm continued stability. You are well-controlled — this is just maintenance monitoring.', color: 'var(--green)' },
    { when: 'Annually', what: 'Annual review with your doctor or endocrinologist to assess overall thyroid management.', color: 'var(--green)' },
    { when: 'If symptoms change', what: 'Return sooner if you notice fatigue, weight changes, palpitations, or any symptoms that concern you — do not wait for the next scheduled visit.', color: 'var(--blue)' },
  ],
};

export function getTimeline(dx, severity) {
  if (dx === 'hypothyroid') return TIMELINES.hypothyroid[severity] || TIMELINES.hypothyroid.mild;
  return TIMELINES[dx] || TIMELINES.optimal;
}

export const ABSORPTION_RULES = [
  'Take your tablet at the same time every morning, ideally 30–60 minutes before eating',
  'Never take with calcium, iron supplements, or antacids — they block absorption',
  'Coffee and dairy consumed within 1 hour of your dose can reduce absorption by up to 30%',
  'High-fibre foods (bran, flaxseed) taken close to your dose can reduce T4 uptake',
  'If you miss a dose, take it as soon as you remember — but never double up the next day',
  'Store tablets away from heat, moisture, and direct sunlight',
];

const SUPPLEMENTS = {
  hypothyroid: {
    cards: [
      { name: 'Selenium', dose: '200mcg/day', why: 'Directly supports T4→T3 conversion — the most important mineral for thyroid function.', note: 'Brazil nuts (1–2/day) are the best natural source', timing: 'With breakfast' },
      { name: 'Zinc', dose: '25–30mg/day', why: 'Essential cofactor for thyroid hormone production. Often depleted in hypothyroid patients.', timing: 'With food (can cause nausea on empty stomach)' },
      { name: 'Magnesium Glycinate', dose: '300–400mg/day', why: 'Commonly depleted in hypothyroidism. Helps with fatigue, sleep, and muscle aches.', timing: 'Evening — also improves sleep' },
      { name: 'Vitamin D3 + K2', dose: '2000–4000 IU D3/day', why: 'Almost universally low in hypothyroid patients. K2 ensures calcium goes to bones not arteries.', timing: 'With your fattiest meal' },
      { name: 'Vitamin B12', dose: '1000mcg/day', why: 'B12 deficiency commonly occurs alongside hypothyroidism and worsens fatigue and brain fog.', timing: 'Morning' },
      { name: 'Iron', dose: 'As prescribed', why: 'Low ferritin severely impairs T4→T3 conversion. Do not supplement without testing first.', timing: '4+ hrs from levothyroxine', warning: 'Test before supplementing' },
    ],
    food: {
      eat: ['Brazil nuts', 'Pumpkin seeds', 'Eggs', 'Fatty fish', 'Chicken', 'Beef', 'Cooked leafy greens'],
      limit: ['Raw kale/broccoli/cabbage in large amounts', 'Soy within 4hrs of medication', 'Alcohol', 'Ultra-processed foods'],
    },
  },
  hyperthyroid: {
    cards: [
      { name: 'Magnesium Glycinate', dose: '400mg/day', why: 'Calms the nervous system and reduces palpitations.', timing: 'Evening' },
      { name: 'Vitamin D3', dose: '2000 IU/day', why: 'Commonly depleted in hyperthyroidism.', timing: 'With food' },
      { name: 'L-Carnitine', dose: '2g/day', why: 'Shown in clinical studies to reduce hyperthyroid symptoms including bone loss.', timing: 'With food' },
      { name: 'Bugleweed', dose: 'Discuss with doctor first', why: 'Herbal option that may help mild symptoms.', timing: 'As advised', warning: 'Not for use if on thyroid medication without medical supervision' },
    ],
  },
  optimal: {
    cards: [
      { name: 'Selenium', dose: '100–200mcg/day', why: 'General thyroid maintenance.', timing: 'With breakfast' },
      { name: 'Vitamin D3 + K2', dose: '2000 IU/day', why: 'Maintenance for bone and immune health.', timing: 'With food' },
      { name: 'Magnesium', dose: '300mg/day', why: 'General wellness and sleep support.', timing: 'Evening' },
    ],
  },
};

export function getSupplements(dx) {
  if (dx === 'hypothyroid' || dx === 'borderline_hypo') return SUPPLEMENTS.hypothyroid;
  if (dx === 'hyperthyroid' || dx === 'borderline_hyper') return SUPPLEMENTS.hyperthyroid;
  return SUPPLEMENTS.optimal;
}

// A single-word urgency color for the Action Plan card — red for a full
// hypo/hyperthyroid reading, amber for borderline, green once optimal.
export function getUrgencyColor(dx) {
  if (dx === 'hypothyroid' || dx === 'hyperthyroid') return '#EF4444';
  if (dx === 'borderline_hypo' || dx === 'borderline_hyper') return '#F59E0B';
  return '#10B981';
}

export const STATE_LABEL = {
  hypothyroid: 'Hypothyroid',
  borderline_hypo: 'Borderline High',
  hyperthyroid: 'Hyperthyroid',
  borderline_hyper: 'Borderline Low',
  optimal: 'Optimal',
};
