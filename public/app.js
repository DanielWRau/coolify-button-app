// Button click handlers
document.querySelectorAll('.button-item').forEach(button => {
  button.addEventListener('click', async () => {
    const actionId = button.dataset.action;

    // Special handling for Button 1 (LinkedIn Post)
    if (actionId === '1') {
      openModal();
      return;
    }

    // Special handling for Button 6 (Settings)
    if (actionId === '6') {
      openSettingsModal();
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

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Settings Modal Functions
let currentTopics = [];

async function openSettingsModal() {
  try {
    const response = await fetch('/api/schedule');
    const config = await response.json();

    document.getElementById('schedule-enabled').checked = config.enabled;
    document.getElementById('schedule-time').value = config.time;
    currentTopics = [...config.topics];

    renderTopicsList();
    updateNextPostInfo(config);
    document.getElementById('settings-modal').style.display = 'flex';
  } catch (error) {
    console.error('Failed to load settings:', error);
    showToast('Fehler beim Laden der Einstellungen', 'error');
  }
}

function updateNextPostInfo(config) {
  const infoEl = document.getElementById('next-post-info');

  if (!config.enabled) {
    infoEl.textContent = '';
    return;
  }

  const now = new Date();
  const [hour, minute] = config.time.split(':');
  const nextPost = new Date();
  nextPost.setHours(parseInt(hour), parseInt(minute), 0, 0);

  // If time already passed today, schedule for tomorrow
  if (nextPost <= now) {
    nextPost.setDate(nextPost.getDate() + 1);
  }

  const timeUntil = Math.floor((nextPost - now) / 1000 / 60 / 60);
  const randomTopic = config.topics[Math.floor(Math.random() * config.topics.length)];

  if (timeUntil < 24) {
    infoEl.textContent = `Naechster Post in ca. ${timeUntil}h ueber "${randomTopic}"`;
  } else {
    infoEl.textContent = `Naechster Post morgen um ${config.time} Uhr`;
  }
}

function closeSettingsModal() {
  document.getElementById('settings-modal').style.display = 'none';
  document.getElementById('new-topic-input').value = '';
}

function renderTopicsList() {
  const topicsList = document.getElementById('topics-list');
  topicsList.innerHTML = currentTopics.map((topic, index) => `
    <div class="topic-item">
      <span>${topic}</span>
      <button class="topic-remove" onclick="removeTopic(${index})">×</button>
    </div>
  `).join('');
}

function addTopic() {
  const input = document.getElementById('new-topic-input');
  const topic = input.value.trim();

  if (!topic) {
    showToast('Bitte Thema eingeben', 'error');
    return;
  }

  if (currentTopics.includes(topic)) {
    showToast('Thema bereits vorhanden', 'error');
    return;
  }

  currentTopics.push(topic);
  renderTopicsList();
  input.value = '';
}

function removeTopic(index) {
  currentTopics.splice(index, 1);
  renderTopicsList();
}

async function saveSettings() {
  const enabled = document.getElementById('schedule-enabled').checked;
  const time = document.getElementById('schedule-time').value;

  if (currentTopics.length === 0 && enabled) {
    showToast('Mindestens ein Thema erforderlich', 'error');
    return;
  }

  try {
    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled,
        time,
        topics: currentTopics
      })
    });

    const result = await response.json();

    if (result.success) {
      const statusMsg = enabled
        ? `Posts aktiviert fuer ${time} Uhr`
        : 'Automatische Posts deaktiviert';
      showToast(statusMsg, 'success');
      closeSettingsModal();
    } else {
      showToast('Speichern fehlgeschlagen', 'error');
    }
  } catch (error) {
    console.error('Save settings error:', error);
    showToast('Verbindungsfehler', 'error');
  }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Topic input modal - Enter to submit
  const topicInput = document.getElementById('topic-input');
  if (topicInput) {
    topicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitTopic();
      }
    });
  }

  // New topic input - Enter to add
  const newTopicInput = document.getElementById('new-topic-input');
  if (newTopicInput) {
    newTopicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTopic();
      }
    });
  }

  // Live update next post info when settings change
  const scheduleTime = document.getElementById('schedule-time');
  const scheduleEnabled = document.getElementById('schedule-enabled');

  if (scheduleTime) {
    scheduleTime.addEventListener('change', () => {
      const config = {
        enabled: scheduleEnabled?.checked || false,
        time: scheduleTime.value,
        topics: currentTopics
      };
      updateNextPostInfo(config);
    });
  }

  if (scheduleEnabled) {
    scheduleEnabled.addEventListener('change', () => {
      const config = {
        enabled: scheduleEnabled.checked,
        time: scheduleTime?.value || '09:00',
        topics: currentTopics
      };
      updateNextPostInfo(config);
    });
  }
});
