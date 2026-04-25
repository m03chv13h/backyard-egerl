import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div className="page-center">
      <div className="card">
        <h1 className="neon-text" style={{ color: 'var(--color-danger)' }}>
          403 — ACCESS DENIED
        </h1>
        <p className="muted">You do not have permission to access this page.</p>
        <Link to="/events" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Events
        </Link>
      </div>
    </div>
  );
}
