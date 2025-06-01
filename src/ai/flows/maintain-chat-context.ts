'use server';

/**
 * @fileOverview An AI agent that maintains chat context for a more natural conversation.
 *
 * - maintainChatContext - A function that handles the chat context maintenance.
 * - MaintainChatContextInput - The input type for the maintainChatContext function.
 * - MaintainChatContextOutput - The return type for the maintainChatContext function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MaintainChatContextInputSchema = z.object({
  message: z.string().describe('The current message from the user.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('The chat history between the user and the model.'),
  modelName: z.string().optional().describe('The specific Ollama model to use (e.g., ollama/llama2, ollama/mistral). If not provided, defaults to ollama/llama2.'),
});
export type MaintainChatContextInput = z.infer<typeof MaintainChatContextInputSchema>;

// No output schema needed since we're using text format

const MaintainChatContextOutputSchema = z.object({
  response: z.string().describe('The response from the model.'),
  updatedChatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The updated chat history including the latest message and response.'),
});
export type MaintainChatContextOutput = z.infer<typeof MaintainChatContextOutputSchema>;

export async function maintainChatContext(input: MaintainChatContextInput): Promise<MaintainChatContextOutput> {
  return maintainChatContextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'maintainChatContextPrompt',
  input: {schema: MaintainChatContextInputSchema},
  output: {format: 'text'}, // Remove schema since we're using text format
  config: (input: MaintainChatContextInput) => ({ // Explicitly type input
    model: input.modelName || 'ollama/gemma3:1b ', // Default to gemma3:1b  if not provided
  }),
  prompt: `You are a helpful AI assistant. Respond to the user message, taking into account the chat history to provide contextually relevant responses.
IMPORTANT: Your response must be plain text only. Do not wrap your response in JSON. Do not output any schema definitions or JSON formatting.

Chat History:
{{#each chatHistory}}
{{this.role}}: {{this.content}}
{{/each}}

User Message: {{message}}

Assistant's Plain Text Response:`,
});

const maintainChatContextFlow = ai.defineFlow(
  {
    name: 'maintainChatContextFlow',
    inputSchema: MaintainChatContextInputSchema,
    outputSchema: MaintainChatContextOutputSchema,
  },
  async (input: MaintainChatContextInput): Promise<MaintainChatContextOutput> => { // Explicitly type input and return
    const {message, chatHistory = []} = input;
    // The prompt will use the model specified in its config, which is now dynamic based on input.modelName
    const {output} = await prompt(input); // 'output' is now a plain string

    let responseText: string;
    // Debug: Log the output type and value
    console.log('Debug - Output type:', typeof output);
    console.log('Debug - Output value:', output);
    
    // Check if output is a non-empty string
    if (typeof output === 'string' && output.trim().length > 0) {
      responseText = output.trim();
    } else if (typeof output === 'string') {
      // Handle empty string case
      console.warn('Model output was an empty string');
      responseText = "I'm sorry, I was unable to generate a response at this moment.";
    } else {
      // Handle cases where output is null or not a string
      console.warn('Model output was null or invalid. Type:', typeof output, 'Received:', output);
      responseText = "I'm sorry, I was unable to generate a response at this moment."; // Provide a fallback response
    }

    const updatedChatHistory = [...chatHistory, {role: 'user' as const, content: message}, {role: 'model' as const, content: responseText}]; // Add 'as const' for role

    return {response: responseText, updatedChatHistory};
  }
);
