import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api/client';
import type { LiveTimingRow } from '../types/api';
import {
  formatDuration,
  computeFastestSlowest,
  sumDurations,
  formatTotalDuration,
} from '../utils/duration';
import { LapTimeChart } from '../components/LapTimeChart';

const KM_PER_LAP = 6.7;

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

  const { totalKm, totalRuntime } = useMemo(() => {
    const km = rows.reduce((acc, r) => acc + r.laps * KM_PER_LAP, 0);
    const runtime = rows.reduce(
      (acc, r) => acc + sumDurations(r.all_laps),
      0,
    );
    return { totalKm: km, totalRuntime: runtime };
  }, [rows]);

  if (loading) return <div className="page-loading">Loading live data…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="neon-text">LIVE DATA</h1>
          <p className="meta">Event #{eventId}</p>
        </div>
        <Link to="/events" className="btn btn-sm">
          ← Overview
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

      {rows.length > 0 && (
        <div
          className="card"
          style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}
        >
          <div>
            <span className="muted" style={{ fontSize: '0.8em' }}>Total KM</span>
            <div className="neon-text" style={{ fontSize: '1.4em', fontWeight: 700 }}>
              {totalKm.toFixed(1)} km
            </div>
          </div>
          <div>
            <span className="muted" style={{ fontSize: '0.8em' }}>Total Running Time</span>
            <div className="neon-text" style={{ fontSize: '1.4em', fontWeight: 700 }}>
              {formatTotalDuration(totalRuntime)}
            </div>
          </div>
        </div>
      )}

      <table className="data-table live-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Laps</th>
            <th>KM</th>
            <th>Total Time</th>
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
              <td className="mono">{(r.laps * KM_PER_LAP).toFixed(1)} km</td>
              <td className="mono">{formatTotalDuration(sumDurations(r.all_laps))}</td>
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
              <td colSpan={9} className="muted">
                No live data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {rows.some((r) => r.all_laps.length >= 2) && (
        <section>
          <h2 style={{ marginBottom: '0.75rem' }}>Lap Time Charts</h2>
          <div className="lap-charts-section">
            {rows
              .filter((r) => r.all_laps.length >= 2)
              .map((r) => (
                <LapTimeChart key={r.name} name={r.name} laps={r.all_laps} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
