// createTask.js - Handle creating new tasks
const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

/**
 * Route to create a new task
 * POST /api/tasks
 */
router.post('/', async (req, res) => {
  try {
    const { description, estimatedTime } = req.body;
    
    // Validate request data
    if (!description || !estimatedTime) {
      return res.status(400).json({ 
        error: 'Task description and estimated time are required' 
      });
    }
    
    // Create a task object
    const task = {
      description: description.trim(),
      estimatedTime: parseFloat(estimatedTime),
      createdAt: new Date(),
      status: 'pending',
      updatedAt: new Date()
    };
    
    // Add task to Firestore
    const docRef = await db.collection('tasks').add(task);
    
    // Return success response with task ID
    res.status(201).json({
      success: true,
      taskId: docRef.id,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ 
      error: 'Failed to create task',
      message: error.message
    });
  }
});

module.exports = router;