import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import './ProjectDetail.css';

function isOverdue(task) {
  return task.status !== 'done' && new Date(task.due_date) < new Date();
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
  const [taskError, setTaskError] = useState('');

  // member form state
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    loadAll();
  }, [id]);

  async function loadAll() {
    setLoading(true);
    try {
      const [t, m] = await Promise.all([
        apiFetch(`/tasks/project/${id}`, {}, token),
        apiFetch(`/projects/${id}/members`, {}, token)
      ]);
      setTasks(t);
      setMembers(m);

      if (user?.role === 'admin') {
        const u = await apiFetch('/dashboard/users', {}, token);
        setAllUsers(u);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setTaskError('');
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ ...taskForm, project_id: id })
      }, token);
      setTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
      setShowTaskForm(false);
      loadAll();
    } catch (err) {
      setTaskError(err.message);
    }
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      await apiFetch(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      }, token);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' }, token);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    try {
      await apiFetch(`/projects/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: selectedUser })
      }, token);
      setSelectedUser('');
      setShowMemberForm(false);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemoveMember(userId) {
    if (!confirm('Remove this member?')) return;
    try {
      await apiFetch(`/projects/${id}/members/${userId}`, { method: 'DELETE' }, token);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterAssignee && String(t.assigned_to) !== filterAssignee) return false;
    return true;
  });

  if (loading) return <div className="loading-text">Loading...</div>;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div>
      <h2 className="page-title">Project Tasks</h2>

      {/* Members section */}
      <div className="section-block">
        <div className="section-head">
          <span className="section-label">Members ({members.length})</span>
          {user?.role === 'admin' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberForm(!showMemberForm)}>
              {showMemberForm ? 'Cancel' : '+ Add Member'}
            </button>
          )}
        </div>

        {showMemberForm && (
          <form className="inline-form" onSubmit={handleAddMember}>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required style={{ maxWidth: 220 }}>
              <option value="">Select user</option>
              {allUsers.filter(u => !members.find(m => m.id === u.id)).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary btn-sm">Add</button>
          </form>
        )}

        <div className="members-row">
          {members.map(m => (
            <div key={m.id} className="member-chip">
              <span>{m.name}</span>
              <span className="chip-role">{m.role}</span>
              {user?.role === 'admin' && (
                <button className="chip-remove" onClick={() => handleRemoveMember(m.id)} title="Remove">×</button>
              )}
            </div>
          ))}
          {members.length === 0 && <span className="empty-state">No members yet.</span>}
        </div>
      </div>

      {/* Tasks section */}
      <div className="section-block">
        <div className="section-head">
          <span className="section-label">Tasks ({filteredTasks.length})</span>
          {user?.role === 'admin' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowTaskForm(!showTaskForm)}>
              {showTaskForm ? 'Cancel' : '+ New Task'}
            </button>
          )}
        </div>

        {/* filters */}
        <div className="filter-row">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 140 }}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ width: 160 }}>
            <option value="">All Members</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {showTaskForm && (
          <form className="card task-form" onSubmit={handleCreateTask}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Title *</label>
                <input type="text" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} required placeholder="Task title" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Assign To *</label>
                <select value={taskForm.assigned_to} onChange={e => setTaskForm(p => ({ ...p, assigned_to: e.target.value }))} required>
                  <option value="">Select member</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Due Date *</label>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Optional" />
            </div>
            {taskError && <div className="error-msg">{taskError}</div>}
            <button type="submit" className="btn btn-primary btn-sm">Create Task</button>
          </form>
        )}

        {filteredTasks.length === 0 ? (
          <p className="empty-state">No tasks found.</p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                {user?.role === 'admin' && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
                <tr key={t.id} className={isOverdue(t) ? 'row-overdue' : ''}>
                  <td>
                    <span className="task-title">{t.title}</span>
                    {t.description && <span className="task-desc">{t.description}</span>}
                  </td>
                  <td>{t.assignee_name || '—'}</td>
                  <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                  <td>
                    <span className={isOverdue(t) ? 'overdue-date' : ''}>
                      {formatDate(t.due_date)}
                      {isOverdue(t) && <span className="badge badge-overdue" style={{ marginLeft: 5 }}>overdue</span>}
                    </span>
                  </td>
                  <td>
                    <select
                      value={t.status}
                      onChange={e => handleStatusChange(t.id, e.target.value)}
                      className={`status-select status-${t.status}`}
                      disabled={user?.role !== 'admin' && t.assigned_to !== user?.id}
                    >
                      <option value="todo">To Do</option>
                      <option value="inprogress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                  {user?.role === 'admin' && (
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(t.id)}>Del</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
