import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const ProjectCard = ({ project, onDelete }) => {
  return (
    <div className="project-card" style={{ '--card-color': project.color }}>
      <div className="project-card-color-bar" />
      <div className="project-card-body">
        <h3 className="project-card-title">{project.name}</h3>
        <p className="project-card-desc">{project.description || 'No description'}</p>

        <div className="project-card-meta">
          <span className={`badge badge-${project.status}`}>{project.status}</span>
          <span className="project-members">
            👥 {project.members.length} member{project.members.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="project-card-date">
          Updated {format(new Date(project.updatedAt), 'MMM d, yyyy')}
        </div>

        <div className="project-card-actions">
          <Link to={`/projects/${project._id}`} className="btn btn-primary btn-sm">
            Open Board
          </Link>
          {onDelete && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete(project._id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;