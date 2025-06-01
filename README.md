This project is a Next.js application that provides a web-based chat interface. Users can select from a list of available Ollama language models and engage in conversations. The chat history is persisted in the browser's local storage.

Key features include:

Chat Interface: A user-friendly interface for sending and receiving messages.
Ollama Model Integration: Dynamically fetches and allows selection of Ollama models via an API endpoint (/api/ollama-models).
AI Interaction: Leverages Genkit flows (specifically maintain-chat-context) for managing chat context and generating AI responses.
Local Storage: Saves chat history and selected model preferences locally in the user's browser.
UI Components: Built with Shadcn UI components.