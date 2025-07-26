'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Message {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
}

export default function VoiceDemoPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      content: "Hi! I'm Lisa, your AI assistant. How can I help you today?",
      timestamp: new Date()
    },
    {
      id: '2',
      role: 'user',
      content: "I'd like to know more about your capabilities.",
      timestamp: new Date()
    },
    {
      id: '3',
      role: 'agent',
      content: "I'm designed to help with sales assistant tasks. I can assist you with various inquiries and provide helpful information. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingMessage, setCurrentPlayingMessage] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const recognition = useRef<any>(null);

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.current = window.speechSynthesis;
    }

    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognition.current) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current) {
      setIsListening(false);
      recognition.current.stop();
    }
  };

  const playResponse = (messageId: string, content: string) => {
    if (!speechSynthesis.current) {
      console.error('Speech synthesis not available');
      return;
    }

    // Stop any currently playing speech
    speechSynthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set voice to a female voice if available
    const voices = speechSynthesis.current.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Lisa') || 
      voice.name.includes('Samantha')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentPlayingMessage(messageId);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentPlayingMessage(null);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setCurrentPlayingMessage(null);
    };

    speechSynthesis.current.speak(utterance);
  };

  const stopPlaying = () => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
      setIsPlaying(false);
      setCurrentPlayingMessage(null);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsAgentTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's a great question! I can help you with that.",
        "I understand what you're asking. Let me explain how I can assist you.",
        "Thanks for sharing that with me. I'm here to help you succeed.",
        "I appreciate your question. Let me provide you with some helpful information.",
        "That's an interesting point. I'd be happy to help you explore that further."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
      setIsAgentTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-6">
            <Mic className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Voice Demo</h1>
          </div>
          
          <p className="text-gray-600 mb-6">
            Try talking to the agent or listen to the conversation.
          </p>

          {/* Chat Messages */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.role === 'agent' && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (isPlaying && currentPlayingMessage === message.id) {
                            stopPlaying();
                          } else {
                            playResponse(message.id, message.content);
                          }
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        {isPlaying && currentPlayingMessage === message.id ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        {isPlaying && currentPlayingMessage === message.id ? 'Pause' : 'Play Response'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isAgentTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Controls */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              className="w-10 h-10"
            >
              <Mic className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or use voice input..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <Button
              onClick={sendMessage}
              disabled={!userInput.trim()}
              className="px-4 py-2"
            >
              Send
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              {isListening && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Listening...</span>
                </div>
              )}
              {isPlaying && (
                <div className="flex items-center space-x-1">
                  <Volume2 className="w-4 h-4" />
                  <span>Playing response...</span>
                </div>
              )}
            </div>
            
            <div className="text-xs">
              {messages.length} messages
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
