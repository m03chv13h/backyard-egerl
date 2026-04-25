import { useEffect, useState, useCallback } from 'react';
import * as api from '../api/client';
import type { ScannerStatus } from '../types/api';
import { ScannerMode } from '../types/api';

const modeLabel = (mode: ScannerMode | null): string => {
  switch (mode) {
    case ScannerMode.Off:
      return 'OFF';
    case ScannerMode.Read:
      return 'READ';
    case ScannerMode.Write:
      return 'WRITE';
    default:
      return 'UNKNOWN';
  }
};

export default function ScannerStatusPage() {
  const [status, setStatus] = useState<ScannerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    api
      .getScannerStatus()
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on mount
    refresh();
  }, [refresh]);

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!status) return <div className="error-text">Could not fetch scanner status.</div>;

  return (
    <div className="page">
      <h1 className="neon-text">SCANNER STATUS</h1>
      <div className="card scanner-card">
        <div className="scanner-indicator-row">
          <span
            className={`scanner-indicator ${status.connected ? 'online' : 'offline'}`}
          />
          <span className="scanner-label">
            {status.connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
        <table className="data-table">
          <tbody>
            <tr>
              <td>Mode</td>
              <td className="mono">{modeLabel(status.mode)}</td>
            </tr>
            <tr>
              <td>Event ID</td>
              <td className="mono">{status.event_id ?? '—'}</td>
            </tr>
          </tbody>
        </table>
        <button className="btn btn-sm" style={{ marginTop: '1rem' }} onClick={refresh}>
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}
