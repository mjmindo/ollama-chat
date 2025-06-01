
import { NextResponse } from 'next/server';
import { config } from 'dotenv';

config(); // Load environment variables from .env

export async function GET() {
  const ollamaServerAddress = process.env.OLLAMA_SERVER_ADDRESS || 'http://localhost:11434';
  const ollamaApiTagsUrl = `${ollamaServerAddress}/api/tags`;

  try {
    const response = await fetch(ollamaApiTagsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data
    });

    if (!response.ok) {
      let errorBody = 'Failed to fetch models from Ollama server.';
      try {
        const errJson = await response.json();
        errorBody = errJson.error || errorBody;
      } catch (e) {
        // Ignore if error response is not JSON
      }
      console.error(`Ollama API error: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json({ error: errorBody, details: `Status: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    
    if (data && Array.isArray(data.models)) {
      const models = data.models.map((model: { name: string; modified_at: string; size: number }) => ({
        // The value should be in the format genkitx-ollama expects: ollama/<model_name_including_tag>
        value: `ollama/${model.name}`, 
        label: model.name, // e.g., "llama2:latest"
      }));
      return NextResponse.json({ models });
    } else {
      console.error('Ollama API response format unexpected:', data);
      return NextResponse.json({ error: 'Unexpected response format from Ollama server.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    let errorMessage = 'Could not connect to Ollama server.';
    if (error instanceof Error && (error as any).code === 'ECONNREFUSED') {
        errorMessage = 'Ollama server is not running or is not accessible at the configured address.';
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 503 });
  }
}
