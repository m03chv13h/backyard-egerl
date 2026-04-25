import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api/client';
import type { RunnerPublic } from '../types/api';

export default function RunnerPage() {
  const { runnerId } = useParams<{ runnerId: string }>();
  const [runner, setRunner] = useState<RunnerPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getRunner(Number(runnerId))
      .then(setRunner)
      .finally(() => setLoading(false));
  }, [runnerId]);

  if (loading) return <div className="page-loading">Loading runner…</div>;
  if (!runner) return <div className="error-text">Runner not found.</div>;

  return (
    <div className="page">
      <h1 className="neon-text">RUNNER #{runner.id}</h1>
      <div className="card">
        <table className="data-table">
          <tbody>
            <tr>
              <td>ID</td>
              <td className="mono">{runner.id}</td>
            </tr>
            <tr>
              <td>Name</td>
              <td>{runner.name}</td>
            </tr>
          </tbody>
        </table>
        <Link to="/events" className="btn btn-sm" style={{ marginTop: '1rem' }}>
          ← Events
        </Link>
      </div>
    </div>
  );
}
