/**
 * Perplexity AI Research Integration
 * Provides online search and research capabilities for creating informed LinkedIn posts
 */

export interface ResearchResult {
  summary: string;
  sources: string[];
  keyPoints: string[];
}

/**
 * Performs online research for a topic using Perplexity API
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

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online', // Online model for web search
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Provide concise, fact-based summaries with key points and sources for professional LinkedIn content creation.',
          },
          {
            role: 'user',
            content: `Research current information about: ${topic}

Provide:
1. A brief summary (2-3 sentences)
2. 3-5 key points or insights
3. Current trends or developments

Focus on information relevant for creating an informed LinkedIn post.`,
          },
        ],
        temperature: 0.2, // Low temperature for factual research
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[RESEARCH] Perplexity API error:', error);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('[RESEARCH] Research completed:', {
      topic,
      contentLength: content.length,
    });

    // Parse the response to extract key points
    const lines = content.split('\n').filter((line: string) => line.trim());
    const keyPoints: string[] = [];

    lines.forEach((line: string) => {
      // Extract bullet points or numbered items
      if (line.match(/^[-•\d.]\s/)) {
        keyPoints.push(line.replace(/^[-•\d.]\s*/, '').trim());
      }
    });

    // Extract sources from citations if available
    const sources = data.citations || [];

    return {
      summary: content.substring(0, 200), // First 200 chars as summary
      sources,
      keyPoints: keyPoints.slice(0, 5), // Top 5 key points
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
