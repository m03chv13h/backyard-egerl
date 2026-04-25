import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import type { EventPublic } from '../types/api';

export default function EventListPage() {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<EventPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getEvents()
      .then(setEvents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading events…</div>;
  if (error) return <div className="error-text">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="neon-text">EVENTS</h1>
        {isAdmin && (
          <Link to="/events/new" className="btn btn-primary">
            + NEW EVENT
          </Link>
        )}
      </div>
      {events.length === 0 ? (
        <p className="muted">No events found.</p>
      ) : (
        <div className="card-grid">
          {events.map((ev) => (
            <Link key={ev.id} to={`/events/${ev.id}`} className="event-card card">
              <h2>{ev.name}</h2>
              <p className="meta">
                {new Date(ev.date).toLocaleDateString()} &middot; Lap:{' '}
                {ev.lap_duration}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
