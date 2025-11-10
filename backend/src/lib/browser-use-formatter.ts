/**
 * Formats LinkedIn post content for Browser-Use step-by-step typing
 * Breaks down text into individual typing commands with single Enter presses
 */
export function formatForBrowserUse(content: string): string {
  // Split content into lines
  const lines = content.trim().split('\n').map(line => line.trim()).filter(Boolean);

  // Build step-by-step instructions
  const steps: string[] = [];

  lines.forEach((line, index) => {
    // Add typing command
    steps.push(`Tippe: "${line}"`);

    // Add single Enter after each line (except last line)
    if (index < lines.length - 1) {
      steps.push('Drücke Enter.');
    }
  });

  return steps.join('\n');
}

/**
 * System prompt for AI to generate Browser-Use compatible LinkedIn posts
 */
export const BROWSER_USE_SYSTEM_PROMPT = `You are a professional LinkedIn content creator. Generate posts in a structured format for automated posting.

IMPORTANT FORMAT RULES:
1. Start with a compelling headline with emojis (1 line)
2. Add opening statement (1-2 lines)
3. If using bullet points, use ✅ emoji before each point
4. End with a call-to-action or question (1 line)
5. ALWAYS end with hashtags on a separate line (5-7 hashtags with #)
6. Use emojis strategically (🤖 ✍️ 💡 🚀 ✅ 💬 etc.)
7. Keep total length 200-300 words
8. Use single line breaks between sections (NOT double)

STRUCTURE:
Line 1: Headline with emoji
Line 2: Opening statement
Line 3-6: Main content (bullet points with ✅ if applicable)
Line 7: Call-to-action
Line 8: #Hashtags #Separated #BySpaces

OUTPUT FORMAT:
Plain text only. Each section on a new line. No markdown, no HTML.`;

/**
 * Generates Browser-Use task instruction with step-by-step typing
 */
export function generateBrowserUseTask(
  linkedinEmail: string,
  linkedinPassword: string,
  formattedContent: string
): string {
  return `Öffne https://www.linkedin.com/feed/.
Klicke in den Post-Composer (div[role="textbox"]).
${formattedContent}
Klicke anschließend auf „Posten".`;
}
