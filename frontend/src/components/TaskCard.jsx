import { format } from 'date-fns';

const priorityColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7c3aed',
};

const TaskCard = ({ task, onClick, draggableProps, dragHandleProps, innerRef }) => {
  return (
    <div
      className="task-card"
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      onClick={() => onClick(task)}
    >
      <div
        className="task-priority-bar"
        style={{ background: priorityColors[task.priority] }}
      />

      <div className="task-card-body">
        <p className="task-title">{task.title}</p>

        <div className="task-tags">
          {task.tags?.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="task-card-footer">
          <span className="task-priority" style={{ color: priorityColors[task.priority] }}>
            {task.priority}
          </span>

          {task.dueDate && (
            <span className="task-due">
              📅 {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}

          {task.assignee && (
            <span className="task-avatar" title={task.assignee.name}>
              {task.assignee.name.charAt(0).toUpperCase()}
            </span>
          )}

          {task.comments?.length > 0 && (
            <span className="task-comments">💬 {task.comments.length}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;