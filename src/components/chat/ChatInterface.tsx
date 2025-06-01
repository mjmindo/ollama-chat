"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage, { type ChatMessageProps } from '@/components/chat/ChatMessage';
import { maintainChatContext, type MaintainChatContextInput, type MaintainChatContextOutput } from '@/ai/flows/maintain-chat-context';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Message extends ChatMessageProps {
  id: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentMessageContent = inputValue.trim();
    if (!currentMessageContent) return;

    const newUserMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: currentMessageContent,
    };

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const chatHistoryForAI: MaintainChatContextInput['chatHistory'] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      const aiResponse: MaintainChatContextOutput = await maintainChatContext({
        message: currentMessageContent,
        chatHistory: chatHistoryForAI,
      });

      if (aiResponse && aiResponse.updatedChatHistory) {
        const updatedMessagesWithIds: Message[] = aiResponse.updatedChatHistory.map(msg => ({
          ...msg,
          id: Math.random().toString(36).substring(7) // Add client-side ID
        }));
        setMessages(updatedMessagesWithIds);
      } else {
         throw new Error("AI response format is invalid or empty.");
      }

    } catch (error) {
      console.error("Error communicating with AI:", error);
      toast({
        title: "Error",
        description: "Failed to get response from Ollama. Please check your Ollama setup and try again.",
        variant: "destructive",
      });
      // Optionally, add back the user message if AI fails and we revert state, or keep it.
      // For simplicity, we keep the user message and show an error.
      // If you want to remove the user message on error:
      // setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newUserMessage.id));
    } finally {
      setIsLoading(false);
       setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="flex flex-col flex-grow h-[calc(100vh-var(--header-height))]">
      <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map(msg => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}
          {isLoading && (
            <div className="flex items-end gap-3 justify-start w-full">
                <ChatMessage role="model" content="Thinking..." />
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 md:p-6 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-4">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message to Ollama..."
            className="flex-grow resize-none min-h-[40px] max-h-[120px] text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as unknown as FormEvent<HTMLFormElement>);
              }
            }}
            disabled={isLoading}
            aria-label="Chat message input"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()} size="lg" aria-label="Send message">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
