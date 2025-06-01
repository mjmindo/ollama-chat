This project is a Next.js application that provides a web-based chat interface. Users can select from a list of available Ollama language models and engage in conversations. The chat history is persisted in the browser's local storage.

Key features include:

*   **Chat Interface**: A user-friendly interface for sending and receiving messages.
*   **Ollama Model Integration**: Dynamically fetches and allows selection of Ollama models via an API endpoint (`/api/ollama-models`).
*   **AI Interaction**: Leverages Genkit flows (specifically `maintain-chat-context`) for managing chat context and generating AI responses.
*   **Local Storage**: Saves chat history and selected model preferences locally in the user's browser.
*   **UI Components**: Built with Shadcn UI components.

To get started with the chat functionality, navigate to the main page of the application where the `ChatInterface` component is rendered. The primary chat logic can be found in `src/components/chat/ChatInterface.tsx`.

## Running the Project

To run this project locally, you'll need to have Node.js and npm (or yarn/pnpm) installed.

1.  **Install Dependencies:**
    Open your terminal in the project root directory and run:
    ```bash
    npm install
    ```
    (or `yarn install` or `pnpm install`)

2.  **Run the Genkit Development Server:**
    The AI functionalities are powered by Genkit. Start the Genkit development server in a separate terminal:
    ```bash
    npm run genkit:dev
    ```
    Alternatively, if you want Genkit to automatically restart when you make changes to the AI flows (in `src/ai/`), use:
    ```bash
    npm run genkit:watch
    ```

3.  **Run the Next.js Development Server:**
    In another terminal, start the Next.js development server:
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:9002`.

4.  **Open in Browser:**
    Open your web browser and navigate to `http://localhost:9002` (or the port shown in your terminal) to see the application.

Now you should have both the Next.js frontend and the Genkit AI backend running, allowing the chat interface to function correctly.