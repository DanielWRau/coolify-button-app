// Check authentication status on load
checkAuthStatus();

// Update time every second
setInterval(updateTime, 1000);
updateTime();

// Login form handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const password = document.getElementById('password-input').value;
  const errorDiv = document.getElementById('login-error');
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    if (response.ok) {
      showDashboard();
    } else {
      const data = await response.json();
      errorDiv.textContent = data.error || 'Falsches Passwort';
      document.getElementById('password-input').value = '';
      
      // Shake animation
      const form = document.getElementById('login-form');
      form.style.animation = 'shake 0.5s';
      setTimeout(() => form.style.animation = '', 500);
    }
  } catch (error) {
    errorDiv.textContent = 'Verbindungsfehler';
    console.error('Login error:', error);
  }
});

// Button click handlers
document.querySelectorAll('.button-item').forEach(button => {
  button.addEventListener('click', async () => {
    const actionId = button.dataset.action;
    const label = button.querySelector('.button-label').textContent;
    
    // Add loading state
    button.style.opacity = '0.5';
    button.style.pointerEvents = 'none';
    
    try {
      const response = await fetch(`/api/action/${actionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status === 401) {
        showToast('Sitzung abgelaufen', 'error');
        setTimeout(() => showLogin(), 1000);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        showToast(`${label} erfolgreich ausgefuehrt`, 'success');
      } else {
        showToast(`${label} fehlgeschlagen`, 'error');
      }
    } catch (error) {
      console.error('Action error:', error);
      showToast('Verbindungsfehler', 'error');
    } finally {
      // Remove loading state
      button.style.opacity = '1';
      button.style.pointerEvents = 'auto';
    }
  });
});

// Helper functions
async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    
    if (data.authenticated) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('dashboard-screen').style.display = 'none';
  document.getElementById('password-input').focus();
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-screen').style.display = 'flex';
  updateTime();
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    showLogin();
    document.getElementById('password-input').value = '';
    document.getElementById('login-error').textContent = '';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const timeElement = document.getElementById('current-time');
  if (timeElement) {
    timeElement.textContent = timeString;
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
  }
`;
document.head.appendChild(style);