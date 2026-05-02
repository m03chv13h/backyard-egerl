import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Tooltip,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from '../api/client';
import type { LiveTimingRow } from '../types/api';
import { ROUTE_POINTS, ROUTE_DURATION_S } from '../data/routeData';
import { sumDurations } from '../utils/duration';
import { displayName } from '../utils/displayName';
import { getCustomization } from '../utils/runnerCustomization';

/* ── helpers ── */

/** Lat/lng pairs for the route polyline. */
const routeLatLngs: [number, number][] = ROUTE_POINTS.map(([lat, lon]) => [
  lat,
  lon,
]);

/** Centre of the route bounding box (used for initial map view). */
const routeCenter: [number, number] = (() => {
  let minLat = 90,
    maxLat = -90,
    minLon = 180,
    maxLon = -180;
  for (const [lat, lon] of ROUTE_POINTS) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  return [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
})();

/**
 * Given elapsed seconds since the runner started this lap, interpolate a
 * position along the GPX track.  The GPX timestamps define the pace.
 */
function interpolatePosition(elapsedSeconds: number): [number, number] {
  /* Clamp to route duration */
  const t = Math.max(0, Math.min(elapsedSeconds, ROUTE_DURATION_S));

  /* Find the two track-points that bracket `t` */
  for (let i = 1; i < ROUTE_POINTS.length; i++) {
    const [lat0, lon0, t0] = ROUTE_POINTS[i - 1];
    const [lat1, lon1, t1] = ROUTE_POINTS[i];
    if (t <= t1) {
      const frac = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      return [lat0 + frac * (lat1 - lat0), lon0 + frac * (lon1 - lon0)];
    }
  }
  /* Fallback: last point */
  const last = ROUTE_POINTS[ROUTE_POINTS.length - 1];
  return [last[0], last[1]];
}

/**
 * Estimate where a runner is right now.
 *
 * Backyard-ultra rules: runners start every full hour.
 * We calculate seconds elapsed since the last full-hour mark and map that to
 * the GPX track.  If a runner has a known average pace that differs from the
 * GPX pace we scale proportionally so faster runners appear further ahead.
 */
function estimateRunnerPosition(
  row: LiveTimingRow,
  now: Date,
): [number, number] | null {
  const status = getCustomization(row.name)?.statusOverride || row.status;
  if (status.toUpperCase() === 'DNF') return null;

  /* Seconds since last full hour */
  const elapsedInHour = now.getMinutes() * 60 + now.getSeconds();

  /* If the runner has an average lap time we can scale the GPX time so the
     marker reflects their personal pace instead of the generic track pace. */
  const avgSec = row.avg_laptime ? sumDurations([row.avg_laptime]) : 0;

  let scaledElapsed: number;
  if (avgSec > 0) {
    /* fraction of lap completed based on runner's average pace */
    const fraction = Math.min(elapsedInHour / avgSec, 1);
    scaledElapsed = fraction * ROUTE_DURATION_S;
  } else {
    /* Fall back to GPX pace */
    scaledElapsed = Math.min(elapsedInHour, ROUTE_DURATION_S);
  }

  return interpolatePosition(scaledElapsed);
}

/** Build a small coloured circle-icon for each runner marker. */
const COLORS = [
  '#00ffff',
  '#ff00ff',
  '#39ff14',
  '#ff3333',
  '#ffff00',
  '#ff8800',
  '#00ff88',
  '#8888ff',
  '#ff88ff',
  '#88ffff',
];

function runnerIcon(index: number): L.DivIcon {
  const color = COLORS[index % COLORS.length];
  return L.divIcon({
    className: 'runner-marker',
    html: `<span style="
      display:inline-block;
      width:14px;height:14px;
      border-radius:50%;
      background:${color};
      border:2px solid #fff;
      box-shadow:0 0 6px ${color};
    "></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

/* ── start/finish icon ── */
const startIcon = L.divIcon({
  className: 'start-marker',
  html: `<span style="
    display:inline-flex;align-items:center;justify-content:center;
    width:24px;height:24px;border-radius:50%;
    background:#39ff14;color:#000;font-weight:700;font-size:14px;
    border:2px solid #fff;box-shadow:0 0 8px #39ff14;
  ">S</span>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

/* ── constants ── */
const INTERVAL_OPTIONS = [5, 10, 15, 30, 60];
const DEFAULT_INTERVAL = 10;

/* ══════════════════════════════════════════════════════ */
export default function EventMapPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);

  const [rows, setRows] = useState<LiveTimingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadInterval, setReloadInterval] = useState(DEFAULT_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(() => {
    return api
      .getLiveData(eventId)
      .then((data) => {
        setRows(data);
        setLastUpdated(new Date());
        setNow(new Date());
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

  /* polling */
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, reloadInterval * 1000);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [fetchData, reloadInterval]);

  /* tick clock every second so marker positions update smoothly */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  /* Compute runner positions – exclude runners whose effective status is DNF */
  const runnerPositions = useMemo(() => {
    return rows
      .map((row, idx) => {
        const custom = getCustomization(row.name);
        const status = custom?.statusOverride || row.status;
        if (status.toLowerCase() === 'dnf') return null;
        const pos = estimateRunnerPosition(row, now);
        if (!pos) return null;
        return { row, pos, idx };
      })
      .filter(
        (x): x is { row: LiveTimingRow; pos: [number, number]; idx: number } =>
          x !== null,
      );
  }, [rows, now]);

  if (loading)
    return <div className="page-loading">Loading map data…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="neon-text">RUNNER MAP</h1>
          <p className="meta">Event #{eventId}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/events/${eventId}/runners`} className="btn btn-sm">
            😀 Runners
          </Link>
          <Link to={`/events/${eventId}/live_data`} className="btn btn-sm">
            ← Live Data
          </Link>
          <Link to="/events" className="btn btn-sm">
            ← Overview
          </Link>
        </div>
      </div>

      <div
        className="section-header"
        style={{ marginBottom: '1rem' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
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

      <div className="map-wrapper">
        <MapContainer
          center={routeCenter}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route line */}
          <Polyline
            positions={routeLatLngs}
            pathOptions={{ color: '#00ffff', weight: 4, opacity: 0.8 }}
          />

          {/* Start/Finish marker */}
          <Marker position={routeLatLngs[0]} icon={startIcon}>
            <Tooltip permanent direction="top" offset={[0, -14]}>
              Start / Finish
            </Tooltip>
          </Marker>

          {/* Runner markers */}
          {runnerPositions.map(({ row, pos, idx }) => (
            <Marker key={idx} position={pos} icon={runnerIcon(idx)}>
              <Tooltip permanent direction="top" offset={[0, -10]}>
                <span style={{ fontWeight: 700 }}>{displayName(row.name)}</span>
                <br />
                Lap {row.laps + 1}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      {runnerPositions.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Runners on Map</h3>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem 1.5rem',
            }}
          >
            {runnerPositions.map(({ row, idx }) => (
              <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: COLORS[idx % COLORS.length],
                    border: '1px solid #fff',
                  }}
                />
                {displayName(row.name)} — Lap {row.laps + 1}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
