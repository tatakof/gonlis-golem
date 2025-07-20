import { streamText } from 'ai';
import { myProvider } from './providers';

const COMPLIANCE_PROMPT = `
You are a compliance checker for a Buddhist Dialectical Debate system. Your job is to analyze AI responses and determine if they follow the strict rules of formal Buddhist debate.

## Rules the AI must follow:

1. **Valid Response Types Only**: 
   - For thesis statements: "I accept" OR "Why?"
   - For reason justification: "I accept" OR "Reason not established" OR "No pervasion"
   - For pervasion statements: "I accept" OR "Why?"
   - For relationship analysis: "I accept" initially, then specific possibilities when asked

2. **Formal Structure**: 
   - Must use prescribed language exactly
   - No explanatory text beyond the required responses
   - Must maintain debate format

3. **Logical Consistency**: 
   - Cannot contradict previous assertions
   - Must respond appropriately to the type of statement presented

## Your Task:
Analyze the AI response and determine:
1. Does it use ONLY the prescribed responses?
2. Does it maintain formal debate structure?
3. Is it appropriate for the type of statement presented?

Respond with:
- "COMPLIANT" if the response follows all rules
- "NON_COMPLIANT: [specific reason]" if it violates any rules

Be strict - any deviation from prescribed responses or addition of explanatory text should be marked NON_COMPLIANT.
`;

export interface ComplianceCheckResult {
  isCompliant: boolean;
  reason?: string;
}

export async function checkCompliance(
  userMessage: string,
  aiResponse: string
): Promise<ComplianceCheckResult> {
  try {
    const { textStream } = streamText({
      model: myProvider.languageModel('chat-model-reasoning'),
      system: COMPLIANCE_PROMPT,
      prompt: `
USER MESSAGE: "${userMessage}"
AI RESPONSE: "${aiResponse}"

Is this AI response compliant with the dialectical debate rules?
`,
      maxTokens: 100,
    });

    let result = '';
    for await (const chunk of textStream) {
      result += chunk;
    }

    const trimmedResult = result.trim();
    
    if (trimmedResult.startsWith('COMPLIANT')) {
      return { isCompliant: true };
    } else if (trimmedResult.startsWith('NON_COMPLIANT:')) {
      const reason = trimmedResult.replace('NON_COMPLIANT:', '').trim();
      return { isCompliant: false, reason };
    } else {
      // Default to non-compliant if unclear
      return { isCompliant: false, reason: 'Unclear compliance status' };
    }
  } catch (error) {
    console.error('Compliance check failed:', error);
    // On error, assume compliant to avoid blocking responses
    return { isCompliant: true };
  }
}

export async function generateCompliantResponse(
  userMessage: string,
  originalResponse: string,
  systemPrompt: string,
  complianceIssue: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const { textStream } = streamText({
      model: myProvider.languageModel('chat-model-reasoning'),
      system: `${systemPrompt}

IMPORTANT: Your previous response was flagged as non-compliant: ${complianceIssue}

You must now provide a response that strictly follows the prescribed format. Use ONLY the exact phrases specified in the system prompt:
- "I accept"
- "Why?"
- "Reason not established"
- "No pervasion"
- "Three possibilities"
- "Four possibilities"
- "Mutually inclusive"
- "Mutually exclusive"

Do not add any explanatory text or deviation from these exact responses.`,
      messages: [
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ],
      maxTokens: 50, // Keep it short to force compliance
    });

    let result = '';
    for await (const chunk of textStream) {
      result += chunk;
    }

    return result.trim();
  } catch (error) {
    console.error('Failed to generate compliant response:', error);
    return 'I accept'; // Fallback to safe response
  }
} 