// Global variables
let currentUser = null;
let selectedUser = null;
let stompClient = null;
let connected = false;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Check which page we're on
    const path = window.location.pathname;
    
    if (path.includes('login.html') || path.includes('register.html')) {
        setupAuthForms();
    } else if (path.includes('chat.html') || path === '/' || path === '/chat') {
        await checkAuth();
        initializeChat();
    }
});

// Setup authentication forms
function setupAuthForms() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            window.location.href = '/chat';
        } else {
            errorDiv.textContent = data.message;
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        console.error('Login error:', error);
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('error');
    
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match!';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Registration successful! Please login.');
            window.location.href = '/login.html';
        } else {
            errorDiv.textContent = data.message;
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        console.error('Register error:', error);
    }
}

// Check authentication for chat page
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/login.html';
            return;
        }
        
        currentUser = data.user;
        displayUserInfo();
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
    }
}

// Initialize chat
function initializeChat() {
    displayUserInfo();
    connectWebSocket();
    loadUsers();
    setupChatEventListeners();
}

// Display user info
function displayUserInfo() {
    const usernameElement = document.getElementById('username');
    const userAvatar = document.getElementById('userAvatar');
    
    if (usernameElement) {
        usernameElement.textContent = currentUser.username;
    }
    
    if (userAvatar) {
        userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
    }
}

// Connect to WebSocket
function connectWebSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    
    stompClient.connect({}, function(frame) {
        connected = true;
        console.log('Connected to WebSocket');
        
        // Subscribe to personal messages
        stompClient.subscribe('/user/queue/messages', function(message) {
            const receivedMessage = JSON.parse(message.body);
            if (selectedUser && 
                (receivedMessage.sender === selectedUser.username || 
                 receivedMessage.receiver === selectedUser.username)) {
                displayMessage(receivedMessage);
            }
        });
    }, function(error) {
        console.error('WebSocket connection failed:', error);
        setTimeout(connectWebSocket, 5000);
    });
}

// Load users list
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const data = await response.json();
        
        if (data.success) {
            displayUsers(data.data);
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// Display users in sidebar
function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userElement = createUserElement(user);
        usersList.appendChild(userElement);
    });
}

// Create user element
function createUserElement(user) {
    const div = document.createElement('div');
    div.className = 'user-item';
    div.setAttribute('data-username', user.username);
    
    div.innerHTML = `
        <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
        <div class="user-details">
            <div class="user-name">${user.username}</div>
            <div class="user-email">${user.email}</div>
        </div>
    `;
    
    div.addEventListener('click', () => selectUser(user));
    
    return div;
}

// Select user to chat with
async function selectUser(user) {
    selectedUser = user;
    
    // Update UI
    document.querySelectorAll('.user-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-username') === user.username) {
            el.classList.add('active');
        }
    });
    
    document.getElementById('selectedUserName').textContent = 
        `Chatting with ${user.username}`;
    
    // Enable message input
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    
    // Load conversation
    await loadConversation(user.username);
}

// Load conversation with selected user
async function loadConversation(otherUser) {
    try {
        const response = await fetch(`/api/messages/${otherUser}`);
        const data = await response.json();
        
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = '';
        
        if (data.success) {
            data.data.forEach(message => {
                displayMessage(message);
            });
            scrollToBottom();
        }
    } catch (error) {
        console.error('Failed to load conversation:', error);
    }
}

// Display message in chat
function displayMessage(message) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender === currentUser.username ? 'sent' : 'received'}`;
    
    const timestamp = new Date(message.timestamp);
    const timeString = timestamp.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(message.content)}</div>
        <div class="message-time">${timeString}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Send message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (content && selectedUser && stompClient && connected) {
        const message = {
            sender: currentUser.username,
            receiver: selectedUser.username,
            content: content
        };
        
        // Send via WebSocket
        stompClient.send("/app/chat.send", {}, JSON.stringify(message));
        
        // Display immediately
        message.timestamp = new Date();
        displayMessage(message);
        
        messageInput.value = '';
    }
}

// Handle logout
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        if (stompClient) {
            stompClient.disconnect();
        }
        sessionStorage.removeItem('currentUser');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Scroll to bottom of messages
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Setup chat event listeners
function setupChatEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Message form
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendMessage();
        });
    }
}