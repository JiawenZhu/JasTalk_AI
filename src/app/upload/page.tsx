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
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

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
  const [showMoreTemplates, setShowMoreTemplates] = useState(false);
  const [interviewDifficulty, setInterviewDifficulty] = useState('medium');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Enhanced template descriptions with 25-30 words
  const templateDescriptions = {
    'Software Engineer': 'We are seeking a Software Engineer to join our dynamic team. The ideal candidate will have experience with modern technologies, strong problem-solving skills, and excellent communication abilities.',
    'Product Manager': 'We are looking for a Product Manager to lead product development initiatives. The candidate should have experience in agile methodologies, user research, and cross-functional team collaboration.',
    'Data Scientist': 'We are hiring a Data Scientist to analyze complex datasets and drive insights. The ideal candidate will have expertise in statistical analysis, machine learning, and data visualization techniques.',
    'UX Designer': 'We are seeking a UX Designer to create intuitive user experiences. The candidate should have strong design skills, user research experience, and proficiency in modern design tools.',
    'Marketing Manager': 'We are looking for a Marketing Manager to develop and execute marketing strategies. The ideal candidate will have experience in digital marketing, brand management, and campaign optimization.',
    'Sales Representative': 'We are hiring a Sales Representative to drive revenue growth and build client relationships. The candidate should have strong communication skills, sales experience, and a results-driven mindset.',
    'HR Specialist': 'We are seeking an HR Specialist to manage recruitment and employee relations. The ideal candidate will have experience in talent acquisition, HR policies, and employee development programs.',
    'Financial Analyst': 'We are looking for a Financial Analyst to provide financial insights and support decision-making. The candidate should have strong analytical skills, financial modeling experience, and attention to detail.',
    'DevOps Engineer': 'We are hiring a DevOps Engineer to streamline development and deployment processes. The ideal candidate will have experience with cloud platforms, automation tools, and infrastructure management.',
    'Frontend Developer': 'We are seeking a Frontend Developer to build responsive user interfaces. The candidate should have experience with modern frameworks, CSS, and cross-browser compatibility.',
    'Backend Developer': 'We are looking for a Backend Developer to build scalable server-side applications. The ideal candidate will have experience with databases, APIs, and server architecture.',
    'Mobile Developer': 'We are hiring a Mobile Developer to create mobile applications. The candidate should have experience with mobile platforms, app development, and user experience design.',
    'QA Engineer': 'We are seeking a QA Engineer to ensure software quality and reliability. The ideal candidate will have experience in testing methodologies, automation tools, and bug tracking systems.',
    'Business Analyst': 'We are looking for a Business Analyst to bridge business needs and technical solutions. The candidate should have strong analytical skills, business acumen, and stakeholder management experience.',
    'Project Manager': 'We are hiring a Project Manager to lead project delivery and team coordination. The ideal candidate will have experience in project planning, risk management, and stakeholder communication.',
    'UI Designer': 'We are seeking a UI Designer to create visually appealing user interfaces. The candidate should have strong visual design skills, understanding of user experience principles, and proficiency in design software.'
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Allow both authenticated and free users to access this page
    // No authentication redirect needed
  }, []);

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
    if (!canGenerateQuestions) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: textContent || uploadedFiles.map(f => f.name).join(', '),
          questionCount,
          interviewType: 'mixed',
          difficulty: interviewDifficulty,
          focusAreas: ['programming', 'problem-solving', 'system-design']
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Questions generated:', data);

        // Persist generated questions locally for the practice flow
        try {
          localStorage.setItem('generatedQuestions', JSON.stringify(data.questions));
          localStorage.setItem('questionConfig', JSON.stringify({
            questionCount,
            interviewType: 'mixed',
            difficulty: interviewDifficulty,
            focusAreas: ['programming', 'problem-solving', 'system-design']
          }));
        } catch {}

        // Navigate to the practice page (practice/new reads from localStorage)
        router.push(`/practice/new?difficulty=${interviewDifficulty}`);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to generate questions. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: "An error occurred while generating questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const canGenerateQuestions = uploadedFiles.length > 0 || textContent.trim().length > 0;

  // Remove authentication check - allow free users to access
  // if (!isAuthenticated) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

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
      <div className="bg-white border-b relative overflow-hidden">
        <div className="flex relative">
          {/* Liquid Glass Background for Active Tab */}
          <motion.div
            className="absolute inset-0 bg-white/20 backdrop-blur-md border-b-2 border-blue-500/30 rounded-t-lg"
            initial={false}
            animate={{
              x: activeTab === 'camera' ? 0 : activeTab === 'file' ? '33.33%' : '66.66%',
              width: '33.33%'
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          />
          
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-300 relative z-10 ${
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
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-300 relative z-10 ${
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
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-300 relative z-10 ${
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Quick Templates</h3>
                <button
                  onClick={() => setShowMoreTemplates(!showMoreTemplates)}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  {showMoreTemplates ? 'Show Less' : 'Show More'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer'].map((template) => (
                  <button
                    key={template}
                    onClick={() => {
                      setTextContent(templateDescriptions[template as keyof typeof templateDescriptions]);
                      setSelectedTemplate(template);
                    }}
                    className={`p-3 text-sm border rounded-lg text-left transition-colors ${
                      selectedTemplate === template
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {template}
                  </button>
                ))}
              </div>
              
              {/* More Templates */}
              {showMoreTemplates && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {['Marketing Manager', 'Sales Representative', 'HR Specialist', 'Financial Analyst', 'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Mobile Developer', 'QA Engineer', 'Business Analyst', 'Project Manager', 'UI Designer'].map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setTextContent(templateDescriptions[template as keyof typeof templateDescriptions]);
                          setSelectedTemplate(template);
                        }}
                        className={`p-3 text-sm border rounded-lg text-left transition-colors ${
                          selectedTemplate === template
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Interview Difficulty Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg">Interview Difficulty</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { level: 'Easy', description: 'Basic concepts, entry-level questions, fundamental knowledge testing, suitable for beginners and recent graduates.' },
                  { level: 'Medium', description: 'Standard industry questions, practical scenarios, moderate complexity, ideal for mid-level professionals with 2-5 years experience.' },
                  { level: 'Hard', description: 'Advanced problem-solving, complex scenarios, senior-level challenges, designed for experienced professionals and leadership roles.' }
                ].map(({ level, description }) => (
                  <button
                    key={level}
                    onClick={() => setInterviewDifficulty(level.toLowerCase())}
                    className={`p-4 text-left border-2 rounded-xl transition-all duration-200 ${
                      interviewDifficulty === level.toLowerCase()
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-bold text-lg">{level}</div>
                      {interviewDifficulty === level.toLowerCase() && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">{description}</div>
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

export default UploadContent;
