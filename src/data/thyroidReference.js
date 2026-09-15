// Verified thyroid function reference data sourced from the American Thyroid
// Association (ATA), British Thyroid Association (BTA), ARUP Laboratories,
// Quest Diagnostics, LabCorp, and NHS reference ranges. Used for the
// side-by-side comparison panel and unit-aware form reference rows.
export const CLINICAL_REFERENCES = {
  TSH: {
    standard: { low: 0.35, high: 4.94, unit: 'mIU/L' },
    ATA: { low: 0.45, high: 4.5, unit: 'mIU/L' },
    BTA: { low: 0.35, high: 4.94, unit: 'mIU/L' },
    NHS: { low: 0.35, high: 5.5, unit: 'mIU/L' },
    ARUP: { low: 0.40, high: 4.50, unit: 'mIU/L' },
    Quest: { low: 0.45, high: 4.50, unit: 'mIU/L' },
    LabCorp: { low: 0.40, high: 4.50, unit: 'mIU/L' },
    postThyroidectomy: { low: 0.5, high: 2.0, unit: 'mIU/L' },
    cancerSuppression: { low: 0.1, high: 0.5, unit: 'mIU/L' },
    pregnancy_T1: { low: 0.1, high: 2.5, unit: 'mIU/L' },
    pregnancy_T2: { low: 0.2, high: 3.0, unit: 'mIU/L' },
    pregnancy_T3: { low: 0.3, high: 3.0, unit: 'mIU/L' },
  },
  FreeT4: {
    standard_pmol: { low: 9.0, high: 19.0, unit: 'pmol/L' },
    standard_ngdl: { low: 0.7, high: 1.48, unit: 'ng/dL' },
    ATA_ngdl: { low: 0.8, high: 1.8, unit: 'ng/dL' },
    NHS_pmol: { low: 9.0, high: 21.0, unit: 'pmol/L' },
    ARUP_ngdl: { low: 0.82, high: 1.77, unit: 'ng/dL' },
    Quest_ngdl: { low: 0.82, high: 1.77, unit: 'ng/dL' },
    LabCorp_ngdl: { low: 0.82, high: 1.77, unit: 'ng/dL' },
    optimal_pmol: { low: 12.0, high: 17.0, unit: 'pmol/L' },
    optimal_ngdl: { low: 0.93, high: 1.32, unit: 'ng/dL' },
  },
  FreeT3: {
    standard_pmol: { low: 2.43, high: 6.02, unit: 'pmol/L' },
    standard_pgml: { low: 1.58, high: 3.91, unit: 'pg/mL' },
    ATA_pgml: { low: 2.3, high: 4.2, unit: 'pg/mL' },
    NHS_pmol: { low: 2.43, high: 6.02, unit: 'pmol/L' },
    ARUP_pgml: { low: 2.0, high: 4.4, unit: 'pg/mL' },
    Quest_pgml: { low: 2.3, high: 4.2, unit: 'pg/mL' },
    LabCorp_pgml: { low: 2.3, high: 4.2, unit: 'pg/mL' },
    optimal_pmol: { low: 3.5, high: 5.5, unit: 'pmol/L' },
    optimal_pgml: { low: 2.27, high: 3.57, unit: 'pg/mL' },
  },
  TotalT4: {
    standard_nmol: { low: 58.0, high: 161.0, unit: 'nmol/L' },
    standard_ugdl: { low: 4.5, high: 12.5, unit: 'ug/dL' },
    ATA_ugdl: { low: 5.0, high: 12.0, unit: 'ug/dL' },
    NHS_nmol: { low: 58.0, high: 161.0, unit: 'nmol/L' },
  },
  TotalT3: {
    standard_nmol: { low: 0.89, high: 2.44, unit: 'nmol/L' },
    standard_ngdl: { low: 58.0, high: 159.0, unit: 'ng/dL' },
    ATA_ngdl: { low: 80.0, high: 200.0, unit: 'ng/dL' },
  },
  TPOAntibodies: {
    standard: {
      low: 0, high: 34, unit: 'IU/mL',
      note: "Elevated suggests Hashimoto's or Graves'",
    },
  },
  Thyroglobulin: {
    standard: {
      low: 0, high: 55, unit: 'ug/L',
      note: 'Used post-thyroidectomy to monitor for recurrence',
    },
    postThyroidectomy: {
      low: 0, high: 2, unit: 'ug/L',
      note: 'Should be undetectable after total thyroidectomy',
    },
  },
  ReverseT3: {
    standard_ngdl: { low: 9.2, high: 24.1, unit: 'ng/dL' },
    standard_pmol: { low: 14.0, high: 37.0, unit: 'pmol/L' },
    note: 'Elevated rT3 suggests T4→T3 conversion problem',
  },
};

export const UNIT_CONVERSIONS = {
  FreeT4: {
    pmolToNgdl: (v) => v * 0.0777,
    ngdlToPmol: (v) => v * 12.871,
  },
  FreeT3: {
    pmolToPgml: (v) => v * 0.651,
    pgmlToPmol: (v) => v * 1.536,
  },
  TotalT4: {
    nmolToUgdl: (v) => v * 0.0777,
    ugdlToNmol: (v) => v * 12.871,
  },
  TotalT3: {
    nmolToNgdl: (v) => v * 65.1,
    ngdlToNmol: (v) => v * 0.01536,
  },
  ReverseT3: {
    ngdlToPmol: (v) => v * 1.536,
    pmolToNgdl: (v) => v * 0.651,
  },
};
