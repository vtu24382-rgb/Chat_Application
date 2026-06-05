// Global variables
let currentUser = null;
let selectedUser = null;
let stompClient = null;
let connected = false;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    console.log('Current path:', path);
    
    if (path.includes('login.html') || path === '/login') {
        setupLoginForm();
    } else if (path.includes('register.html') || path === '/register') {
        setupRegisterForm();
    } else if (path.includes('chat.html') || path === '/' || path === '/chat') {
        checkAuthAndLoadChat();
    }
});

// Setup login form
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log("Login form listener added");
    }
}

// Setup register form
function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        console.log("Register form listener added");
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    console.log("========== LOGIN ATTEMPT ==========");
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    
    console.log("Username:", username);
    console.log("Password length:", password ? password.length : 0);
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    
    if (!username || !password) {
        if (errorDiv) {
            errorDiv.textContent = 'Username and password are required!';
            errorDiv.style.display = 'block';
        }
        console.log("Validation failed: Missing fields");
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // CRITICAL: Include cookies
            body: JSON.stringify({ username, password })
        });
        
        console.log("Login response status:", response.status);
        
        const data = await response.json();
        console.log("Login response data:", data);
        
        if (data.success) {
            // Store user in sessionStorage as backup
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            console.log('Login successful, redirecting to chat...');
            
            // Force a small delay to ensure session is set
            setTimeout(() => {
                window.location.href = '/chat';
            }, 100);
        } else {
            if (errorDiv) {
                errorDiv.textContent = data.message || 'Invalid username or password!';
                errorDiv.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        if (errorDiv) {
            errorDiv.textContent = 'Connection error. Please try again.';
            errorDiv.style.display = 'block';
        }
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    console.log("========== REGISTRATION ATTEMPT ==========");
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    console.log("Username:", username);
    console.log("Email:", email);
    console.log("Password length:", password ? password.length : 0);
    console.log("Confirm Password length:", confirmPassword ? confirmPassword.length : 0);
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    if (successDiv) {
        successDiv.style.display = 'none';
        successDiv.textContent = '';
    }
    
    if (!username || !email || !password || !confirmPassword) {
        let message = 'All fields are required!';
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        console.log("Validation failed: Missing fields");
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        if (errorDiv) {
            errorDiv.textContent = 'Please enter a valid email address!';
            errorDiv.style.display = 'block';
        }
        console.log("Validation failed: Invalid email");
        return;
    }
    
    if (password !== confirmPassword) {
        if (errorDiv) {
            errorDiv.textContent = 'Passwords do not match!';
            errorDiv.style.display = 'block';
        }
        console.log("Validation failed: Passwords do not match");
        return;
    }
    
    if (password.length < 6) {
        if (errorDiv) {
            errorDiv.textContent = 'Password must be at least 6 characters!';
            errorDiv.style.display = 'block';
        }
        console.log("Validation failed: Password too short");
        return;
    }
    
    const requestBody = {
        username: username,
        email: email,
        password: password
    };
    
    console.log("Sending request to /api/auth/register");
    console.log("Request body:", JSON.stringify(requestBody));
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log("Response status:", response.status);
        
        const data = await response.json();
        console.log("Response data:", data);
        
        if (data.success) {
            console.log("Registration successful!");
            if (successDiv) {
                successDiv.textContent = data.message || 'Registration successful! Redirecting to login...';
                successDiv.style.display = 'block';
            }
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            console.log("Registration failed:", data.message);
            if (errorDiv) {
                errorDiv.textContent = data.message || 'Registration failed!';
                errorDiv.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Network/JS Error:", error);
        if (errorDiv) {
            errorDiv.textContent = 'Connection error. Please try again.';
            errorDiv.style.display = 'block';
        }
    }
}

// Check authentication for chat page
async function checkAuthAndLoadChat() {
    console.log('========== CHECKING AUTHENTICATION ==========');
    
    try {
        // First check session storage
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            console.log('User found in sessionStorage:', currentUser);
        }
        
        // Always verify with server
        console.log('Verifying with server...');
        const response = await fetch('/api/auth/check', {
            credentials: 'include', // CRITICAL: Include cookies
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        console.log("Auth check response status:", response.status);
        
        if (response.status === 403 || response.status === 401) {
            console.log('Authentication failed with status:', response.status);
            sessionStorage.removeItem('currentUser');
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        console.log('Auth check response:', data);
        
        if (!data.authenticated) {
            console.log('Not authenticated, redirecting to login');
            sessionStorage.removeItem('currentUser');
            window.location.href = '/login';
            return;
        }
        
        currentUser = data.user;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        console.log('Authentication successful, loading chat for:', currentUser.username);
        displayUserInfo();
        connectWebSocket();
        loadUsers();
        setupChatEventListeners();
        enableMessageInput(false);
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
    }
}

// Display user info
function displayUserInfo() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userAvatar = document.getElementById('userAvatar');
    
    if (usernameDisplay) {
        usernameDisplay.textContent = currentUser.username;
    }
    
    if (userAvatar) {
        userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
    }
}

// Enable/disable message input
function enableMessageInput(enabled) {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (messageInput) {
        messageInput.disabled = !enabled;
        if (enabled) {
            messageInput.focus();
        }
    }
    if (sendBtn) {
        sendBtn.disabled = !enabled;
    }
}

// Connect to WebSocket
function connectWebSocket() {
    console.log('Connecting to WebSocket...');
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    
    stompClient.connect({}, function(frame) {
        connected = true;
        console.log('✅ Connected to WebSocket');
        console.log('Subscribing to /user/queue/messages');
        
        // Subscribe to private messages
        stompClient.subscribe('/user/queue/messages', function(message) {
            const receivedMessage = JSON.parse(message.body);
            console.log("📨 Incoming:", receivedMessage);

            // If no user selected, ignore
            if (!selectedUser) {
                console.log("No selected user, ignoring message");
                return;
            }

            // Only display message if it belongs to current open chat
            const isCurrentChat =
                (receivedMessage.sender === currentUser.username &&
                 receivedMessage.receiver === selectedUser.username)
                ||
                (receivedMessage.sender === selectedUser.username &&
                 receivedMessage.receiver === currentUser.username);

            if (isCurrentChat) {
                displayMessage(receivedMessage);
            } else {
                console.log("Message not for current open chat");
            }
        });
        
        // Optional: You can remove this if you don't need join notifications
        // const joinMessage = {
        //     sender: currentUser.username,
        //     content: currentUser.username + ' joined',
        //     type: 'JOIN'
        // };
        // stompClient.send("/app/chat.addUser", {}, JSON.stringify(joinMessage));
        
    }, function(error) {
        console.error('❌ WebSocket connection failed:', error);
        setTimeout(connectWebSocket, 5000);
    });
}

// Load users list from database
async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            credentials: 'include'
        });
        
        if (response.status === 403 || response.status === 401) {
            console.log('Not authenticated, redirecting to login');
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            displayUsers(data.data);
        } else {
            console.log('No users data received');
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// Display users in sidebar
function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="loading">No other users found</div>';
        return;
    }
    
    usersList.innerHTML = '';
    
    users.forEach(user => {
        if (user.username !== currentUser.username) {
            const userElement = createUserElement(user);
            usersList.appendChild(userElement);
        }
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
            <div class="user-email">${user.email || ''}</div>
        </div>
    `;
    
    div.addEventListener('click', () => selectUser(user));
    
    return div;
}

// Select user to chat with
async function selectUser(user) {
    console.log('=== SELECTING USER ===');
    console.log('Selected user:', user.username);
    console.log('Current user:', currentUser.username);
    
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
    enableMessageInput(true);
    
    // Load conversation history
    await loadConversation(user.username);
}

// Load conversation history with selected user
async function loadConversation(otherUser) {
    console.log('=== LOADING CONVERSATION ===');
    console.log('Loading conversation with:', otherUser);
    
    try {
        const response = await fetch(`/api/messages/${otherUser}`, {
            credentials: 'include'
        });
        
        if (response.status === 403 || response.status === 401) {
            console.log('Not authenticated, redirecting to login');
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        console.log('Conversation data received:', data);
        
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = '';
        
        if (data.success && data.data && data.data.length > 0) {
            console.log(`Found ${data.data.length} messages`);
            // Sort messages by timestamp (oldest first)
            const sortedMessages = data.data.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            
            sortedMessages.forEach(message => {
                displayMessage(message);
            });
        } else {
            console.log('No messages found');
            // Show welcome message if no history
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'welcome-message';
            welcomeDiv.style.textAlign = 'center';
            welcomeDiv.style.color = '#666';
            welcomeDiv.style.padding = '20px';
            welcomeDiv.textContent = `No messages yet with ${otherUser}. Say hello!`;
            messagesContainer.appendChild(welcomeDiv);
        }
        
        scrollToBottom();
    } catch (error) {
        console.error('Failed to load conversation:', error);
    }
}

// Display message in chat
function displayMessage(message) {
    console.log('Displaying message:', message);
    
    const messagesContainer = document.getElementById('messages');
    
    // Remove welcome message if it exists
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender === currentUser.username ? 'sent' : 'received'}`;
    
    // Format timestamp
    let timeString = '';
    if (message.timestamp) {
        const timestamp = new Date(message.timestamp);
        timeString = timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        });
    }
    
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(message.content)}</div>
        <div class="message-time">${timeString}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Send private message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();

    if (!content || !selectedUser || !stompClient || !connected) {
        console.log('Cannot send message:', {
            content: !!content,
            selectedUser: !!selectedUser,
            stompClient: !!stompClient,
            connected: connected
        });
        return;
    }

    const message = {
        sender: currentUser.username,
        receiver: selectedUser.username,
        content: content,
        timestamp: new Date().toISOString()
    };

    console.log('=== SENDING MESSAGE ===');
    console.log('📤 Message:', message);

    // Show instantly on sender side
    displayMessage(message);

    // Send to backend
    stompClient.send("/app/chat.send", {}, JSON.stringify(message));

    messageInput.value = '';
}

// Handle logout
async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', { 
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            console.log('Logout successful');
        }
        
        if (stompClient) {
            stompClient.disconnect();
        }
        sessionStorage.removeItem('currentUser');
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout failed:', error);
        // Still clear local storage and redirect
        sessionStorage.removeItem('currentUser');
        window.location.href = '/login';
    }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
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
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendMessage();
        });
    }
    
    const searchInput = document.getElementById('searchUsers');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.user-item').forEach(item => {
                const username = item.getAttribute('data-username').toLowerCase();
                item.style.display = username.includes(query) ? 'flex' : 'none';
            });
        });
    }
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}