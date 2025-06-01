
import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/googleai'; // Removed Google AI plugin
import { ollama } from 'genkitx-ollama';
import { config } from 'dotenv';

config(); // Load environment variables from .env

const ollamaServerAddress = process.env.OLLAMA_SERVER_ADDRESS || 'http://localhost:11434';

export const ai = genkit({
  plugins: [
    ollama({
      serverAddress: ollamaServerAddress,
      requestHeaders: {}, // Optional: any custom headers for Ollama requests
    }),
  ],
  model: 'ollama/llama3.2:3b', // Default model
});

