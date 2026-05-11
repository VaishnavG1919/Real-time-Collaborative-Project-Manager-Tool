const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

// @GET /api/projects — Get all projects for current user
router.get('/', protect, async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/projects — Create project
router.post('/', protect, async (req, res, next) => {
  const { name, description, color, columns } = req.body;
  try {
    const project = await Project.create({
      name,
      description,
      color,
      columns: columns || ['Backlog', 'In Progress', 'Review', 'Done'],
      owner: req.user._id,
      members: [req.user._id],
    });
    const populated = await project.populate('owner members', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/projects/:id — Get single project
router.get('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/projects/:id — Update project
router.put('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only owner can update' });

    Object.assign(project, req.body);
    await project.save();
    const populated = await project.populate('owner members', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/projects/:id/members — Add member
router.post('/:id/members', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { userId } = req.body;
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }
    const populated = await project.populate('owner members', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/projects/:id/members/:userId — Remove member
router.delete('/:id/members/:userId', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();
    const populated = await project.populate('owner members', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/projects/:id — Delete project
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only owner can delete' });

    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;