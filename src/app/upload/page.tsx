"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { motion } from "framer-motion";

// Client component; avoid server-only config exports

// Add custom slider styles
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #2563eb;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #2563eb;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

function UploadContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  
  const [activeTab, setActiveTab] = useState<'camera' | 'file' | 'text'>(
    mode === 'text' ? 'text' : 'camera'
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [textContent, setTextContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [showQuestionConfig, setShowQuestionConfig] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (activeTab === 'text' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeTab]);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileUpload(files);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleGenerateQuestions = async () => {
    if ((uploadedFiles.length === 0 && !textContent.trim()) || isProcessing) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Get the content to analyze (text content or file content)
      const contentToAnalyze = textContent.trim() || 'Job description from uploaded files';
      
      // Call the AI question generation API
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: contentToAnalyze,
          questionCount: questionCount,
          interviewType: 'mixed', // Default to mixed for now
          difficulty: 'medium', // Default to medium for now
          focusAreas: ['programming', 'problem-solving', 'system-design']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      
      // Store the generated questions and job description in localStorage for the questions page
      localStorage.setItem('generatedQuestions', JSON.stringify(data.questions));
      localStorage.setItem('questionConfig', JSON.stringify({
        questionCount,
        interviewType: 'mixed',
        difficulty: 'medium',
        focusAreas: ['programming', 'problem-solving', 'system-design']
      }));
      localStorage.setItem('jobDescription', contentToAnalyze);
      
      // Navigate to question generation page
      router.push('/questions/generate');
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canGenerateQuestions = uploadedFiles.length > 0 || textContent.trim().length > 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx>{sliderStyles}</style>
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Upload Document</h1>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'camera'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CameraIcon className="w-5 h-5 mx-auto mb-1" />
            Camera
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'file'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PhotoIcon className="w-5 h-5 mx-auto mb-1" />
            Files
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DocumentTextIcon className="w-5 h-5 mx-auto mb-1" />
            Text
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Take a Photo
              </h2>
              <p className="text-gray-600 mb-6">
                Capture job descriptions, documents, or any text you want to practice with
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => cameraInputRef.current?.click()}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl shadow-lg flex items-center justify-center space-x-3"
            >
              <CameraIcon className="w-6 h-6" />
              <span className="font-semibold">Open Camera</span>
            </motion.button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
          </div>
        )}

        {/* File Tab */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Files
              </h2>
              <p className="text-gray-600 mb-6">
                Upload PDFs, Word docs, or any file with job descriptions
              </p>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop files here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, Word, Excel, PowerPoint, and text files
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.html"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Text Tab */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Paste Job Description
              </h2>
              <p className="text-gray-600 mb-6">
                Copy and paste job descriptions from Indeed, LinkedIn, or any source
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste your job description here...&#10;&#10;Example:&#10;We are looking for a Software Engineer to join our team. The ideal candidate will have experience with React, Node.js, and cloud technologies..."
                className="w-full h-48 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <div className="flex justify-between text-sm text-gray-500">
                <span>{textContent.length} characters</span>
                <span>{textContent.split(/\s+/).filter(word => word.length > 0).length} words</span>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Quick Templates</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer'].map((template) => (
                  <button
                    key={template}
                    onClick={() => setTextContent(`Job Title: ${template}\n\nWe are seeking a ${template} to join our dynamic team...`)}
                    className="p-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Uploaded Files</h3>
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <DocumentTextIcon className="w-10 h-10 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Question Configuration */}
        {canGenerateQuestions && (
          <div className="pt-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Question Settings</h3>
                <button
                  onClick={() => setShowQuestionConfig(!showQuestionConfig)}
                  className="text-blue-600 text-sm font-medium"
                >
                  {showQuestionConfig ? 'Hide' : 'Customize'}
                </button>
              </div>
              
              {showQuestionConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Question Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Questions: {questionCount}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>• Questions will be generated based on your job description</p>
                    <p>• Mix of technical, behavioral, and system design questions</p>
                    <p>• Difficulty level: Medium (can be adjusted on next page)</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Generate Questions Button */}
        <div className="pt-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateQuestions}
            disabled={!canGenerateQuestions || isProcessing}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all ${
              canGenerateQuestions && !isProcessing
                ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Questions...</span>
              </div>
            ) : (
              `Generate ${questionCount} Interview Questions`
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Loading...</p></div></div>}>
      <UploadContent />
    </Suspense>
  );
}
