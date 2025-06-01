"use client";

import type { FC } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

export interface ChatMessageProps {
  role: 'user' | 'model';
  content: string;
}

const ChatMessage: FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === 'user';

  return (
    <div className={cn("flex items-end gap-3 w-full", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>
            <Bot className="h-5 w-5 text-accent-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
      <Card className={cn(
        "max-w-[75%] p-0 rounded-lg shadow-md",
        isUser ? "bg-primary text-primary-foreground" : "bg-card border-border"
      )}>
        <CardContent className="p-3 text-sm break-words whitespace-pre-wrap">
          {content}
        </CardContent>
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>
            <User className="h-5 w-5 text-primary-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
