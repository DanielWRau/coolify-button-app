// Navigation Logic
function showLeistungsbeschreibung(event) {
  event.preventDefault();

  // Hide dashboard, show leistungsbeschreibung
  document.getElementById('dashboard-screen').style.display = 'none';
  document.getElementById('leistungsbeschreibung-screen').style.display = 'block';

  // Update active menu item
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
  event.target.closest('.menu-item').classList.add('active');
}

function showDashboard() {
  // Show dashboard, hide leistungsbeschreibung
  document.getElementById('dashboard-screen').style.display = 'flex';
  document.getElementById('leistungsbeschreibung-screen').style.display = 'none';

  // Update active menu item
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
  document.querySelector('.menu-item:first-child').classList.add('active');
}

// Initialize page - ensure only dashboard is visible
document.addEventListener('DOMContentLoaded', () => {
  const dashboardScreen = document.getElementById('dashboard-screen');
  const leistungScreen = document.getElementById('leistungsbeschreibung-screen');

  if (dashboardScreen) dashboardScreen.style.display = 'flex';
  if (leistungScreen) leistungScreen.style.display = 'none';
});

// Button click handlers
document.querySelectorAll('.button-item').forEach(button => {
  button.addEventListener('click', async () => {
    const actionId = button.dataset.action;

    // Special handling for Button 1 (LinkedIn Post)
    if (actionId === '1') {
      openModal();
      return;
    }

    // Special handling for Button 2 (Email Post)
    if (actionId === '2') {
      openEmailModal();
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
  const modal = document.getElementById('input-modal');
  const input = document.getElementById('topic-input');

  if (!modal || !input) {
    console.error('Modal elements not found');
    return;
  }

  modal.style.display = 'flex';
  input.focus();
}

// Close modal
function closeModal() {
  const modal = document.getElementById('input-modal');
  const input = document.getElementById('topic-input');

  if (!modal || !input) return;

  modal.style.display = 'none';
  input.value = '';
}

// Email Post Modal Functions
function openEmailModal() {
  const modal = document.getElementById('email-modal');
  const input = document.getElementById('email-topic-input');

  if (!modal || !input) {
    console.error('Email modal elements not found');
    return;
  }

  modal.style.display = 'flex';
  input.focus();
}

function closeEmailModal() {
  const modal = document.getElementById('email-modal');
  const input = document.getElementById('email-topic-input');

  if (!modal || !input) return;

  modal.style.display = 'none';
  input.value = '';
}

async function submitEmailTopic() {
  const topic = document.getElementById('email-topic-input').value.trim();

  if (!topic) {
    showToast('Bitte gib ein Thema ein', 'error');
    return;
  }

  closeEmailModal();

  // Show loading toast
  showToast('LinkedIn Post wird generiert und per Email versendet...', 'success');

  try {
    const response = await fetch('/api/generate-post-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });

    const data = await response.json();

    if (data.success) {
      showToast(`Post generiert und versendet an: ${data.email.to}`, 'success');

      // Show additional info after a delay
      setTimeout(() => {
        showToast(`Email ID: ${data.email.messageId.substring(0, 20)}...`, 'success');
      }, 3000);
    } else {
      showToast(data.error || 'Fehler beim Versenden', 'error');

      // Show additional details if available
      if (data.details) {
        setTimeout(() => {
          showToast(data.details, 'error');
        }, 2000);
      }
    }
  } catch (error) {
    console.error('Email post error:', error);
    showToast('Verbindungsfehler', 'error');
  }
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
let currentArticles = [];

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Update tab content
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

async function openSettingsModal() {
  try {
    const response = await fetch('/api/schedule');
    const config = await response.json();

    const scheduleEnabled = document.getElementById('schedule-enabled');
    const scheduleTime = document.getElementById('schedule-time');
    const settingsModal = document.getElementById('settings-modal');

    if (!scheduleEnabled || !scheduleTime || !settingsModal) {
      console.error('Settings elements not found');
      showToast('Fehler: UI-Elemente nicht gefunden', 'error');
      return;
    }

    scheduleEnabled.checked = config.enabled;
    scheduleTime.value = config.time;
    currentTopics = [...config.topics];

    renderTopicsList();
    updateNextPostInfo(config);
    loadArticles();
    settingsModal.style.display = 'flex';
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

async function generateTopicsAI() {
  const btn = document.getElementById('generate-topics-btn');
  if (!btn) return;

  const originalText = btn.textContent;

  btn.textContent = 'Generiere...';
  btn.disabled = true;

  try {
    const response = await fetch('/api/generate-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 5 })
    });

    const data = await response.json();

    if (data.success && data.topics.length > 0) {
      // Add generated topics to current topics (avoid duplicates)
      data.topics.forEach(topic => {
        if (!currentTopics.includes(topic)) {
          currentTopics.push(topic);
        }
      });

      renderTopicsList();
      await saveSettings();
      showToast(`${data.topics.length} Themen generiert`, 'success');
    } else {
      showToast('Keine Themen generiert', 'error');
    }
  } catch (error) {
    console.error('Topic generation error:', error);
    showToast('Fehler bei Themen-Generierung', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
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

  // Email topic input modal - Enter to submit
  const emailTopicInput = document.getElementById('email-topic-input');
  if (emailTopicInput) {
    emailTopicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitEmailTopic();
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

  // Auto-save schedule settings
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
      saveSettings();
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
      saveSettings();
    });
  }
});

// Article Generation Functions

async function generateArticle() {
  const topic = document.getElementById('article-topic').value.trim();
  const length = document.getElementById('article-length').value;
  const tone = document.getElementById('article-tone').value;

  if (!topic) {
    showToast('Bitte Thema eingeben', 'error');
    return;
  }

  const btn = document.getElementById('generate-article-btn');
  const statusEl = document.getElementById('article-status');

  if (!btn) return;

  const originalText = btn.textContent;

  btn.disabled = true;
  btn.textContent = 'Generiere...';

  try {
    // Step 1: Research
    statusEl.textContent = 'Schritt 1/3: Recherchiere Thema...';
    statusEl.style.color = '#667eea';

    const response = await fetch('/api/articles/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        focus: 'praktische Insights und Best Practices',
        targetLength: length,
        tone
      })
    });

    // Simulate step updates for better UX
    setTimeout(() => {
      statusEl.textContent = 'Schritt 2/3: Erstelle Gliederung...';
    }, 1000);

    setTimeout(() => {
      statusEl.textContent = 'Schritt 3/3: Schreibe Artikel...';
    }, 2000);

    const data = await response.json();

    if (data.success) {
      statusEl.textContent = `Artikel erfolgreich erstellt (${data.article.wordCount} Woerter)`;
      statusEl.style.color = '#10b981';
      showToast('Artikel erfolgreich generiert', 'success');

      // Clear input and reload articles
      document.getElementById('article-topic').value = '';
      await loadArticles();

      // Clear status after 3 seconds
      setTimeout(() => {
        statusEl.textContent = '';
      }, 3000);
    } else {
      statusEl.textContent = 'Fehler bei der Generierung';
      statusEl.style.color = '#ff4757';
      showToast(data.error || 'Fehler bei Artikel-Generierung', 'error');
    }
  } catch (error) {
    console.error('Article generation error:', error);
    statusEl.textContent = 'Verbindungsfehler';
    statusEl.style.color = '#ff4757';
    showToast('Verbindungsfehler', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function loadArticles() {
  try {
    const response = await fetch('/api/articles');
    const data = await response.json();

    if (data.success) {
      currentArticles = data.articles;
      renderArticlesList();

      // Update count
      document.getElementById('article-count').textContent = currentArticles.length;
    }
  } catch (error) {
    console.error('Failed to load articles:', error);
  }
}

function renderArticlesList() {
  const listEl = document.getElementById('articles-list');

  if (!listEl) return; // Element not in DOM (modal closed)

  if (currentArticles.length === 0) {
    listEl.innerHTML = '';
    return;
  }

  listEl.innerHTML = currentArticles
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(article => {
      const date = new Date(article.createdAt).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit'
      });

      const isScheduled = article.status === 'scheduled';
      const isPosted = article.status === 'posted';

      let statusBadge = '';
      if (isScheduled) {
        const schedTime = new Date(article.scheduledFor).toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        statusBadge = `<span style="background: #10b981; color: white; padding: 3px 8px; border-radius: 6px; font-size: 10px; margin-left: 6px;">${schedTime}</span>`;
      } else if (isPosted) {
        statusBadge = `<span style="background: #6366f1; color: white; padding: 3px 8px; border-radius: 6px; font-size: 10px; margin-left: 6px;">Gepostet</span>`;
      }

      let actionButtons = '';
      if (isPosted) {
        actionButtons = `
          <button class="view-btn" onclick="viewArticle('${article.id}')">Ansehen</button>
          <button class="delete-btn" onclick="deleteArticle('${article.id}')">×</button>
        `;
      } else if (isScheduled) {
        actionButtons = `
          <button class="view-btn" onclick="viewArticle('${article.id}')">Ansehen</button>
          <button class="delete-btn" onclick="cancelSchedule('${article.id}')">Abbrechen</button>
        `;
      } else {
        actionButtons = `
          <button class="view-btn" onclick="viewArticle('${article.id}')">Ansehen</button>
          <button class="post-btn" onclick="openScheduleModal('${article.id}', '${article.topic}')">Planen</button>
          <button class="post-now-btn" onclick="postArticleNow('${article.id}')">Posten</button>
        `;
      }

      return `
        <div class="article-item">
          <h4>${article.topic}${statusBadge}</h4>
          <div class="article-meta">
            ${date} • ${article.wordCount}w
          </div>
          <div class="article-actions">
            ${actionButtons}
          </div>
        </div>
      `;
    })
    .join('');
}

async function viewArticle(id) {
  try {
    const response = await fetch(`/api/articles/${id}`);
    const data = await response.json();

    if (data.success) {
      const article = data.article;

      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 90%; width: 500px; max-height: 85vh; overflow-y: auto; -webkit-overflow-scrolling: touch; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);">
          <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">${article.topic}</h2>
          <div style="font-size: 12px; color: #666; margin-bottom: 15px;">
            ${new Date(article.createdAt).toLocaleDateString('de-DE')} • ${article.wordCount}w
          </div>

          <div style="background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; margin-bottom: 12px; max-height: 400px; overflow-y: auto; -webkit-overflow-scrolling: touch;">
            <div style="white-space: pre-wrap; line-height: 1.6; font-size: 14px; color: #333;">${article.content}</div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 15px;">
            <button class="action-btn secondary" onclick="editArticle('${article.id}'); this.closest('.modal').remove();">Bearbeiten</button>
            <button class="action-btn primary" onclick="this.closest('.modal').remove()">OK</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }
  } catch (error) {
    console.error('Failed to view article:', error);
    showToast('Fehler beim Laden des Artikels', 'error');
  }
}

async function editArticle(id) {
  try {
    const response = await fetch(`/api/articles/${id}`);
    const data = await response.json();

    if (data.success) {
      const article = data.article;

      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 90%; width: 500px; max-height: 85vh; overflow-y: auto; -webkit-overflow-scrolling: touch; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);">
          <h2 style="font-size: 18px; margin-bottom: 10px; color: #333;">Bearbeiten</h2>
          <p style="color: #666; margin-bottom: 15px; font-size: 14px;">${article.topic}</p>

          <textarea
            id="edit-article-content"
            class="settings-input"
            style="min-height: 350px; resize: vertical; font-size: 14px; line-height: 1.6;"
          >${article.content}</textarea>

          <div style="display: flex; gap: 8px; margin-top: 15px;">
            <button class="action-btn secondary" onclick="this.closest('.modal').remove()">Abbrechen</button>
            <button class="action-btn primary" onclick="saveArticleEdit('${article.id}')">Speichern</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }
  } catch (error) {
    console.error('Failed to load article for editing:', error);
    showToast('Fehler beim Laden des Artikels', 'error');
  }
}

async function saveArticleEdit(id) {
  const content = document.getElementById('edit-article-content').value.trim();

  if (!content) {
    showToast('Artikel darf nicht leer sein', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        wordCount: content.split(/\s+/).length
      })
    });

    const data = await response.json();

    if (data.success) {
      showToast('Artikel aktualisiert', 'success');
      document.querySelector('.modal').remove();
      await loadArticles();
    } else {
      showToast('Fehler beim Speichern', 'error');
    }
  } catch (error) {
    console.error('Failed to save article:', error);
    showToast('Verbindungsfehler', 'error');
  }
}

async function deleteArticle(id) {
  const confirmed = await showConfirmModal(
    'Artikel löschen?',
    'Möchtest du den Artikel wirklich unwiderruflich löschen?'
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/articles/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      showToast('Artikel geloescht', 'success');
      await loadArticles();
    } else {
      showToast('Fehler beim Loeschen', 'error');
    }
  } catch (error) {
    console.error('Failed to delete article:', error);
    showToast('Verbindungsfehler', 'error');
  }
}

// Article Posting Functions

function openScheduleModal(id, topic) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dateStr = tomorrow.toISOString().slice(0, 16);

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 90%; width: 400px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);">
      <h2 style="font-size: 18px; margin-bottom: 15px;">Artikel planen</h2>
      <p style="color: #666; margin-bottom: 15px; font-size: 14px;">${topic}</p>

      <input
        type="datetime-local"
        id="schedule-datetime"
        class="settings-input"
        value="${dateStr}"
        min="${now.toISOString().slice(0, 16)}"
      >

      <div style="display: flex; gap: 8px; margin-top: 15px;">
        <button class="action-btn secondary" onclick="this.closest('.modal').remove()">Abbrechen</button>
        <button class="action-btn primary" onclick="confirmSchedule('${id}')">Planen</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

async function confirmSchedule(id) {
  const datetime = document.getElementById('schedule-datetime').value;

  if (!datetime) {
    showToast('Bitte Datum/Zeit auswaehlen', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/articles/${id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledFor: datetime })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('Artikel erfolgreich geplant', 'success');
      document.querySelector('.modal').remove();
      await loadArticles();
    } else {
      // Handle different error types
      let errorMessage = 'Fehler beim Planen';

      if (response.status === 404) {
        errorMessage = 'Artikel nicht gefunden. Bitte Seite neu laden.';
      } else if (response.status === 400) {
        errorMessage = data.error || 'Ungültige Zeitangabe';
      } else if (data.error) {
        errorMessage = data.error;
      }

      showToast(errorMessage, 'error');

      // Reload articles to sync state
      if (response.status === 404) {
        await loadArticles();
      }
    }
  } catch (error) {
    console.error('Failed to schedule article:', error);
    showToast('Verbindungsfehler beim Planen', 'error');
  }
}

async function postArticleNow(id) {
  const confirmed = await showConfirmModal(
    'Artikel zu LinkedIn posten?',
    'Möchtest du den Artikel jetzt sofort zu LinkedIn posten?'
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/articles/${id}/post`, {
      method: 'POST'
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('Artikel wird gepostet...', 'success');
      await loadArticles();
    } else {
      // Handle different error types
      let errorMessage = 'Fehler beim Posten';

      if (response.status === 404) {
        errorMessage = 'Artikel nicht gefunden. Bitte Seite neu laden.';
      } else if (response.status === 400) {
        errorMessage = data.error || 'Artikel hat keinen Inhalt';
      } else if (data.error) {
        errorMessage = data.error;
      }

      showToast(errorMessage, 'error');

      // Reload articles to sync state
      if (response.status === 404) {
        await loadArticles();
      }
    }
  } catch (error) {
    console.error('Failed to post article:', error);
    showToast('Verbindungsfehler beim Posten', 'error');
  }
}

// Generic confirm modal
function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 90%; width: 350px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);">
        <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">${title}</h2>
        <p style="color: #666; margin-bottom: 20px; font-size: 14px;">${message}</p>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="action-btn secondary" onclick="this.closest('.modal').dataset.confirmed = 'false'; this.closest('.modal').remove()">Abbrechen</button>
          <button class="action-btn primary" onclick="this.closest('.modal').dataset.confirmed = 'true'; this.closest('.modal').remove()">Bestätigen</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle modal removal
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === modal) {
            observer.disconnect();
            resolve(modal.dataset.confirmed === 'true');
          }
        });
      });
    });

    observer.observe(document.body, { childList: true });

    // Click outside to cancel
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.dataset.confirmed = 'false';
        modal.remove();
      }
    });
  });
}

async function cancelSchedule(id) {
  const confirmed = await showConfirmModal(
    'Planung abbrechen?',
    'Möchtest du die geplante Veröffentlichung wirklich abbrechen?'
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft', scheduledFor: null })
    });

    const data = await response.json();

    if (data.success) {
      showToast('Planung abgebrochen', 'success');
      await loadArticles();
    } else {
      showToast('Fehler beim Abbrechen', 'error');
    }
  } catch (error) {
    console.error('Failed to cancel schedule:', error);
    showToast('Verbindungsfehler', 'error');
  }
}
