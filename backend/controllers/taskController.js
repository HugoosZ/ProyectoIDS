const { db } = require('../firebase');
const { Timestamp } = require('firebase-admin/firestore');

exports.createTask = async (req, res) => {
  try {
    const {
      assignedTo,
      createdBy,
      description,
      startTime,
      endTime,
      priority,
      status,
      title
    } = req.body;

    // Validate required fields
    if (!description || !title || !createdBy || !assignedTo || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newTask = {
      assignedTo,
      createdAt: Timestamp.now(),
      createdBy,
      description,
      endTime: Timestamp.fromDate(new Date(endTime)),
      priority: priority || 'normal',
      startTime: Timestamp.fromDate(new Date(startTime)),
      status: status || 'pending',
      title
    };

    const docRef = await db.collection('tasks').add(newTask);

    return res.status(201).json({ id: docRef.id, ...newTask });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
