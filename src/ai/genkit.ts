import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { ollama } from 'genkitx-ollama';

export const ai = genkit({
  plugins: [
    googleAI(),
    ollama({
      // This is where you can "path" your localhost for Ollama.
      // Change this if your Ollama instance is running on a different address or port.
      serverAddress: 'http://localhost:11434', 
      requestHeaders: {}, // Optional: any custom headers for Ollama requests
    }),
  ],
  // This default model will be used if a flow/prompt doesn't specify one.
  model: 'googleai/gemini-2.0-flash', 
});
