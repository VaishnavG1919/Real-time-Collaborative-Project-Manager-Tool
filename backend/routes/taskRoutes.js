const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

// @GET /api/tasks?projectId= — Get tasks for a project
router.get('/', protect, async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email')
      .sort({ order: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/tasks — Create task
router.post('/', protect, async (req, res, next) => {
  const { title, description, project, assignee, status, priority, dueDate, tags } =
    req.body;
  try {
    const task = await Task.create({
      title,
      description,
      project,
      assignee,
      status,
      priority,
      dueDate,
      tags,
      createdBy: req.user._id,
    });
    const populated = await task.populate([
      { path: 'assignee', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/tasks/:id — Update task
router.put('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/tasks/:id/comments — Add comment
router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    const populated = await task.populate('comments.user', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/tasks/:id — Delete task
router.delete('/:id', protect, async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;