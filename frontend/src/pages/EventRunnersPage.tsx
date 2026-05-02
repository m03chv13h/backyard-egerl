import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api/client';
import type { LiveTimingRow } from '../types/api';
import {
  loadCustomizations,
  saveCustomizations,
  type RunnerCustomizations,
} from '../utils/runnerCustomization';

const POPULAR_EMOJIS = [
  '🏃', '🔥', '⚡', '🌟', '💪', '🏆', '🎯', '🚀',
  '🦊', '🐺', '🦁', '🐻', '🦅', '🐎', '🌲', '🌈',
  '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍',
  '👑', '🎸', '🎵', '⭐', '🍀', '🌻', '🦄', '🐉',
];

export default function EventRunnersPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);

  const [rows, setRows] = useState<LiveTimingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [customs, setCustoms] = useState<RunnerCustomizations>(loadCustomizations);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(() => {
    api
      .getLiveData(eventId)
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateField = (
    name: string,
    field: 'emoji' | 'nameOverride' | 'statusOverride',
    value: string,
  ) => {
    setCustoms((prev) => {
      const entry = prev[name] ?? { emoji: '', nameOverride: '' };
      return { ...prev, [name]: { ...entry, [field]: value } };
    });
    setSaved(false);
  };

  const toggleEmoji = (name: string, emoji: string) => {
    setCustoms((prev) => {
      const entry = prev[name] ?? { emoji: '', nameOverride: '' };
      const current = entry.emoji;
      return {
        ...prev,
        [name]: { ...entry, emoji: current === emoji ? '' : emoji },
      };
    });
    setSaved(false);
  };

  const handleSave = () => {
    // Remove entries with no customisation
    const cleaned: RunnerCustomizations = {};
    for (const [key, val] of Object.entries(customs)) {
      if (val.emoji || val.nameOverride || val.statusOverride) {
        cleaned[key] = val;
      }
    }
    saveCustomizations(cleaned);
    setCustoms(cleaned);
    setSaved(true);
  };

  const preview = (name: string) => {
    const c = customs[name];
    if (!c) return name;
    const base = c.nameOverride || name;
    return c.emoji ? `${base} ${c.emoji}` : base;
  };

  if (loading)
    return <div className="page-loading">Loading runner data…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="neon-text">RUNNER SETTINGS</h1>
          <p className="meta">Event #{eventId}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/events/${eventId}/live_data`} className="btn btn-sm">
            ← Live Data
          </Link>
          <Link to={`/events/${eventId}/map`} className="btn btn-sm">
            🗺️ Map
          </Link>
        </div>
      </div>

      <p className="muted" style={{ marginBottom: '1rem' }}>
        Assign emojis, optional display-name overrides, and status overrides.
        Changes are saved locally in your browser and shown in
        Live&nbsp;Data and Map views.
      </p>

      {rows.length === 0 && (
        <p className="muted">
          No runners found. Start live timing to see runners here.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Original Name</th>
                <th>Emoji</th>
                <th>Name Override</th>
                <th>Status Override</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const c = customs[r.name] ?? { emoji: '', nameOverride: '' };
                return (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td style={{ minWidth: 200 }}>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.25rem',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {POPULAR_EMOJIS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => toggleEmoji(r.name, em)}
                            style={{
                              fontSize: '1.2em',
                              padding: '0.15rem 0.3rem',
                              cursor: 'pointer',
                              border:
                                c.emoji === em
                                  ? '2px solid var(--accent)'
                                  : '1px solid transparent',
                              borderRadius: 4,
                              background:
                                c.emoji === em
                                  ? 'var(--surface-hover)'
                                  : 'transparent',
                            }}
                            title={em}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                      <input
                        className="input"
                        style={{ width: '100%' }}
                        placeholder="or type any emoji…"
                        value={c.emoji}
                        onChange={(e) =>
                          updateField(r.name, 'emoji', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        placeholder={r.name}
                        value={c.nameOverride}
                        onChange={(e) =>
                          updateField(r.name, 'nameOverride', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {['', 'Running', 'DNF'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`btn btn-sm${
                              (c.statusOverride ?? '') === opt ? ' btn-primary' : ''
                            }`}
                            onClick={() =>
                              updateField(r.name, 'statusOverride', opt)
                            }
                          >
                            {opt || 'API'}
                          </button>
                        ))}
                      </div>
                      {(c.statusOverride ?? '') !== '' && (
                        <span
                          className="muted"
                          style={{ fontSize: '0.75em', marginTop: '0.25rem', display: 'block' }}
                        >
                          Overriding API status to {c.statusOverride}
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {preview(r.name)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              💾 Save Settings
            </button>
            {saved && (
              <span style={{ color: 'var(--accent)' }}>
                ✓ Saved! Changes will appear in Live Data and Map.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
