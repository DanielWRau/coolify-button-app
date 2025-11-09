import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

export interface Article {
  id: string;
  topic: string;
  focus?: string;
  targetLength?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational';
  research?: string;
  outline?: string;
  content: string;
  wordCount?: number;
  status: 'draft' | 'scheduled' | 'posted';
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string;
  postedAt?: string;
  taskId?: string;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize articles file if it doesn't exist
if (!fs.existsSync(ARTICLES_FILE)) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify({ articles: [] }, null, 2));
}

// Load articles
export function loadArticles(): Article[] {
  try {
    const data = fs.readFileSync(ARTICLES_FILE, 'utf8');
    return JSON.parse(data).articles;
  } catch (error) {
    console.error('Error loading articles:', error);
    return [];
  }
}

// Save articles
function saveArticles(articles: Article[]): boolean {
  try {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify({ articles }, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving articles:', error);
    return false;
  }
}

// Create article
export function createArticle(articleData: Omit<Article, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Article {
  const articles = loadArticles();
  const article: Article = {
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
export function getArticle(id: string): Article | undefined {
  const articles = loadArticles();
  return articles.find(a => a.id === id);
}

// Get all articles
export function getAllArticles(): Article[] {
  return loadArticles();
}

// Update article
export function updateArticle(id: string, updates: Partial<Article>): Article | null {
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
export function deleteArticle(id: string): boolean {
  const articles = loadArticles();
  const filtered = articles.filter(a => a.id !== id);

  if (filtered.length === articles.length) {
    return false;
  }

  saveArticles(filtered);
  return true;
}

// Schedule article
export function scheduleArticle(id: string, scheduledFor: string): Article | null {
  return updateArticle(id, {
    status: 'scheduled',
    scheduledFor,
  });
}

// Get scheduled articles
export function getScheduledArticles(): Article[] {
  const articles = loadArticles();
  return articles.filter(a => a.status === 'scheduled');
}
