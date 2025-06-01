
"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage, { type ChatMessageProps } from '@/components/chat/ChatMessage';
import { maintainChatContext, type MaintainChatContextInput, type MaintainChatContextOutput } from '@/ai/flows/maintain-chat-context';
import { Send, Loader2, AlertTriangle, DownloadCloud } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from '@/components/ui/skeleton';

interface Message extends ChatMessageProps {
  id: string;
}

interface OllamaModel {
  value: string;
  label: string;
}

const defaultModels: OllamaModel[] = [
  { value: 'ollama/llama2', label: 'Llama 2 (Default Fallback)' },
  { value: 'ollama/mistral', label: 'Mistral (Default Fallback)' },
];

const LOCAL_STORAGE_KEY_HISTORY = 'ollamaChatHistory';
const LOCAL_STORAGE_KEY_MODEL = 'ollamaSelectedModel';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Fetch available models from API
  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      setModelsError(null);
      try {
        const response = await fetch('/api/ollama-models');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch models: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
          // Try to load previously selected model or set to first fetched model
          const storedModel = localStorage.getItem(LOCAL_STORAGE_KEY_MODEL);
          if (storedModel && data.models.some((m: OllamaModel) => m.value === storedModel)) {
            setSelectedModel(storedModel);
          } else {
            setSelectedModel(data.models[0].value);
          }
        } else {
          setAvailableModels(defaultModels);
          setSelectedModel(defaultModels[0].value);
          setModelsError("No models returned from Ollama. Using defaults.");
        }
      } catch (error) {
        console.error("Failed to fetch Ollama models:", error);
        setModelsError(error instanceof Error ? error.message : "An unknown error occurred while fetching models.");
        setAvailableModels(defaultModels);
        setSelectedModel(defaultModels[0].value); // Fallback to default if fetch fails
        toast({
          title: "Model Loading Failed",
          description: `Could not fetch models from Ollama. Using fallback list. Error: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        });
      } finally {
        setModelsLoading(false);
      }
    };
    fetchModels();
  }, [toast]);

  // Load chat history and selected model from localStorage on initial mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
      if (storedHistory) {
        const parsedHistory: Message[] = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          setMessages(parsedHistory);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY_HISTORY); 
        }
      }
      // Selected model is set after fetching, or from localStorage during fetch
    } catch (error) {
      console.error("Failed to load chat history from localStorage:", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY_HISTORY);
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history to localStorage:", error);
      toast({
        title: "Storage Warning",
        description: "Could not save chat history. Your browser's local storage might be full or disabled.",
        variant: "destructive",
      });
    }
  }, [messages, toast]);

  // Save selected model to localStorage
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem(LOCAL_STORAGE_KEY_MODEL, selectedModel);
    }
  }, [selectedModel]);

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
    if (!currentMessageContent || !selectedModel) return;

    const newUserMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: currentMessageContent,
    };

    const updatedMessagesWithUser = [...messages, newUserMessage];
    setMessages(updatedMessagesWithUser);
    setInputValue('');
    setIsLoading(true);

    try {
      const chatHistoryForAI: MaintainChatContextInput['chatHistory'] = messages.map(msg => ({ // Send current `messages` not `updatedMessagesWithUser`
        role: msg.role as 'user' | 'model',
        content: msg.content,
      }));
      
      const aiResponse: MaintainChatContextOutput = await maintainChatContext({
        message: currentMessageContent,
        chatHistory: chatHistoryForAI, // Send history *before* the current user message
        modelName: selectedModel,
      });

      if (aiResponse && aiResponse.updatedChatHistory) {
        setMessages(aiResponse.updatedChatHistory.map(msg => ({...msg, id: Math.random().toString(36).substring(7)})));
      } else if (aiResponse && aiResponse.response) { // Fallback if updatedChatHistory is not returned (older flow version)
         const newAiMessage: Message = {
            id: Math.random().toString(36).substring(7),
            role: 'model',
            content: aiResponse.response,
        };
        setMessages(prev => [...prev, newAiMessage]);
      }
      else {
         throw new Error("AI response format is invalid or empty.");
      }

    } catch (error) {
      console.error("Error communicating with AI:", error);
      toast({
        title: "Error",
        description: `Failed to get response from ${selectedModel}. Please check your Ollama setup and ensure the model is available. Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
      // Revert optimistic update (only the last user message) if AI call fails
      setMessages(messages); 
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const getModelShortName = (modelValue: string | undefined) => {
    if (!modelValue) return "selected model";
    return modelValue.replace(/^ollama\//, '');
  }

  return (
    <div className="flex flex-col flex-grow h-[calc(100vh-var(--header-height))]">
      <div className="p-4 border-b bg-background flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Label htmlFor="model-select" className="text-sm font-medium mb-1 sm:mb-0 shrink-0">
              Chatting with:
            </Label>
            {modelsLoading ? (
              <div className="flex items-center gap-2 w-full sm:w-auto min-w-[200px] md:min-w-[280px]">
                <Skeleton className="h-10 w-full" />
                <DownloadCloud className="h-5 w-5 animate-pulse text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={isLoading || modelsLoading || !!modelsError}
              >
                <SelectTrigger id="model-select" className="w-full sm:w-auto min-w-[200px] md:min-w-[280px]">
                  <SelectValue placeholder="Select a model..." />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
        </div>
        {modelsError && !modelsLoading && (
          <div className="mt-2 text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span>{modelsError} Using fallback models.</span>
          </div>
        )}
      </div>
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
      <div className="p-4 md:p-6 border-t bg-background flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-4">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Type your message to ${getModelShortName(selectedModel)}...`}
            className="flex-grow resize-none min-h-[40px] max-h-[120px] text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading && inputValue.trim() && selectedModel) {
                  handleSendMessage(e as unknown as FormEvent<HTMLFormElement>);
                }
              }
            }}
            disabled={isLoading || modelsLoading || !selectedModel}
            aria-label="Chat message input"
          />
          <Button 
            type="submit" 
            disabled={isLoading || modelsLoading || !selectedModel || !inputValue.trim()} 
            size="lg" 
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

