import { useState } from 'react';
import { searchUsers, addMember, removeMember } from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const MemberList = ({ project, onProjectUpdate }) => {
  const { emit } = useSocket();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    setSearch(e.target.value);
    if (e.target.value.length < 2) return setResults([]);
    const res = await searchUsers(e.target.value);
    setResults(res.data.filter((u) => !project.members.find((m) => m._id === u._id)));
  };

  const handleAdd = async (userId) => {
    try {
      const res = await addMember(project._id, userId);
      onProjectUpdate(res.data);
      emit('member-added', { projectId: project._id, project: res.data });
      setSearch('');
      setResults([]);
      toast.success('Member added');
    } catch {
      toast.error('Failed to add member');
    }
  };

  const handleRemove = async (userId) => {
    try {
      const res = await removeMember(project._id, userId);
      onProjectUpdate(res.data);
      emit('member-added', { projectId: project._id, project: res.data });
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="member-list">
      <h3>Team Members ({project.members.length})</h3>

      <div className="member-search">
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Search users to add..."
          className="form-input"
        />
        {results.length > 0 && (
          <div className="search-results">
            {results.map((u) => (
              <div key={u._id} className="search-result-item">
                <span>{u.name} — {u.email}</span>
                <button className="btn btn-primary btn-xs" onClick={() => handleAdd(u._id)}>
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="members">
        {project.members.map((m) => (
          <div key={m._id} className="member-item">
            <div className="member-avatar">{m.name.charAt(0).toUpperCase()}</div>
            <div className="member-info">
              <strong>{m.name}</strong>
              <span>{m.email}</span>
            </div>
            {m._id !== project.owner._id && (
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => handleRemove(m._id)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberList;