import { useState } from 'react';
import { apiUrl } from '../utils/apiBase.js';

export default function DoctorReportButton({ name, patientId, status, dose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        name: name || '',
        patientId: patientId || '',
        status: status || '',
        dose: dose || '',
      });
      const res = await fetch(apiUrl(`/api/export/doctor-report?${params.toString()}`));
      if (!res.ok) throw new Error('export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'thyrotrack-doctor-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="doctor-report-block">
      <button type="button" className="doctor-report-btn" onClick={handleClick} disabled={loading}>
        {loading ? 'Generating…' : '\u{1F4C4} Generate doctor report'}
      </button>
      {error && (
        <div className="doctor-report-error">
          Couldn't reach the report server — make sure the ThyroTrack backend is running.
        </div>
      )}
    </div>
  );
}
