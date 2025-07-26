'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import * as monaco from 'monaco-editor';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
});

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
  onLanguageChange: (language: string) => void;
  theme?: 'vs-dark' | 'light';
  readOnly?: boolean;
  className?: string;
}

// Supported languages with their Monaco identifiers
const SUPPORTED_LANGUAGES = [
  { label: 'JavaScript', value: 'javascript', extension: 'js' },
  { label: 'TypeScript', value: 'typescript', extension: 'ts' },
  { label: 'Python', value: 'python', extension: 'py' },
  { label: 'Java', value: 'java', extension: 'java' },
  { label: 'C++', value: 'cpp', extension: 'cpp' },
  { label: 'C#', value: 'csharp', extension: 'cs' },
  { label: 'Go', value: 'go', extension: 'go' },
  { label: 'Rust', value: 'rust', extension: 'rs' },
];

// Language templates for quick start
const LANGUAGE_TEMPLATES = {
  javascript: `// Write your JavaScript solution here
function solution() {
    // Your code here
    return result;
}

// Example usage:
console.log(solution());`,
  
  typescript: `// Write your TypeScript solution here
function solution(): any {
    // Your code here
    return result;
}

// Example usage:
console.log(solution());`,
  
  python: `# Write your Python solution here
def solution():
    # Your code here
    return result

# Example usage:
if __name__ == "__main__":
    print(solution())`,
  
  java: `// Write your Java solution here
public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        // Your code here
    }
    
    public Object solution() {
        // Your code here
        return result;
    }
}`,
  
  cpp: `// Write your C++ solution here
#include <iostream>
#include <vector>
#include <string>

using namespace std;

class Solution {
public:
    // Your code here
    auto solution() {
        // Your implementation
        return result;
    }
};

int main() {
    Solution sol;
    // Test your solution
    return 0;
}`,
  
  csharp: `// Write your C# solution here
using System;
using System.Collections.Generic;

public class Solution 
{
    public static void Main() 
    {
        Solution sol = new Solution();
        // Your code here
    }
    
    public object SolutionMethod() 
    {
        // Your code here
        return result;
    }
}`,
  
  go: `// Write your Go solution here
package main

import "fmt"

func solution() interface{} {
    // Your code here
    return result
}

func main() {
    fmt.Println(solution())
}`,
  
  rust: `// Write your Rust solution here
fn solution() -> i32 {
    // Your code here
    result
}

fn main() {
    println!("{}", solution());
}`
};

export default function CodeEditor({
  language,
  value,
  onChange,
  onLanguageChange,
  theme = 'vs-dark',
  readOnly = false,
  className = ''
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 1024, height: 768 });

  // Handle window dimensions for SSR
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateDimensions = () => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };
      
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    console.log('Monaco editor mounted. ReadOnly status:', readOnly);

    // Enhanced editor options
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'JetBrains Mono, Monaco, Consolas, "Courier New", monospace',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: false, // Force readOnly to false for debugging
      cursorStyle: 'line',
      mouseWheelZoom: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      }
    });

    // Focus the editor to ensure it's ready for input
    setTimeout(() => {
      editor.focus();
    }, 100);

    // Add custom key bindings for code execution
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // Trigger code execution
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('executeCode'));
      }
    });

    // Add custom key bindings for code submission
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      // Trigger code submission
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('submitCode'));
      }
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    // Get template for new language
    const template = LANGUAGE_TEMPLATES[newLanguage as keyof typeof LANGUAGE_TEMPLATES] || '';
    
    // If current editor is empty or contains only template, switch to new template
    if (!value || Object.values(LANGUAGE_TEMPLATES).includes(value)) {
      onChange(template);
    }
    
    onLanguageChange(newLanguage);
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const insertTemplate = () => {
    const template = LANGUAGE_TEMPLATES[language as keyof typeof LANGUAGE_TEMPLATES];
    if (template) {
      onChange(template);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Language:</label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={readOnly}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={formatCode}
              disabled={readOnly || !isEditorReady}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              title="Format Code (Alt+Shift+F)"
            >
              Format
            </button>
            <button
              onClick={insertTemplate}
              disabled={readOnly}
              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              title="Insert Template"
            >
              Template
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="text-xs text-gray-400">
          <span className="mr-4">⌘+Enter: Run Code</span>
          <span>⌘+Shift+Enter: Submit</span>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          value={value}
          theme={theme}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            lineHeight: 20,
            fontFamily: 'JetBrains Mono, Monaco, Consolas, "Courier New", monospace',
            minimap: { enabled: windowDimensions.width > 1024 }, // Disable minimap on smaller screens
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false, // Force readOnly to false for debugging
            cursorStyle: 'line',
            mouseWheelZoom: true,
            padding: { top: 16, bottom: 16 },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: 'allDocuments',
            // Mobile optimizations
            glyphMargin: false,
            folding: windowDimensions.width > 768,
            overviewRulerLanes: windowDimensions.width > 768 ? 3 : 0,
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
        />
      </div>
    </div>
  );
} 
