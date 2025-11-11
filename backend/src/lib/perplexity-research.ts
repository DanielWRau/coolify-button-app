/**
 * Perplexity AI Research Integration using Vercel AI SDK v5
 * Provides online search and research capabilities for creating informed LinkedIn posts
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { readFile } from 'fs/promises';
import path from 'path';

export interface ResearchResult {
  summary: string;
  sources: string[];
  keyPoints: string[];
}

/**
 * Performs online research for a topic using Perplexity API via Vercel AI SDK
 */
export async function researchTopic(topic: string): Promise<ResearchResult> {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

  if (!perplexityApiKey) {
    console.warn('[RESEARCH] Perplexity API key not configured, skipping research');
    return {
      summary: '',
      sources: [],
      keyPoints: [],
    };
  }

  try {
    console.log('[RESEARCH] Starting research for topic:', topic);

    // Create Perplexity provider using OpenAI-compatible API
    const perplexity = createOpenAI({
      apiKey: perplexityApiKey,
      baseURL: 'https://api.perplexity.ai',
    });

    const { text, usage } = await generateText({
      model: perplexity('llama-3.1-sonar-small-128k-online'), // Online model for web search
      system: 'You are a research assistant. Provide concise, fact-based summaries with key points for professional LinkedIn content creation. Structure your response with: SUMMARY: (2-3 sentences), KEY POINTS: (numbered list of 3-5 points)',
      prompt: `Research current information about: ${topic}

Focus on:
- Current trends and developments
- Key facts and statistics
- Industry insights
- Relevant for professional LinkedIn post

Provide structured response with summary and key points.`,
      temperature: 0.2, // Low temperature for factual research
      maxTokens: 500,
    });

    console.log('[RESEARCH] Research completed:', {
      topic,
      textLength: text.length,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    });

    // Parse structured response
    const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?=KEY POINTS:|$)/is);
    const keyPointsMatch = text.match(/KEY POINTS:\s*(.+)$/is);

    const summary = summaryMatch ? summaryMatch[1].trim() : text.substring(0, 200);

    const keyPoints: string[] = [];
    if (keyPointsMatch) {
      const pointsText = keyPointsMatch[1];
      const lines = pointsText.split('\n');
      lines.forEach((line: string) => {
        if (line.match(/^[-•\d.]\s/)) {
          keyPoints.push(line.replace(/^[-•\d.]\s*/, '').trim());
        }
      });
    }

    return {
      summary,
      sources: [], // Perplexity doesn't expose citations via OpenAI API
      keyPoints: keyPoints.slice(0, 5),
    };
  } catch (error: any) {
    console.error('[RESEARCH] Research failed:', error);
    return {
      summary: '',
      sources: [],
      keyPoints: [],
    };
  }
}

/**
 * Enhanced system prompt that includes research context
 */
export function createResearchEnhancedPrompt(
  basePrompt: string,
  research: ResearchResult
): string {
  if (!research.summary && research.keyPoints.length === 0) {
    return basePrompt; // No research available
  }

  const researchContext = `
RESEARCH CONTEXT (use this factual information in your post):
${research.summary}

KEY INSIGHTS:
${research.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

${research.sources.length > 0 ? `SOURCES: ${research.sources.slice(0, 3).join(', ')}` : ''}
`;

  return `${basePrompt}

${researchContext}

Use the research context above to create an informed, fact-based LinkedIn post.`;
}

/**
 * Loads prompt configuration from JSON files
 */
async function loadPromptConfig(promptType: 'manual' | 'scheduled'): Promise<any> {
  const promptFile = promptType === 'manual'
    ? 'linkedin-post-structure.json'
    : 'scheduled-posts-prompt.json';

  const promptPath = path.join(process.cwd(), 'prompts', promptFile);

  try {
    const content = await readFile(promptPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`[PROMPT] Failed to load ${promptFile}:`, error);
    return null;
  }
}

/**
 * Generates a complete LinkedIn post using Perplexity via OpenRouter with research and formatting in one call
 */
export async function generateLinkedInPost(
  topic: string,
  promptType: 'manual' | 'scheduled' = 'manual'
): Promise<string> {
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openrouterApiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  // Load prompt configuration
  const promptConfig = await loadPromptConfig(promptType);
  if (!promptConfig) {
    throw new Error('Failed to load prompt configuration');
  }

  // Build comprehensive system prompt from JSON config
  const systemPrompt = `${promptConfig.system_prompt}

STRUKTUR:
${Object.entries(promptConfig.post_structure).map(([key, value]) => `${key}: ${value}`).join('\n')}

RICHTLINIEN:
${Object.entries(promptConfig.guidelines).map(([key, value]) => `${key}: ${value}`).join('\n')}

CONTENT ANFORDERUNGEN:
${Object.entries(promptConfig.content_requirements || {}).map(([key, value]) => `${key}: ${value}`).join('\n')}

VERBOTEN:
${Object.entries(promptConfig.forbidden || {}).map(([key, value]) => `${key}: ${value}`).join('\n')}

WICHTIG:
- Formatiere den Post EXAKT wie beschrieben
- Jede Zeile ist ein separater Absatz
- Hashtags am Ende nach Leerzeile
- MAX 1300 Zeichen
- Verwende KEINE Markdown-Formatierung (kein **, __, etc.)
- Plain text only`;

  const userPrompt = `Recherchiere aktuelle Informationen zum Thema und erstelle einen professionellen LinkedIn Post:

Thema: ${topic}

Recherchiere:
- Aktuelle Trends und Entwicklungen
- Konkrete Fakten, Studien, Zahlen
- Neue, ueberraschende Insights
- Praktische Erkenntnisse

Erstelle dann direkt den fertigen LinkedIn Post nach den Struktur-Vorgaben.`;

  try {
    console.log('[PERPLEXITY] Generating LinkedIn post with research via OpenRouter...');

    // Use OpenRouter with Perplexity model
    const openrouter = createOpenAI({
      apiKey: openrouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const { text, usage } = await generateText({
      model: openrouter('perplexity/llama-3.1-sonar-large-128k-online'), // Perplexity via OpenRouter
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 800,
    });

    console.log('[PERPLEXITY] Post generated via OpenRouter:', {
      topic,
      length: text.length,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    });

    return text.trim();
  } catch (error: any) {
    console.error('[PERPLEXITY] Post generation failed:', error);
    throw new Error(`Failed to generate LinkedIn post: ${error.message}`);
  }
}
