'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Code2, ArrowRight } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">JasTalk AI Demo Center</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience our AI-powered interview platform with interactive demos
            </p>
          </div>
        </div>
      </div>

      {/* Demo Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Voice Demo Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mic className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Voice Demo</CardTitle>
                  <CardDescription>
                    Interactive voice conversation with AI
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Experience real-time voice interaction with our AI assistant. 
                Try the "Play Response" feature to hear AI responses spoken aloud.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Real-time speech synthesis</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Voice input recognition</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Interactive chat interface</span>
                </div>
              </div>

              <Link href="/voice-demo">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Try Voice Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Coding Demo Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Code2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Coding Demo</CardTitle>
                  <CardDescription>
                    AI-powered coding interview with voice feedback
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Practice coding problems with real-time AI feedback. 
                Includes voice interaction and intelligent code analysis.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Monaco code editor</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Voice agent integration</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time code analysis</span>
                </div>
              </div>

              <Link href="/coding-demo">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Try Coding Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What's New?
            </h3>
            <p className="text-gray-600 mb-4">
              Our Voice Demo now features working "Play Response" functionality using 
              the Web Speech API. Click the play button next to any AI message to hear it spoken aloud.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>✅ Speech Synthesis</span>
              <span>✅ Voice Recognition</span>
              <span>✅ Real-time Interaction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
