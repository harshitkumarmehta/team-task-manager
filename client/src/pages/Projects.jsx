import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import './Projects.css';

export default function Projects() {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const data = await apiFetch('/projects', {}, token);
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(form)
      }, token);
      setForm({ name: '', description: '' });
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project?')) return;
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' }, token);
      fetchProjects();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="loading-text">Loading...</div>;

  return (
    <div>
      <div className="projects-header">
        <h2 className="page-title" style={{ margin: 0 }}>Projects</h2>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {error && <div className="error-msg" style={{ marginTop: 10 }}>{error}</div>}

      {showForm && (
        <form className="card project-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
              placeholder="e.g. Website Redesign"
            />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Short description"
            />
          </div>
          <button type="submit" className="btn btn-primary">Create Project</button>
        </form>
      )}

      {projects.length === 0 ? (
        <p className="empty-state">No projects yet{user?.role === 'admin' ? ' — create one above.' : '.'}</p>
      ) : (
        <div className="projects-list">
          {projects.map(p => (
            <div key={p.id} className="project-row">
              <div className="project-info">
                <Link to={`/projects/${p.id}`} className="project-name">{p.name}</Link>
                {p.description && <span className="project-desc">{p.description}</span>}
                <span className="project-meta">{p.member_count} members · {p.task_count} tasks</span>
              </div>
              <div className="project-actions">
                <Link to={`/projects/${p.id}`} className="btn btn-secondary btn-sm">View</Link>
                {user?.role === 'admin' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
