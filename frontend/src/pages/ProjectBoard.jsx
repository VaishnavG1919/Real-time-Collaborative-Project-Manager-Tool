import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getProject, getTasks, createTask, updateTask } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useSocketEvent } from '../hooks/useSocket';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import MemberList from '../components/MemberList';
import ActivityFeed from '../components/ActivityFeed';
import toast from 'react-hot-toast';

const ProjectBoard = () => {
  const { id } = useParams();
  const { emit } = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showNewTask, setShowNewTask] = useState(null); // column name
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Join socket room
  useEffect(() => {
    emit('join-project', id);
    return () => emit('leave-project', id);
  }, [id]);

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, tasksRes] = await Promise.all([
          getProject(id),
          getTasks(id),
        ]);
        setProject(projRes.data);
        setTasks(tasksRes.data);
      } catch {
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Real-time socket events
  useSocketEvent('task-created', (task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  useSocketEvent('task-updated', (task) => {
    setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    if (selectedTask?._id === task._id) setSelectedTask(task);
  }, [selectedTask]);

  useSocketEvent('task-deleted', (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }, []);

  useSocketEvent('task-moved', ({ taskId, toStatus, task }) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: toStatus } : t))
    );
  }, []);

  useSocketEvent('comment-added', (task) => {
    setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    if (selectedTask?._id === task._id) setSelectedTask(task);
  }, [selectedTask]);

  useSocketEvent('member-added', (updatedProject) => {
    setProject(updatedProject);
  }, []);

  // Drag and drop
  const onDragEnd = useCallback(
    async (result) => {
      const { destination, source, draggableId } = result;
      if (!destination || destination.droppableId === source.droppableId) return;

      const task = tasks.find((t) => t._id === draggableId);
      const fromStatus = source.droppableId;
      const toStatus = destination.droppableId;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t._id === draggableId ? { ...t, status: toStatus } : t))
      );

      try {
        const res = await updateTask(draggableId, { status: toStatus });
        emit('task-moved', {
          projectId: id,
          taskId: draggableId,
          fromStatus,
          toStatus,
          task: res.data,
        });
      } catch {
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t._id === draggableId ? { ...t, status: fromStatus } : t))
        );
        toast.error('Failed to move task');
      }
    },
    [tasks, id, emit]
  );

  const handleCreateTask = async (column) => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await createTask({
        title: newTaskTitle,
        project: id,
        status: column,
      });
      setTasks((prev) => [...prev, res.data]);
      emit('task-created', { projectId: id, task: res.data });
      setNewTaskTitle('');
      setShowNewTask(null);
      toast.success('Task created');
    } catch {
      toast.error('Failed to create task');
    }
  };

  const handleTaskUpdate = (updated) => {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    setSelectedTask(updated);
  };

  const handleTaskDelete = (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    setSelectedTask(null);
  };

  if (loading) return <div className="board-loading">Loading board...</div>;
  if (!project) return <div className="board-loading">Project not found</div>;

  const tasksByColumn = (col) => tasks.filter((t) => t.status === col);

  return (
    <div className="board-page">
      {/* Board Header */}
      <div className="board-header" style={{ borderLeftColor: project.color }}>
        <div className="board-title-row">
          <h1 style={{ color: project.color }}>{project.name}</h1>
          <p>{project.description}</p>
        </div>
        <div className="board-actions">
          <button className="btn btn-ghost" onClick={() => setShowActivity((s) => !s)}>
            📊 Activity
          </button>
          <button className="btn btn-ghost" onClick={() => setShowMembers((s) => !s)}>
            👥 Members ({project.members.length})
          </button>
        </div>
      </div>

      <div className="board-layout">
        {/* Kanban Board */}
        <div className="board-main">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="columns-container">
              {project.columns.map((col) => (
                <div key={col} className="column">
                  <div className="column-header">
                    <span className="column-name">{col}</span>
                    <span className="column-count">{tasksByColumn(col).length}</span>
                  </div>

                  <Droppable droppableId={col}>
                    {(provided, snapshot) => (
                      <div
                        className={`column-body ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {tasksByColumn(col).map((task, index) => (
                          <Draggable key={task._id} draggableId={String(task._id)} index={index}>
                            {(prov, snap) => (
                              <TaskCard
                                task={task}
                                onClick={setSelectedTask}
                                innerRef={prov.innerRef}
                                draggableProps={prov.draggableProps}
                                dragHandleProps={prov.dragHandleProps}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Quick Add */}
                  {showNewTask === col ? (
                    <div className="quick-add">
                      <input
                        autoFocus
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..."
                        className="form-input"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTask(col);
                          if (e.key === 'Escape') setShowNewTask(null);
                        }}
                      />
                      <div className="quick-add-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => handleCreateTask(col)}>
                          Add
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowNewTask(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="add-task-btn"
                      onClick={() => setShowNewTask(col)}
                    >
                      + Add Task
                    </button>
                  )}
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>

        {/* Sidebar Panels */}
        {showMembers && (
          <div className="board-sidebar">
            <MemberList
              project={project}
              onProjectUpdate={setProject}
            />
          </div>
        )}

        {showActivity && (
          <div className="board-sidebar">
            <ActivityFeed projectId={id} />
          </div>
        )}
      </div>

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          project={project}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
};

export default ProjectBoard;