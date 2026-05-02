import { useEffect, useState, useCallback, type FormEvent, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../components/useConfirm';
import * as api from '../api/client';
import type {
  EventPublic,
  RegistrationRunnerPublic,
  LiveTimingRow,
} from '../types/api';
import {
  formatDuration,
  computeFastestSlowest,
  sumDurations,
  formatTotalDuration,
} from '../utils/duration';
import { displayName } from '../utils/displayName';
import { getEffectiveStatus } from '../utils/runnerCustomization';
import { LapTimeChart } from '../components/LapTimeChart';

const KM_PER_LAP = 6.7;

/* ── Sub-components ── */

function RegistrationSection({
  eventId,
  isAdmin,
}: {
  eventId: number;
  isAdmin: boolean;
}) {
  const [confirm, confirmModal] = useConfirm();
  const [regs, setRegs] = useState<RegistrationRunnerPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [bibNr, setBibNr] = useState('');
  const [rfid, setRfid] = useState('');
  const [startLap, setStartLap] = useState('1');

  const load = useCallback(() => {
    api
      .getRegistrations(eventId)
      .then(setRegs)
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    await api.addRunnerAndRegistration(eventId, {
      name,
      bib_nr: bibNr ? Number(bibNr) : null,
      rfid_tag_id: rfid || null,
      start_lap: Number(startLap) || 1,
    });
    setName('');
    setBibNr('');
    setRfid('');
    setStartLap('1');
    setShowForm(false);
    load();
  };

  const handleDelete = async (runnerId: number) => {
    if (!(await confirm('Remove this registration?'))) return;
    await api.deleteRegistration(eventId, runnerId);
    load();
  };

  if (loading) return <p>Loading registrations…</p>;

  return (
    <section>
      {confirmModal}
      <div className="section-header">
        <h2>Registrations ({regs.length})</h2>
        {isAdmin && (
          <button className="btn btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Runner'}
          </button>
        )}
      </div>
      {showForm && (
        <form className="inline-form" onSubmit={handleAdd}>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            placeholder="Bib #"
            type="number"
            value={bibNr}
            onChange={(e) => setBibNr(e.target.value)}
          />
          <input
            placeholder="RFID Tag"
            value={rfid}
            onChange={(e) => setRfid(e.target.value)}
          />
          <input
            placeholder="Start Lap"
            type="number"
            value={startLap}
            onChange={(e) => setStartLap(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" type="submit">
            Add
          </button>
        </form>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Bib</th>
            <th>Name</th>
            <th>RFID</th>
            <th>Start Lap</th>
            <th>DNF</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {regs.map((r) => (
            <tr key={r.runner_id}>
              <td>{r.bib_nr ?? '—'}</td>
              <td>{displayName(r.runner.name)}</td>
              <td className="mono">{r.rfid_tag_id ?? '—'}</td>
              <td>{r.start_lap}</td>
              <td>{r.dnf_lap ?? '—'}</td>
              {isAdmin && (
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(r.runner_id)}
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
          {regs.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 6 : 5} className="muted">
                No registrations yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function LiveTimingSection({ eventId }: { eventId: number }) {
  const [rows, setRows] = useState<LiveTimingRow[]>([]);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!polling) return;
    let active = true;
    const poll = () => {
      api
        .getLiveData(eventId)
        .then((data) => {
          if (active) setRows(data);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [eventId, polling]);

  const { fastestMin, slowestMin } = useMemo(
    () => computeFastestSlowest(rows),
    [rows],
  );

  const { totalKm, totalRuntime, activeRunners } = useMemo(() => {
    const km = rows.reduce((acc, r) => acc + r.laps * KM_PER_LAP, 0);
    const runtime = rows.reduce(
      (acc, r) => acc + sumDurations(r.all_laps),
      0,
    );
    const active = rows.filter((r) => {
      const status = getEffectiveStatus(r.name, r.status);
      return status.toLowerCase() === 'running';
    }).length;
    return { totalKm: km, totalRuntime: runtime, activeRunners: active };
  }, [rows]);

  return (
    <section>
      <div className="section-header">
        <h2>Live Timing</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link
            to={`/events/${eventId}/live_data`}
            className="btn btn-sm"
          >
            ⛶ Full Live View
          </Link>
          <Link
            to={`/events/${eventId}/map`}
            className="btn btn-sm"
          >
            🗺️ Map
          </Link>
          <Link
            to={`/events/${eventId}/runners`}
            className="btn btn-sm"
          >
            😀 Runners
          </Link>
          <button
            className={`btn btn-sm ${polling ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => setPolling(!polling)}
          >
            {polling ? '■ Stop' : '▶ Start'} Live
          </button>
        </div>
      </div>
      {rows.length > 0 && (
        <div
          className="card"
          style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}
        >
          <div>
            <span className="muted" style={{ fontSize: '0.8em' }}>Total KM</span>
            <div className="neon-text" style={{ fontSize: '1.2em', fontWeight: 700 }}>
              {totalKm.toFixed(1)} km
            </div>
          </div>
          <div>
            <span className="muted" style={{ fontSize: '0.8em' }}>Total Running Time</span>
            <div className="neon-text" style={{ fontSize: '1.2em', fontWeight: 700 }}>
              {formatTotalDuration(totalRuntime)}
            </div>
          </div>
          <div>
            <span className="muted" style={{ fontSize: '0.8em' }}>Active Runners</span>
            <div className="neon-text" style={{ fontSize: '1.2em', fontWeight: 700 }}>
              {activeRunners}
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
          {rows.map((r) => {
            const status = getEffectiveStatus(r.name, r.status);
            return (
            <tr key={r.rank}>
              <td className="rank">{r.rank}</td>
              <td>{displayName(r.name)}</td>
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
                <span className={`status-badge status-${status.toLowerCase()}`}>
                  {status}
                </span>
              </td>
            </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className="muted">
                {polling ? 'Waiting for data…' : 'Press Start to begin polling.'}
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
                <LapTimeChart key={r.name} name={displayName(r.name)} laps={r.all_laps} />
              ))}
          </div>
        </section>
      )}
    </section>
  );
}

function TimingFormSection({
  eventId,
}: {
  eventId: number;
}) {
  const [rfid, setRfid] = useState('');
  const [time, setTime] = useState('');
  const [lap, setLap] = useState('');
  const [lapTime, setLapTime] = useState('');
  const [msg, setMsg] = useState('');

  const handleTiming = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.addTiming(eventId, {
        rfid_tag_id: rfid,
        time: new Date(time).toISOString(),
      });
      setMsg('Timing added ✓');
      setRfid('');
      setTime('');
    } catch {
      setMsg('Error adding timing');
    }
  };

  const handleLapTiming = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.addLapTiming(eventId, {
        rfid_tag_id: rfid,
        lap: Number(lap),
        lap_time: lapTime,
      });
      setMsg('Lap timing added ✓');
      setLap('');
      setLapTime('');
    } catch {
      setMsg('Error adding lap timing');
    }
  };

  return (
    <section>
      <h2>Add Timing</h2>
      {msg && <p className="info-text">{msg}</p>}
      <div className="form-row">
        <form className="inline-form" onSubmit={handleTiming}>
          <input
            placeholder="RFID Tag"
            value={rfid}
            onChange={(e) => setRfid(e.target.value)}
            required
          />
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
          <button className="btn btn-primary btn-sm" type="submit">
            Add Timing
          </button>
        </form>
        <form className="inline-form" onSubmit={handleLapTiming}>
          <input
            placeholder="RFID Tag"
            value={rfid}
            onChange={(e) => setRfid(e.target.value)}
            required
          />
          <input
            placeholder="Lap #"
            type="number"
            value={lap}
            onChange={(e) => setLap(e.target.value)}
            required
          />
          <input
            placeholder="Lap Time (ISO duration)"
            value={lapTime}
            onChange={(e) => setLapTime(e.target.value)}
            required
          />
          <button className="btn btn-primary btn-sm" type="submit">
            Add Lap
          </button>
        </form>
      </div>
    </section>
  );
}

/* ── Main Event Detail Page ── */

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [confirmDelete, confirmDeleteModal] = useConfirm();
  const [event, setEvent] = useState<EventPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'registrations' | 'live' | 'timing'>(
    'registrations',
  );

  useEffect(() => {
    api
      .getEvent(eventId)
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleDelete = async () => {
    if (!(await confirmDelete(`Delete event "${event?.name}"?`))) return;
    await api.deleteEvent(eventId);
    navigate('/events');
  };

  if (loading) return <div className="page-loading">Loading event…</div>;
  if (!event) return <div className="error-text">Event not found.</div>;

  return (
    <div className="page">
      {confirmDeleteModal}
      <div className="page-header">
        <div>
          <h1 className="neon-text">{event.name}</h1>
          <p className="meta">
            {new Date(event.date).toLocaleString()} &middot; Lap:{' '}
            {event.lap_duration} &middot; Min Lap: {event.min_lap_duration}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-danger" onClick={handleDelete}>
            DELETE EVENT
          </button>
        )}
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === 'registrations' ? 'active' : ''}`}
          onClick={() => setTab('registrations')}
        >
          Registrations
        </button>
        <button
          className={`tab ${tab === 'live' ? 'active' : ''}`}
          onClick={() => setTab('live')}
        >
          Live Timing
        </button>
        {isAdmin && (
          <button
            className={`tab ${tab === 'timing' ? 'active' : ''}`}
            onClick={() => setTab('timing')}
          >
            Add Timing
          </button>
        )}
      </div>

      {tab === 'registrations' && (
        <RegistrationSection eventId={eventId} isAdmin={isAdmin} />
      )}
      {tab === 'live' && <LiveTimingSection eventId={eventId} />}
      {tab === 'timing' && isAdmin && (
        <TimingFormSection eventId={eventId} />
      )}
    </div>
  );
}
