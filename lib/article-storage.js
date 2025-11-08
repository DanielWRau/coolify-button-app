const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize articles file if it doesn't exist
if (!fs.existsSync(ARTICLES_FILE)) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify({ articles: [] }, null, 2));
}

// Load articles
function loadArticles() {
  try {
    const data = fs.readFileSync(ARTICLES_FILE, 'utf8');
    return JSON.parse(data).articles;
  } catch (error) {
    console.error('Error loading articles:', error);
    return [];
  }
}

// Save articles
function saveArticles(articles) {
  try {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify({ articles }, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving articles:', error);
    return false;
  }
}

// Create article
function createArticle(articleData) {
  const articles = loadArticles();
  const article = {
    id: Date.now().toString(),
    ...articleData,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  articles.push(article);
  saveArticles(articles);
  return article;
}

// Get article by ID
function getArticle(id) {
  const articles = loadArticles();
  return articles.find(a => a.id === id);
}

// Get all articles
function getAllArticles() {
  return loadArticles();
}

// Update article
function updateArticle(id, updates) {
  const articles = loadArticles();
  const index = articles.findIndex(a => a.id === id);

  if (index === -1) {
    return null;
  }

  articles[index] = {
    ...articles[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveArticles(articles);
  return articles[index];
}

// Delete article
function deleteArticle(id) {
  const articles = loadArticles();
  const filtered = articles.filter(a => a.id !== id);

  if (filtered.length === articles.length) {
    return false;
  }

  saveArticles(filtered);
  return true;
}

// Schedule article
function scheduleArticle(id, scheduledFor) {
  return updateArticle(id, {
    status: 'scheduled',
    scheduledFor,
  });
}

// Get scheduled articles
function getScheduledArticles() {
  const articles = loadArticles();
  return articles.filter(a => a.status === 'scheduled');
}

module.exports = {
  createArticle,
  getArticle,
  getAllArticles,
  updateArticle,
  deleteArticle,
  scheduleArticle,
  getScheduledArticles,
};
