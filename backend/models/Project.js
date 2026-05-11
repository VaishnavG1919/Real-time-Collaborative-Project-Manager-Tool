const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    color: { type: String, default: '#6366f1' },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    columns: {
      type: [String],
      default: ['Backlog', 'In Progress', 'Review', 'Done'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);