// Update time every second
setInterval(updateTime, 1000);
updateTime();

// Button click handlers
document.querySelectorAll('.button-item').forEach(button => {
  button.addEventListener('click', async () => {
    const actionId = button.dataset.action;
    
    // Special handling for Button 1 (LinkedIn Post)
    if (actionId === '1') {
      openModal();
      return;
    }
    
    // All other buttons
    const label = button.querySelector('.button-label').textContent;
    executeAction(actionId, label, button);
  });
});

// Open modal for LinkedIn post
function openModal() {
  document.getElementById('input-modal').style.display = 'flex';
  document.getElementById('topic-input').focus();
}

// Close modal
function closeModal() {
  document.getElementById('input-modal').style.display = 'none';
  document.getElementById('topic-input').value = '';
}

// Submit topic and create LinkedIn post
async function submitTopic() {
  const topic = document.getElementById('topic-input').value.trim();
  
  if (!topic) {
    showToast('Bitte gib ein Thema ein', 'error');
    return;
  }
  
  closeModal();
  
  // Show loading toast
  showToast('LinkedIn Post wird erstellt...', 'success');
  
  try {
    const response = await fetch('/api/action/1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast(`Post wird erstellt: ${topic}`, 'success');
      
      // Show task ID and live URL if available
      if (data.data?.live_url) {
        setTimeout(() => {
          showToast(`Live URL: ${data.data.live_url}`, 'success');
        }, 3000);
      }
    } else {
      showToast(data.error || 'Fehler beim Erstellen', 'error');
    }
  } catch (error) {
    console.error('Action error:', error);
    showToast('Verbindungsfehler', 'error');
  }
}

// Execute action for buttons 2-8
async function executeAction(actionId, label, button) {
  // Add loading state
  button.style.opacity = '0.5';
  button.style.pointerEvents = 'none';
  
  try {
    const response = await fetch(`/api/action/${actionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
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
}

// Update time display
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

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Allow Enter key to submit modal
document.addEventListener('DOMContentLoaded', () => {
  const topicInput = document.getElementById('topic-input');
  if (topicInput) {
    topicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitTopic();
      }
    });
  }
});