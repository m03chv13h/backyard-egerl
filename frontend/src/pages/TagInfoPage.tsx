import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import type { TagInfoPublic } from '../types/api';

export default function TagInfoPage() {
  const { isAdmin } = useAuth();
  const [tag, setTag] = useState<TagInfoPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [rfid, setRfid] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api
      .getTagInfo()
      .then(setTag)
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.addTagInfo({
        rfid_tag_id: rfid,
        time: new Date().toISOString(),
      });
      setTag(result);
      setRfid('');
      setMsg('Tag added ✓');
    } catch {
      setMsg('Error adding tag');
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="page">
      <h1 className="neon-text">RFID TAG INFO</h1>

      {tag ? (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>RFID Tag ID</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">{tag.rfid_tag_id}</td>
                <td>{new Date(tag.time).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No tag data available.</p>
      )}

      {isAdmin && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>Add Tag</h2>
          {msg && <p className="info-text">{msg}</p>}
          <form className="inline-form" onSubmit={handleAdd}>
            <input
              placeholder="RFID Tag ID"
              value={rfid}
              onChange={(e) => setRfid(e.target.value)}
              required
            />
            <button className="btn btn-primary btn-sm" type="submit">
              Add Tag
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
