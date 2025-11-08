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

async function openSettingsModal() {
  try {
    const response = await fetch('/api/schedule');
    const config = await response.json();

    document.getElementById('schedule-enabled').checked = config.enabled;
    document.getElementById('schedule-time').value = config.time;
    currentTopics = [...config.topics];

    renderTopicsList();
    updateNextPostInfo(config);
    loadArticles();
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

async function generateTopicsAI() {
  const btn = document.querySelector('.generate-topics-btn');
  const originalText = btn.textContent;

  btn.textContent = 'Generiere Themen...';
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

// Article Generation Functions

async function generateArticle() {
  const topic = document.getElementById('article-topic').value.trim();
  const length = document.getElementById('article-length').value;
  const tone = document.getElementById('article-tone').value;

  if (!topic) {
    showToast('Bitte Thema eingeben', 'error');
    return;
  }

  const btn = document.querySelector('.generate-article-btn');
  const statusEl = document.getElementById('article-status');
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

  if (currentArticles.length === 0) {
    listEl.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Noch keine Artikel gespeichert</p>';
    return;
  }

  listEl.innerHTML = currentArticles
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(article => {
      const date = new Date(article.createdAt).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const statusBadge = article.status === 'scheduled'
        ? `<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">Geplant</span>`
        : '';

      return `
        <div class="article-item">
          <h4>${article.topic}${statusBadge}</h4>
          <div class="article-meta">
            ${date} • ${article.wordCount} Woerter • ${article.tone}
          </div>
          <div class="article-actions">
            <button class="view-btn" onclick="viewArticle('${article.id}')">Ansehen</button>
            <button class="delete-btn" onclick="deleteArticle('${article.id}')">Loeschen</button>
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

      // Create modal for viewing article
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
          <h2>${article.topic}</h2>
          <div style="font-size: 14px; color: #666; margin-bottom: 20px;">
            ${new Date(article.createdAt).toLocaleDateString('de-DE')} •
            ${article.wordCount} Woerter •
            ${article.tone}
          </div>

          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="font-size: 16px; margin-bottom: 10px;">Artikel:</h3>
            <div style="white-space: pre-wrap; line-height: 1.6;">${article.content}</div>
          </div>

          <details style="margin-bottom: 15px;">
            <summary style="cursor: pointer; font-weight: 600; margin-bottom: 10px;">Gliederung</summary>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${article.outline}</div>
          </details>

          <details>
            <summary style="cursor: pointer; font-weight: 600; margin-bottom: 10px;">Recherche</summary>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${article.research}</div>
          </details>

          <div class="modal-buttons" style="margin-top: 20px;">
            <button class="modal-btn cancel-btn" onclick="this.closest('.modal').remove()">Schliessen</button>
            <button class="modal-btn submit-btn" onclick="editArticle('${article.id}'); this.closest('.modal').remove();">Bearbeiten</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Close on background click
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

      // Create edit modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
          <h2>Artikel bearbeiten</h2>
          <p style="color: #666; margin-bottom: 20px;">${article.topic}</p>

          <textarea
            id="edit-article-content"
            style="width: 100%; min-height: 400px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 14px; line-height: 1.6; resize: vertical;"
          >${article.content}</textarea>

          <div class="modal-buttons" style="margin-top: 20px;">
            <button class="modal-btn cancel-btn" onclick="this.closest('.modal').remove()">Abbrechen</button>
            <button class="modal-btn submit-btn" onclick="saveArticleEdit('${article.id}')">Speichern</button>
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
  if (!confirm('Artikel wirklich loeschen?')) {
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
