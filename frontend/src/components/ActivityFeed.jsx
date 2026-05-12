import { useSocketEvent } from '../hooks/useSocket';

const ActivityFeed = ({ projectId, activities, addActivity }) => {
  useSocketEvent('task-created', (task) => addActivity(`📋 Task created: ${task.title}`), []);
  useSocketEvent('task-updated', (task) => addActivity(`✏️ Task updated: ${task.title}`), []);
  useSocketEvent('task-deleted', (id) => addActivity(`🗑️ Task deleted`), []);
  useSocketEvent('task-moved', ({ task, toStatus }) =>
    addActivity(`🔀 "${task.title}" moved to ${toStatus}`), []);
  useSocketEvent('comment-added', (task) =>
    addActivity(`💬 Comment on: ${task.title}`), []);
  useSocketEvent('user-joined', ({ name }) => addActivity(`👋 ${name} joined`), []);
  useSocketEvent('user-left', ({ name }) => addActivity(`🚶 ${name} left`), []);

  return (
    <div className="activity-feed">
      <h3>Live Activity</h3>
      {activities.length === 0 ? (
        <p className="activity-empty">No activity yet</p>
      ) : (
        <ul className="activity-list">
          {activities.map((a) => (
            <li key={a.id} className="activity-item">
              <span className="activity-msg">{a.msg}</span>
              <span className="activity-time">
                {new Date(a.time).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityFeed;