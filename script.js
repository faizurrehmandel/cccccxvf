// State management
const state = {
    currentProject: null,
    projects: [],
};

// DOM Elements
const elements = {
    projectList: document.getElementById('projectList'),
    chatMessages: document.getElementById('chatMessages'),
    chatForm: document.getElementById('chatForm'),
    messageInput: document.getElementById('messageInput'),
    newProjectBtn: document.getElementById('newProjectBtn'),
    newProjectModal: document.getElementById('newProjectModal'),
    newProjectForm: document.getElementById('newProjectForm'),
    cancelProject: document.getElementById('cancelProject'),
    currentProjectTitle: document.getElementById('currentProjectTitle'),
};

// API endpoints
const API = {
    PROJECTS: '/api/projects',
    CREATE_PROJECT: '/api/projects/create',
    CHAT: (projectId) => `/api/chat/${projectId}`,
};

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);
elements.chatForm.addEventListener('submit', handleChatSubmit);
elements.newProjectBtn.addEventListener('click', showNewProjectModal);
elements.newProjectForm.addEventListener('submit', handleNewProject);
elements.cancelProject.addEventListener('click', hideNewProjectModal);

// Initialize the application
async function initialize() {
    try {
        await loadProjects();
    } catch (error) {
        showError('Failed to initialize the application');
        console.error('Initialization error:', error);
    }
}

// Load projects from the server
async function loadProjects() {
    try {
        const response = await fetch(API.PROJECTS);
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        state.projects = await response.json();
        renderProjects();
    } catch (error) {
        showError('Failed to load projects');
        console.error('Load projects error:', error);
    }
}

// Render projects in the sidebar
function renderProjects() {
    elements.projectList.innerHTML = '';
    state.projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = `project-item ${state.currentProject?.id === project.id ? 'active' : ''}`;
        projectElement.textContent = project.name;
        projectElement.addEventListener('click', () => selectProject(project));
        elements.projectList.appendChild(projectElement);
    });
}

// Select a project
function selectProject(project) {
    state.currentProject = project;
    elements.currentProjectTitle.textContent = project.name;
    loadProjectChat(project.id);
    renderProjects(); // Update active state in sidebar
}

// Load chat history for a project
async function loadProjectChat(projectId) {
    try {
        const response = await fetch(API.CHAT(projectId));
        if (!response.ok) throw new Error('Failed to fetch chat history');
        
        const chatHistory = await response.json();
        renderChat(chatHistory);
    } catch (error) {
        showError('Failed to load chat history');
        console.error('Load chat history error:', error);
    }
}

// Render chat messages
function renderChat(messages) {
    elements.chatMessages.innerHTML = '';
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender}`;
        messageElement.textContent = message.content;
        elements.chatMessages.appendChild(messageElement);
    });
    scrollToBottom();
}

// Handle chat form submission
async function handleChatSubmit(event) {
    event.preventDefault();
    if (!state.currentProject) {
        showError('Please select a project first');
        return;
    }

    const message = elements.messageInput.value.trim();
    if (!message) return;

    try {
        const response = await fetch(API.CHAT(state.currentProject.id), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) throw new Error('Failed to send message');

        const result = await response.json();
        renderChat(result.messages);
        elements.messageInput.value = '';
    } catch (error) {
        showError('Failed to send message');
        console.error('Send message error:', error);
    }
}

// Handle new project creation
async function handleNewProject(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const projectData = {
        name: formData.get('projectName'),
        description: formData.get('projectDescription'),
    };

    try {
        const response = await fetch(API.CREATE_PROJECT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData),
        });

        if (!response.ok) throw new Error('Failed to create project');

        const newProject = await response.json();
        state.projects.push(newProject);
        renderProjects();
        hideNewProjectModal();
        selectProject(newProject);
    } catch (error) {
        showError('Failed to create project');
        console.error('Create project error:', error);
    }
}

// Modal controls
function showNewProjectModal() {
    elements.newProjectModal.classList.add('active');
}

function hideNewProjectModal() {
    elements.newProjectModal.classList.remove('active');
    elements.newProjectForm.reset();
}

// Utility functions
function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function showError(message) {
    // You could implement a toast notification here
    alert(message);
}

// Local storage functions
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Local storage error:', error);
    }
}

function getFromLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Local storage error:', error);
        return null;
    }
}
