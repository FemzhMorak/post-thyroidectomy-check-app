// Unit-conversion and reference-lookup helpers for the expanded lab form and
// the side-by-side comparison panel. Built on top of the verified clinical
// reference database rather than duplicating range numbers inline.
import { CLINICAL_REFERENCES, UNIT_CONVERSIONS } from '../data/thyroidReference.js';
import { TSH_TARGETS } from './diagnose.js';

function round(v, dp = 3) {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}

export function formatNum(v) {
  if (v == null || Number.isNaN(v)) return '';
  return String(round(v));
}

// One decimal minimum so whole-number bounds read "9.0" rather than "9",
// matching the rest of the app's reference-range formatting.
function fmtBound(n) {
  return Number.isInteger(n) ? n.toFixed(1) : String(round(n, 2));
}

// Per-marker unit definitions: base unit is the canonical unit diagnose.js
// and calculateRisk() already expect (mIU/L for TSH, pmol/L for FT3/FT4).
// toBase/fromBase convert between the base unit and any alternate unit;
// refRange/optimalRange look up the matching band for whichever unit is
// currently selected, so the form and the comparison table always agree.
export const UNIT_FIELDS = {
  tsh: {
    units: ['mIU/L', 'uIU/mL'],
    baseUnit: 'mIU/L',
    toBase: (v) => v,
    fromBase: (v) => v,
    refRange: () => CLINICAL_REFERENCES.TSH.standard,
  },
  ft4: {
    units: ['pmol/L', 'ng/dL'],
    baseUnit: 'pmol/L',
    toBase: (v, unit) => (unit === 'ng/dL' ? UNIT_CONVERSIONS.FreeT4.ngdlToPmol(v) : v),
    fromBase: (v, unit) => (unit === 'ng/dL' ? UNIT_CONVERSIONS.FreeT4.pmolToNgdl(v) : v),
    refRange: (unit) => (unit === 'ng/dL' ? CLINICAL_REFERENCES.FreeT4.standard_ngdl : CLINICAL_REFERENCES.FreeT4.standard_pmol),
    optimalRange: (unit) => (unit === 'ng/dL' ? CLINICAL_REFERENCES.FreeT4.optimal_ngdl : CLINICAL_REFERENCES.FreeT4.optimal_pmol),
  },
  ft3: {
    units: ['pmol/L', 'pg/mL'],
    baseUnit: 'pmol/L',
    toBase: (v, unit) => (unit === 'pg/mL' ? UNIT_CONVERSIONS.FreeT3.pgmlToPmol(v) : v),
    fromBase: (v, unit) => (unit === 'pg/mL' ? UNIT_CONVERSIONS.FreeT3.pmolToPgml(v) : v),
    refRange: (unit) => (unit === 'pg/mL' ? CLINICAL_REFERENCES.FreeT3.standard_pgml : CLINICAL_REFERENCES.FreeT3.standard_pmol),
    optimalRange: (unit) => (unit === 'pg/mL' ? CLINICAL_REFERENCES.FreeT3.optimal_pgml : CLINICAL_REFERENCES.FreeT3.optimal_pmol),
  },
  totalT4: {
    units: ['nmol/L', 'ug/dL'],
    baseUnit: 'nmol/L',
    toBase: (v, unit) => (unit === 'ug/dL' ? UNIT_CONVERSIONS.TotalT4.ugdlToNmol(v) : v),
    fromBase: (v, unit) => (unit === 'ug/dL' ? UNIT_CONVERSIONS.TotalT4.nmolToUgdl(v) : v),
    refRange: (unit) => (unit === 'ug/dL' ? CLINICAL_REFERENCES.TotalT4.standard_ugdl : CLINICAL_REFERENCES.TotalT4.standard_nmol),
  },
  totalT3: {
    units: ['nmol/L', 'ng/dL'],
    baseUnit: 'nmol/L',
    toBase: (v, unit) => (unit === 'ng/dL' ? UNIT_CONVERSIONS.TotalT3.ngdlToNmol(v) : v),
    fromBase: (v, unit) => (unit === 'ng/dL' ? UNIT_CONVERSIONS.TotalT3.nmolToNgdl(v) : v),
    refRange: (unit) => (unit === 'ng/dL' ? CLINICAL_REFERENCES.TotalT3.standard_ngdl : CLINICAL_REFERENCES.TotalT3.standard_nmol),
  },
  reverseT3: {
    units: ['ng/dL', 'pmol/L'],
    baseUnit: 'ng/dL',
    toBase: (v, unit) => (unit === 'pmol/L' ? UNIT_CONVERSIONS.ReverseT3.pmolToNgdl(v) : v),
    fromBase: (v, unit) => (unit === 'pmol/L' ? UNIT_CONVERSIONS.ReverseT3.ngdlToPmol(v) : v),
    refRange: (unit) => (unit === 'pmol/L' ? CLINICAL_REFERENCES.ReverseT3.standard_pmol : CLINICAL_REFERENCES.ReverseT3.standard_ngdl),
  },
  tpo: {
    units: ['IU/mL'],
    baseUnit: 'IU/mL',
    toBase: (v) => v,
    fromBase: (v) => v,
    refRange: () => CLINICAL_REFERENCES.TPOAntibodies.standard,
  },
  thyroglobulin: {
    units: ['ug/L'],
    baseUnit: 'ug/L',
    toBase: (v) => v,
    fromBase: (v) => v,
    refRange: () => CLINICAL_REFERENCES.Thyroglobulin.standard,
    optimalRange: () => CLINICAL_REFERENCES.Thyroglobulin.postThyroidectomy,
  },
};

export function refRowText(key, unit) {
  const cfg = UNIT_FIELDS[key];
  const ref = cfg.refRange(unit || cfg.baseUnit);
  return `${fmtBound(ref.low)} – ${fmtBound(ref.high)} ${ref.unit}`;
}

const TSH_OPTIMAL_NOTE = {
  removed: 'post-surgery',
  partial: 'post-surgery',
  rai: 'post-RAI',
  cancer: 'suppression target',
  hashimotos: 'your target',
  graves: 'your target',
  intact_hypo: 'your target',
  intact_hyper: 'your target',
  nodules: 'your target',
};

function statusFor(value, ref) {
  if (value > ref.high) return 'high';
  if (value < ref.low) return 'low';
  return 'normal';
}

const OPTIONAL_LABELS = {
  totalT4: 'Total T4',
  totalT3: 'Total T3',
  tpo: 'TPO Antibodies',
  thyroglobulin: 'Thyroglobulin',
  reverseT3: 'Reverse T3',
};

// Builds the rows for the side-by-side comparison panel, always derived
// fresh from whatever values were actually entered — never from presets.
export function buildComparisonRows({ tsh, tshUnit, ft4, ft4Unit, ft3, ft3Unit, status, optional }) {
  const rows = [];

  const tshRef = UNIT_FIELDS.tsh.refRange(tshUnit);
  const tshTarget = TSH_TARGETS[status] || TSH_TARGETS.removed;
  rows.push({
    key: 'tsh',
    label: 'TSH',
    value: tsh,
    unit: tshUnit,
    status: statusFor(tsh, tshRef),
    labRef: { low: fmtBound(tshRef.low), high: fmtBound(tshRef.high), unit: tshRef.unit },
    optimalRef: { low: fmtBound(tshTarget.low), high: fmtBound(tshTarget.high), unit: tshUnit, note: TSH_OPTIMAL_NOTE[status] },
  });

  const ft4Ref = UNIT_FIELDS.ft4.refRange(ft4Unit);
  const ft4Opt = UNIT_FIELDS.ft4.optimalRange(ft4Unit);
  rows.push({
    key: 'ft4',
    label: 'Free T4',
    value: ft4,
    unit: ft4Unit,
    status: statusFor(ft4, ft4Ref),
    labRef: { low: fmtBound(ft4Ref.low), high: fmtBound(ft4Ref.high), unit: ft4Ref.unit },
    optimalRef: { low: fmtBound(ft4Opt.low), high: fmtBound(ft4Opt.high), unit: ft4Opt.unit },
  });

  const ft3Ref = UNIT_FIELDS.ft3.refRange(ft3Unit);
  const ft3Opt = UNIT_FIELDS.ft3.optimalRange(ft3Unit);
  rows.push({
    key: 'ft3',
    label: 'Free T3',
    value: ft3,
    unit: ft3Unit,
    status: statusFor(ft3, ft3Ref),
    labRef: { low: fmtBound(ft3Ref.low), high: fmtBound(ft3Ref.high), unit: ft3Ref.unit },
    optimalRef: { low: fmtBound(ft3Opt.low), high: fmtBound(ft3Opt.high), unit: ft3Opt.unit },
  });

  for (const key of ['totalT4', 'totalT3', 'tpo', 'thyroglobulin', 'reverseT3']) {
    const entry = optional[key];
    if (!entry) continue;
    const val = parseFloat(entry.value);
    if (Number.isNaN(val)) continue;
    const cfg = UNIT_FIELDS[key];
    const unit = entry.unit || cfg.baseUnit;
    const ref = cfg.refRange(unit);
    const opt = cfg.optimalRange ? cfg.optimalRange(unit) : null;
    rows.push({
      key,
      label: OPTIONAL_LABELS[key],
      value: val,
      unit,
      status: statusFor(val, ref),
      labRef: { low: fmtBound(ref.low), high: fmtBound(ref.high), unit: ref.unit },
      optimalRef: opt
        ? { low: fmtBound(opt.low), high: fmtBound(opt.high), unit: opt.unit }
        : { low: fmtBound(ref.low), high: fmtBound(ref.high), unit: ref.unit },
    });
  }

  return rows;
}
