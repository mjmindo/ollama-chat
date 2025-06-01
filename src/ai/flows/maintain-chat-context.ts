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
});
export type MaintainChatContextInput = z.infer<typeof MaintainChatContextInputSchema>;

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
  output: {schema: MaintainChatContextOutputSchema},
  prompt: `You are a helpful AI assistant. Respond to the user message, taking into account the chat history to provide contextually relevant responses.\n\nChat History:\n{{#each chatHistory}}
{{this.role}}: {{this.content}}\n{{/each}}\n\nUser Message: {{message}}\n\nResponse:`, // Modified here
});

const maintainChatContextFlow = ai.defineFlow(
  {
    name: 'maintainChatContextFlow',
    inputSchema: MaintainChatContextInputSchema,
    outputSchema: MaintainChatContextOutputSchema,
  },
  async input => {
    const {message, chatHistory = []} = input;
    const {output} = await prompt({message, chatHistory});

    const response = output!.response; // Access the response field
    const updatedChatHistory = [...chatHistory, {role: 'user', content: message}, {role: 'model', content: response}];

    return {response, updatedChatHistory}; // Return both response and updatedChatHistory
  }
);
