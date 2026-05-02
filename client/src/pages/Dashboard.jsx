import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import './Dashboard.css';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState(null); // 'tasks', 'projects', 'members'
  const [viewData, setViewData] = useState([]);
  const [loadingView, setLoadingView] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    apiFetch('/dashboard/stats', {}, token)
      .then(setStats)
      .catch(err => setError(err.message));
  }, [token]);

  const loadDetail = async (type, params = {}) => {
    setLoadingView(true);
    setView(type);
    setFilter(params.status || params.overdue || '');
    
    try {
      let endpoint = '';
      if (type === 'tasks') {
        const query = new URLSearchParams(params).toString();
        endpoint = `/tasks?${query}`;
      } else if (type === 'projects') {
        endpoint = '/projects';
      } else if (type === 'members') {
        endpoint = '/dashboard/users';
      }
      
      const data = await apiFetch(endpoint, {}, token);
      setViewData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingView(false);
    }
  };

  if (error) return <div className="error-msg">{error}</div>;
  if (!stats) return <div className="loading-text">Loading...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="page-title">Dashboard</h2>
      <p className="dash-welcome">Welcome back, {user?.name}</p>

      <div className="stats-grid">
        <div 
          className={`stat-card clickable ${view === 'tasks' && !filter ? 'active' : ''}`} 
          onClick={() => loadDetail('tasks')}
        >
          <h2>{stats.total}</h2>
          <span>Total Tasks</span>
        </div>
        <div 
          className={`stat-card clickable ${filter === 'inprogress' ? 'active' : ''}`} 
          onClick={() => loadDetail('tasks', { status: 'inprogress' })}
        >
          <h2>{stats.inprogress}</h2>
          <span>In Progress</span>
        </div>
        <div 
          className={`stat-card clickable ${filter === 'done' ? 'active' : ''}`} 
          onClick={() => loadDetail('tasks', { status: 'done' })}
        >
          <h2>{stats.done}</h2>
          <span>Completed</span>
        </div>
        <div 
          className={`stat-card stat-card--warn clickable ${filter === 'true' ? 'active' : ''}`} 
          onClick={() => loadDetail('tasks', { overdue: 'true' })}
        >
          <h2>{stats.overdue}</h2>
          <span>Overdue</span>
        </div>
        <div 
          className={`stat-card clickable ${view === 'projects' ? 'active' : ''}`} 
          onClick={() => loadDetail('projects')}
        >
          <h2>{stats.total_projects}</h2>
          <span>Projects</span>
        </div>
        {user?.role === 'admin' && (
          <div 
            className={`stat-card clickable ${view === 'members' ? 'active' : ''}`} 
            onClick={() => loadDetail('members')}
          >
            <h2>{stats.total_members}</h2>
            <span>Members</span>
          </div>
        )}
      </div>

      <div className="dashboard-detail">
        {!view && (
          <div className="dash-note">
            <p>Click on any card above to see details.</p>
          </div>
        )}

        {loadingView && <div className="loading-text">Loading details...</div>}

        {view === 'tasks' && !loadingView && (
          <div className="detail-section">
            <h3>{filter === 'true' ? 'Overdue Tasks' : filter ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Tasks` : 'All Tasks'}</h3>
            {viewData.length === 0 ? <p>No tasks found.</p> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {viewData.map(task => (
                    <tr key={task.id}>
                      <td>{task.title}</td>
                      <td>{task.project_name}</td>
                      <td>{task.assignee_name || 'Unassigned'}</td>
                      <td><span className={`badge badge--${task.status}`}>{task.status}</span></td>
                      <td>{new Date(task.due_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {view === 'projects' && !loadingView && (
          <div className="detail-section">
            <h3>All Projects</h3>
            <div className="project-list-mini">
              {viewData.map(p => (
                <div key={p.id} className="list-item">
                  <strong>{p.name}</strong> - {p.task_count} tasks, {p.member_count} members
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'members' && !loadingView && (
          <div className="detail-section">
            <h3>Team Members</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {viewData.map(m => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
