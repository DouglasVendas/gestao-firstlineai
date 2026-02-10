
import { useState, useEffect } from 'react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const STORAGE_KEY = 'firstline_ai_chat_history';
const EXPIRY_HOURS = 72;

export function useChatHistory(initialMessages: Message[]) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);

    // Load from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const now = new Date();

                // Filter out expired messages
                const validMessages = parsed.filter((msg: any) => {
                    const msgDate = new Date(msg.timestamp);
                    const diffHours = (now.getTime() - msgDate.getTime()) / (1000 * 60 * 60);
                    return diffHours < EXPIRY_HOURS;
                }).map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp) // Re-hydrate Date object
                }));

                if (validMessages.length > 0) {
                    setMessages(validMessages);
                }
            } catch (e) {
                console.error('Failed to parse chat history', e);
            }
        }
    }, []);

    // Save to storage whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    const addMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
    };

    const clearHistory = () => {
        setMessages(initialMessages);
        localStorage.removeItem(STORAGE_KEY);
    };

    return { messages, addMessage, clearHistory, setMessages };
}
