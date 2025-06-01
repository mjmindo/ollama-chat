import ChatInterface from '@/components/chat/ChatInterface';

export default function OllamaChatPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground" style={{ '--header-height': '65px' } as React.CSSProperties}>
      <header className="p-4 border-b shadow-sm sticky top-0 bg-background z-10">
        <h1 className="text-2xl font-headline font-semibold text-center text-primary">
          OllamaChat
        </h1>
      </header>
      <ChatInterface />
    </div>
  );
}
