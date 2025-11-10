/**
 * Perplexity AI Research Integration using Vercel AI SDK v5
 * Provides online search and research capabilities for creating informed LinkedIn posts
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

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
