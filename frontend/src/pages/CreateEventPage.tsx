import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [lapDuration, setLapDuration] = useState('PT1H');
  const [minLapDuration, setMinLapDuration] = useState('PT5M');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ev = await api.createEvent({
        name,
        date: new Date(date).toISOString(),
        lap_duration: lapDuration,
        min_lap_duration: minLapDuration,
      });
      navigate(`/events/${ev.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="neon-text">CREATE EVENT</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Event Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">Date &amp; Time</label>
            <input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lap">Lap Duration (ISO 8601)</label>
            <input
              id="lap"
              type="text"
              value={lapDuration}
              onChange={(e) => setLapDuration(e.target.value)}
              placeholder="PT1H"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="minLap">Min Lap Duration (ISO 8601)</label>
            <input
              id="minLap"
              type="text"
              value={minLapDuration}
              onChange={(e) => setMinLapDuration(e.target.value)}
              placeholder="PT5M"
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'CREATE EVENT'}
          </button>
        </form>
      </div>
    </div>
  );
}
