const { generateText, tool } = require('ai');
const { createOpenRouter } = require('@openrouter/ai-sdk-provider');
const { z } = require('zod');

// Initialize OpenRouter
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Get model instance
const getModel = () => {
  const modelName = process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini';
  return openrouter(modelName);
};

// Tool 1: Research Topic
const researchTool = tool({
  description: 'Research a topic by gathering key facts, trends, and insights',
  parameters: z.object({
    topic: z.string().describe('The topic to research'),
    focus: z.string().describe('Specific focus area or angle for research'),
  }),
  execute: async ({ topic, focus }) => {
    console.log(`[RESEARCH] Topic: ${topic}, Focus: ${focus}`);

    const result = await generateText({
      model: getModel(),
      prompt: `Research the topic "${topic}" with focus on "${focus}".

Provide:
1. Key facts and current trends (3-5 points)
2. Important statistics or data points
3. Expert perspectives or industry insights
4. Common challenges or pain points
5. Recent developments or innovations

Format your response as structured research findings.`,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return {
      topic,
      focus,
      findings: result.text,
      timestamp: new Date().toISOString(),
    };
  },
});

// Tool 2: Create Outline
const outlineTool = tool({
  description: 'Create a structured outline for an article based on research',
  parameters: z.object({
    topic: z.string().describe('The article topic'),
    research: z.string().describe('Research findings to base the outline on'),
    targetLength: z.enum(['short', 'medium', 'long']).describe('Target article length'),
  }),
  execute: async ({ topic, research, targetLength }) => {
    console.log(`[OUTLINE] Topic: ${topic}, Length: ${targetLength}`);

    const lengthGuide = {
      short: '500-800 words (2-3 main sections)',
      medium: '800-1500 words (4-5 main sections)',
      long: '1500-2500 words (6-8 main sections)',
    };

    const result = await generateText({
      model: getModel(),
      prompt: `Create a detailed article outline for: "${topic}"

Target Length: ${lengthGuide[targetLength]}

Research Findings:
${research}

Create an outline with:
1. Compelling title
2. Hook/Introduction (what problem or question)
3. Main sections (each with 2-3 key points)
4. Conclusion with actionable takeaways
5. Suggested call-to-action

Format as a structured outline with clear hierarchy.`,
      temperature: 0.8,
      maxTokens: 800,
    });

    return {
      topic,
      targetLength,
      outline: result.text,
      timestamp: new Date().toISOString(),
    };
  },
});

// Tool 3: Write Article
const writeTool = tool({
  description: 'Write a complete article based on outline and research',
  parameters: z.object({
    topic: z.string().describe('The article topic'),
    outline: z.string().describe('Article outline to follow'),
    research: z.string().describe('Research to incorporate'),
    tone: z.enum(['professional', 'casual', 'inspirational', 'educational']).describe('Writing tone'),
  }),
  execute: async ({ topic, outline, research, tone }) => {
    console.log(`[WRITE] Topic: ${topic}, Tone: ${tone}`);

    const result = await generateText({
      model: getModel(),
      prompt: `Write a complete LinkedIn article based on:

Topic: ${topic}

Outline:
${outline}

Research:
${research}

Tone: ${tone}

Requirements:
- Follow the outline structure closely
- Incorporate research findings naturally
- Use clear, engaging language
- Include specific examples and actionable insights
- Add section headings for readability
- End with a strong call-to-action
- Optimize for LinkedIn (professional but engaging)

Write the complete article now:`,
      temperature: 0.7,
      maxTokens: 2500,
    });

    return {
      topic,
      tone,
      content: result.text,
      wordCount: result.text.split(/\s+/).length,
      timestamp: new Date().toISOString(),
    };
  },
});

// Main Article Generation Workflow
async function generateArticle(topic, options = {}) {
  const {
    focus = 'practical insights and best practices',
    targetLength = 'medium',
    tone = 'professional',
  } = options;

  console.log(`\n=== Article Generation Started ===`);
  console.log(`Topic: ${topic}`);
  console.log(`Focus: ${focus}`);
  console.log(`Length: ${targetLength}`);
  console.log(`Tone: ${tone}\n`);

  try {
    // Step 1: Research
    console.log('Step 1/3: Researching topic...');
    const researchResult = await researchTool.execute({ topic, focus });
    console.log(`✓ Research completed (${researchResult.findings.length} chars)\n`);

    // Step 2: Create Outline
    console.log('Step 2/3: Creating outline...');
    const outlineResult = await outlineTool.execute({
      topic,
      research: researchResult.findings,
      targetLength,
    });
    console.log(`✓ Outline completed\n`);

    // Step 3: Write Article
    console.log('Step 3/3: Writing article...');
    const articleResult = await writeTool.execute({
      topic,
      outline: outlineResult.outline,
      research: researchResult.findings,
      tone,
    });
    console.log(`✓ Article completed (${articleResult.wordCount} words)\n`);

    console.log('=== Article Generation Complete ===\n');

    return {
      success: true,
      article: {
        topic,
        focus,
        targetLength,
        tone,
        research: researchResult.findings,
        outline: outlineResult.outline,
        content: articleResult.content,
        wordCount: articleResult.wordCount,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Article generation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  researchTool,
  outlineTool,
  writeTool,
  generateArticle,
};
