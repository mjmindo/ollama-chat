// src/ai/flows/generate-ollama-response.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating responses from a local Ollama model.
 *
 * - generateOllamaResponse - A function that sends a message to Ollama and returns the AI's response.
 * - GenerateOllamaResponseInput - The input type for the generateOllamaResponse function.
 * - GenerateOllamaResponseOutput - The return type for the generateOllamaResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOllamaResponseInputSchema = z.object({
  message: z.string().describe('The message to send to the Ollama model.'),
  chatHistory: z.array(z.object({role: z.string(), content: z.string()})).optional().describe('Previous messages in the chat.'),
});
export type GenerateOllamaResponseInput = z.infer<typeof GenerateOllamaResponseInputSchema>;

const GenerateOllamaResponseOutputSchema = z.object({
  response: z.string().describe('The response from the Ollama model.'),
});
export type GenerateOllamaResponseOutput = z.infer<typeof GenerateOllamaResponseOutputSchema>;

export async function generateOllamaResponse(input: GenerateOllamaResponseInput): Promise<GenerateOllamaResponseOutput> {
  return generateOllamaResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ollamaResponsePrompt',
  input: {schema: GenerateOllamaResponseInputSchema},
  output: {schema: GenerateOllamaResponseOutputSchema},
  prompt: `You are a helpful AI assistant.  Respond to the user's message below. Take into account the chat history to maintain context.

Chat History:
{{#each chatHistory}}
  {{this.role}}: {{this.content}}
{{/each}}

User Message: {{{message}}}`,
});

const generateOllamaResponseFlow = ai.defineFlow(
  {
    name: 'generateOllamaResponseFlow',
    inputSchema: GenerateOllamaResponseInputSchema,
    outputSchema: GenerateOllamaResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
