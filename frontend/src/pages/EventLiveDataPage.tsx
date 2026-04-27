import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api/client';
import type { LiveTimingRow } from '../types/api';
import { formatDuration, computeFastestSlowest } from '../utils/duration';

const INTERVAL_OPTIONS = [5, 10, 15, 30, 60];
const DEFAULT_INTERVAL = 10;

export default function EventLiveDataPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);

  const [rows, setRows] = useState<LiveTimingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadInterval, setReloadInterval] = useState(DEFAULT_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(() => {
    return api
      .getLiveData(eventId)
      .then((data) => {
        setRows(data);
        setLastUpdated(new Date());
        setError('');
      })
      .catch((e: Error) => {
        setError(e.message);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [eventId]);

  /* initial fetch + polling */
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, reloadInterval * 1000);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [fetchData, reloadInterval]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const { fastestMin, slowestMin } = useMemo(
    () => computeFastestSlowest(rows),
    [rows],
  );

  if (loading) return <div className="page-loading">Loading live data…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="neon-text">LIVE DATA</h1>
          <p className="meta">Event #{eventId}</p>
        </div>
        <Link to={`/events/${eventId}`} className="btn btn-sm">
          ← Event Details
        </Link>
      </div>

      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label htmlFor="reload-interval" style={{ whiteSpace: 'nowrap' }}>
            Auto-reload every:
          </label>
          <select
            id="reload-interval"
            className="input"
            style={{ width: 'auto' }}
            value={reloadInterval}
            onChange={(e) => setReloadInterval(Number(e.target.value))}
          >
            {INTERVAL_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}s
              </option>
            ))}
          </select>
          <button
            className={`btn btn-sm btn-primary${refreshing ? ' disabled' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? '↻ Refreshing…' : '↻ Refresh'}
          </button>
          {lastUpdated && (
            <span className="muted" style={{ fontSize: '0.8em' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <table className="data-table live-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Laps</th>
            <th>Last Lap</th>
            <th>Avg Lap</th>
            <th>Best Lap</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="rank">{r.rank}</td>
              <td>{r.name}</td>
              <td>{r.laps}</td>
              <td className="mono">{formatDuration(r.last_laptime)}</td>
              <td className="mono">{formatDuration(r.avg_laptime)}</td>
              <td
                className={`mono${
                  r.min_laptime === null
                    ? ''
                    : r.name === fastestMin
                    ? ' lap-fastest'
                    : r.name === slowestMin
                    ? ' lap-slowest'
                    : ' highlight'
                }`}
              >
                {formatDuration(r.min_laptime)}
              </td>
              <td>
                <span className={`status-badge status-${r.status.toLowerCase()}`}>
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                No live data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
