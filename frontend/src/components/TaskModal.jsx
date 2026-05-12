import { useState, useEffect } from 'react';
import { updateTask, deleteTask, addComment } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TaskModal = ({ task, project, onClose, onUpdate, onDelete }) => {
  const { emit } = useSocket();
  const { user } = useAuth();
  const [form, setForm] = useState({ ...task });
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...task });
  }, [task]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateTask(task._id, form);
      onUpdate(res.data);
      onClose();
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(task._id);
      onDelete(task._id);
      onClose();
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await addComment(task._id, comment);
      onUpdate(res.data);
      emit('comment-added', { projectId: project._id, task: res.data });
      setComment('');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Title */}
          <div className="form-group">
            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="form-input"
            />
          </div>

          <div className="form-row">
            {/* Status */}
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="form-input">
                {project.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="form-input">
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate ? form.dueDate.substring(0, 10) : ''}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              name="tags"
              value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  tags: e.target.value.split(',').map((t) => t.trim()),
                }))
              }
              className="form-input"
              placeholder="frontend, bug, urgent"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete Task
            </button>
          </div>

          {/* Comments */}
          <div className="comments-section">
            <h3>Comments ({task.comments?.length || 0})</h3>

            <div className="comments-list">
              {task.comments?.map((c) => (
                <div key={c._id} className="comment">
                  <div className="comment-avatar">
                    {c.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-body">
                    <div className="comment-meta">
                      <strong>{c.user?.name}</strong>
                      <span>{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="comment-input-row">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="form-input"
                placeholder="Add a comment..."
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <button className="btn btn-primary" onClick={handleComment}>
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;