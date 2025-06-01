import { config } from 'dotenv';
config();

import '@/ai/flows/generate-ollama-response.ts';
import '@/ai/flows/maintain-chat-context.ts';