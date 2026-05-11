import { useState, useEffect } from 'react';
import { getProjects, createProject, deleteProject } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#06b6d4', '#8b5cf6'];

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: COLORS[0],
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createProject(form);
      setProjects((p) => [res.data, ...p]);
      setShowForm(false);
      setForm({ name: '', description: '', color: COLORS[0] });
      toast.success('Project created!');
    } catch {
      toast.error('Failed to create project');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject(id);
      setProjects((p) => p.filter((proj) => proj._id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <form className="create-project-form" onSubmit={handleCreate}>
          <input
            name="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="form-input"
            placeholder="Project name"
            required
          />
          <input
            name="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="form-input"
            placeholder="Description (optional)"
          />
          <div className="color-picker">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
              />
            ))}
          </div>
          <button type="submit" className="btn btn-primary">Create Project</button>
        </form>
      )}

      {loading ? (
        <div className="loading-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects yet. Create your first one!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <ProjectCard key={p._id} project={p} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;