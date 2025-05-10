// taskApp.js - Task management frontend application

// API endpoint
const API_URL = 'http:/proyecto-ids.vercel.app/api';

// Wait for DOM to load before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const taskForm = document.getElementById('taskForm');
    const description = document.getElementById('description');
    const estimatedTime = document.getElementById('estimatedTime');
    const messageArea = document.getElementById('messageArea');
    const taskList = document.getElementById('taskList');

    // Add event listener to the form
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate inputs
        if (!description.value.trim() || !estimatedTime.value || estimatedTime.value <= 0) {
            showMessage('Please fill all fields correctly', 'error');
            return;
        }
        
        try {
            // Create task object
            const task = {
                description: description.value.trim(),
                estimatedTime: parseFloat(estimatedTime.value)
            };
            
            // Send POST request to API
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create task');
            }
            
            // Clear form and show success message
            taskForm.reset();
            showMessage('Task created successfully!', 'success');
            
            // Refresh task list
            loadTasks();
        } catch (error) {
            console.error('Error creating task:', error);
            showMessage(error.message || 'Error creating task. Please try again.', 'error');
        }
    });
    
    // Load tasks when the page loads
    loadTasks();
});

// Function to fetch tasks from API
async function loadTasks() {
    const taskList = document.getElementById('taskList');
    
    try {
        // Clear current task list
        taskList.innerHTML = '';
        
        // Fetch tasks from API
        const response = await fetch(`${API_URL}/tasks`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        
        const tasks = await response.json();
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<p>No tasks found.</p>';
            return;
        }
        
        // Display each task
        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            
            // Format the creation date
            const creationDate = new Date(task.createdAt);
            const formattedDate = new Intl.DateTimeFormat('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(creationDate);
            
            taskCard.innerHTML = `
                <h3>Task</h3>
                <p><strong>Description:</strong> ${task.description}</p>
                <p><strong>Estimated Time:</strong> ${task.estimatedTime} hours</p>
                <p><strong>Created:</strong> ${formattedDate}</p>
            `;
            
            taskList.appendChild(taskCard);
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
        taskList.innerHTML = '<p>Error loading tasks. Please refresh the page.</p>';
    }
}

// Function to show messages to the user
function showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = `<div class="${type}">${message}</div>`;
    
    // Clear message after 3 seconds
    setTimeout(() => {
        messageArea.innerHTML = '';
    }, 3000);
}