import { useRef, useState } from 'react';

export default function LabScanButton({ onExtracted }) {
  const inputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setScanning(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/scan-lab-report', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('scan failed');
      const result = await res.json();
      onExtracted?.(result);
    } catch {
      setError('Could not reach the scan server — make sure the ThyroTrack backend is running.');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="lab-scan-wrap">
      <button type="button" className="lab-scan-btn" onClick={() => inputRef.current?.click()} disabled={scanning}>
        {scanning ? 'Scanning…' : '\u{1F4F7} Scan lab report'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      {error && <div className="lab-scan-error">{error}</div>}
    </div>
  );
}
