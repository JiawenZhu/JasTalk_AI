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
import { CreditValidation } from '@/components/ui/credit-validation';
import GeneratingQuestionsModal from '@/components/GeneratingQuestionsModal';
import UploadGuideTour from '@/components/UploadGuideTour';


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
  const [dragActive, setDragActive] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [showQuestionConfig, setShowQuestionConfig] = useState(false);
  const [showMoreTemplates, setShowMoreTemplates] = useState(false);
  const [interviewDifficulty, setInterviewDifficulty] = useState('medium');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [showGuideTour, setShowGuideTour] = useState(false);

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

  useEffect(() => {
    // Check if this is the user's first time on the upload page
    const hasSeenUploadGuide = localStorage.getItem('hasSeenUploadGuide');
    if (!hasSeenUploadGuide) {
      // Show the guide tour after a short delay
      setTimeout(() => {
        setShowGuideTour(true);
      }, 1000);
    }
  }, []);

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

    // Show the modal instead of setting isProcessing
    setShowGeneratingModal(true);
    
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

        // The modal will handle the redirect after completion
      } else {
        const errorData = await response.json();
        
        // Hide modal on error
        setShowGeneratingModal(false);
        
        if (response.status === 402) {
          // Insufficient credits error
          toast({
            title: "Insufficient Credits",
            description: "You don't have enough credits to generate questions. Please add credits to continue.",
            variant: "destructive",
          });
          // Redirect to premium page to add credits
          setTimeout(() => {
            router.push('/premium?insufficient-credits=true');
          }, 2000);
        } else {
          toast({
            title: "Error",
            description: errorData.error || "Failed to generate questions. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      // Hide modal on error
      setShowGeneratingModal(false);
      toast({
        title: "Error",
        description: "An error occurred while generating questions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canGenerateQuestions = uploadedFiles.length > 0 || textContent.trim().length > 0;

  const handleModalComplete = () => {
    setShowGeneratingModal(false);
    // Navigate to the practice page after modal completes
    router.push(`/practice/new?difficulty=${interviewDifficulty}`);
  };

  const handleGuideTourComplete = () => {
    setShowGuideTour(false);
    // Mark that the user has seen the guide
    localStorage.setItem('hasSeenUploadGuide', 'true');
  };

  const handleGuideTourClose = () => {
    setShowGuideTour(false);
    // Mark that the user has seen the guide
    localStorage.setItem('hasSeenUploadGuide', 'true');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CreditValidation action="create-questions">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Upload Your Job Description
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get personalized interview questions based on your job description. 
                Our AI will analyze the requirements and generate relevant questions to help you prepare.
              </p>
      </div>

            {/* Mode Selection */}
            <div id="mode-selection" className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 ${
                    activeTab === 'text'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📝 Text Input
          </button>
          <button
            onClick={() => setActiveTab('file')}
                  className={`flex-1 py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 ${
              activeTab === 'file'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📄 File Upload
                </button>
              </div>

                            {/* Text Input Mode */}
              {activeTab === 'text' && (
                <div className="space-y-6">
                  <div id="job-description">
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Job Description
                    </label>
                    <textarea
                      ref={textareaRef}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste your job description here... Include requirements, responsibilities, and any specific skills or experience needed."
                      className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-100 transition-all duration-300 resize-none"
                    />
                  </div>

                  <div id="question-config" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-lg font-semibold text-gray-800 mb-3">
                        Number of Questions
                      </label>
                      <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      >
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                        <option value={20}>20 Questions</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-gray-800 mb-3">
                        Interview Type
                      </label>
                      <select
                        value={interviewDifficulty}
                        onChange={(e) => setInterviewDifficulty(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Templates Section */}
                  <div id="quick-templates" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">Quick Templates</h3>
                      <button
                        onClick={() => setShowMoreTemplates(!showMoreTemplates)}
                        className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
                      >
                        {showMoreTemplates ? 'Show Less' : 'Show More'}
          </button>
                    </div>
                    
                    {/* Initial 4 Templates */}
                    <div className="grid grid-cols-2 gap-3">
                      {['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer'].map((template) => (
          <button
                          key={template}
                          onClick={() => {
                            setTextContent(templateDescriptions[template as keyof typeof templateDescriptions] || '');
                            setSelectedTemplate(template);
                          }}
                          className={`p-4 text-left border-2 rounded-xl transition-all duration-200 ${
                            selectedTemplate === template
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-semibold text-sm">{template}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {template === 'Software Engineer' && 'Full-stack development, algorithms, system design'}
                            {template === 'Product Manager' && 'Product strategy, user research, roadmap planning'}
                            {template === 'Data Scientist' && 'Machine learning, statistical analysis, data modeling'}
                            {template === 'UX Designer' && 'User research, wireframing, prototyping'}
                          </div>
          </button>
                      ))}
      </div>

                    {/* Additional Templates (Hidden by default) */}
                    {showMoreTemplates && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            'Marketing Manager', 'Sales Representative', 'HR Specialist', 'Financial Analyst',
                            'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Mobile Developer',
                            'QA Engineer', 'Business Analyst', 'Project Manager', 'UI Designer'
                          ].map((template) => (
                            <button
                              key={template}
                              onClick={() => {
                                setTextContent(templateDescriptions[template as keyof typeof templateDescriptions] || '');
                                setSelectedTemplate(template);
                              }}
                              className={`p-3 text-left border-2 rounded-lg transition-all duration-200 ${
                                selectedTemplate === template
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="font-semibold text-sm">{template}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {template === 'Marketing Manager' && 'Digital marketing, brand strategy, campaign management'}
                                {template === 'Sales Representative' && 'Lead generation, client relationships, sales techniques'}
                                {template === 'HR Specialist' && 'Recruitment, employee relations, HR policies'}
                                {template === 'Financial Analyst' && 'Financial modeling, budgeting, investment analysis'}
                                {template === 'DevOps Engineer' && 'CI/CD, cloud infrastructure, automation'}
                                {template === 'Frontend Developer' && 'React, Vue, responsive design, user experience'}
                                {template === 'Backend Developer' && 'Node.js, databases, API development, scalability'}
                                {template === 'Mobile Developer' && 'iOS, Android, cross-platform development'}
                                {template === 'QA Engineer' && 'Testing strategies, automation, quality assurance'}
                                {template === 'Business Analyst' && 'Requirements gathering, process improvement, stakeholder management'}
                                {template === 'Project Manager' && 'Agile methodologies, team leadership, risk management'}
                                {template === 'UI Designer' && 'Visual design, design systems, user interface'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
            </div>

            <motion.button
                    id="generate-button"
                    onClick={handleGenerateQuestions}
                    disabled={!canGenerateQuestions}
                    className={`w-full py-4 px-8 rounded-xl text-xl font-bold text-white transition-all duration-300 ${
                      canGenerateQuestions
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={!canGenerateQuestions ? {} : { scale: 1.02 }}
                    whileTap={!canGenerateQuestions ? {} : { scale: 0.98 }}
                  >
                    Generate {questionCount} Interview Questions
            </motion.button>
          </div>
        )}

              {/* File Upload Mode */}
        {activeTab === 'file' && (
                <div className="space-y-6">
                  <div id="job-description">
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Upload Job Description File
                    </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-300"
                    >
            <input
              ref={fileInputRef}
              type="file"
                        accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer block"
                      >
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-lg text-gray-600 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF, DOC, DOCX, or TXT files accepted
                        </p>
                      </label>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800">
                          ✅ File uploaded: {uploadedFiles.map(f => f.name).join(', ')}
                        </p>
          </div>
        )}
            </div>

                  <div id="question-config" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-lg font-semibold text-gray-800 mb-3">
                        Number of Questions
                      </label>
                      <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      >
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                        <option value={20}>20 Questions</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-gray-800 mb-3">
                        Interview Type
                      </label>
                      <select
                        value={interviewDifficulty}
                        onChange={(e) => setInterviewDifficulty(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-blue-500 focus:ring-blue-100 transition-all duration-300"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
              </div>
            </div>

                  {/* Quick Templates Section for File Upload */}
                  <div id="quick-templates" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">Quick Templates</h3>
                      <button
                        onClick={() => setShowMoreTemplates(!showMoreTemplates)}
                        className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
                      >
                        {showMoreTemplates ? 'Show Less' : 'Show More'}
                      </button>
                    </div>
                    
                    {/* Initial 4 Templates */}
                    <div className="grid grid-cols-2 gap-3">
                {['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer'].map((template) => (
                  <button
                    key={template}
                          onClick={() => {
                            setTextContent(templateDescriptions[template as keyof typeof templateDescriptions] || '');
                            setSelectedTemplate(template);
                          }}
                          className={`p-4 text-left border-2 rounded-xl transition-all duration-200 ${
                            selectedTemplate === template
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-semibold text-sm">{template}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {template === 'Software Engineer' && 'Full-stack development, algorithms, system design'}
                            {template === 'Product Manager' && 'Product strategy, user research, roadmap planning'}
                            {template === 'Data Scientist' && 'Machine learning, statistical analysis, data modeling'}
                            {template === 'UX Designer' && 'User research, wireframing, prototyping'}
                          </div>
                  </button>
                ))}
              </div>
                    
                    {/* Additional Templates (Hidden by default) */}
                    {showMoreTemplates && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            'Marketing Manager', 'Sales Representative', 'HR Specialist', 'Financial Analyst',
                            'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Mobile Developer',
                            'QA Engineer', 'Business Analyst', 'Project Manager', 'UI Designer'
                          ].map((template) => (
                            <button
                              key={template}
                              onClick={() => {
                                setTextContent(templateDescriptions[template as keyof typeof templateDescriptions] || '');
                                setSelectedTemplate(template);
                              }}
                              className={`p-3 text-left border-2 rounded-lg transition-all duration-200 ${
                                selectedTemplate === template
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="font-semibold text-sm">{template}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {template === 'Marketing Manager' && 'Digital marketing, brand strategy, campaign management'}
                                {template === 'Sales Representative' && 'Lead generation, client relationships, sales techniques'}
                                {template === 'HR Specialist' && 'Recruitment, employee relations, HR policies'}
                                {template === 'Financial Analyst' && 'Financial modeling, budgeting, investment analysis'}
                                {template === 'DevOps Engineer' && 'CI/CD, cloud infrastructure, automation'}
                                {template === 'Frontend Developer' && 'React, Vue, responsive design, user experience'}
                                {template === 'Backend Developer' && 'Node.js, databases, API development, scalability'}
                                {template === 'Mobile Developer' && 'iOS, Android, cross-platform development'}
                                {template === 'QA Engineer' && 'Testing strategies, automation, quality assurance'}
                                {template === 'Business Analyst' && 'Requirements gathering, process improvement, stakeholder management'}
                                {template === 'Project Manager' && 'Agile methodologies, team leadership, risk management'}
                                {template === 'UI Designer' && 'Visual design, design systems, user interface'}
                              </div>
                            </button>
                          ))}
                    </div>
                      </motion.div>
                    )}
                  </div>
                  
                  <motion.button
                    id="generate-button"
                    onClick={handleGenerateQuestions}
                    disabled={!canGenerateQuestions}
                    className={`w-full py-4 px-8 rounded-xl text-xl font-bold text-white transition-all duration-300 ${
                      canGenerateQuestions
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={!canGenerateQuestions ? {} : { scale: 1.02 }}
                    whileTap={!canGenerateQuestions ? {} : { scale: 0.98 }}
                  >
                    Generate {questionCount} Questions from File
                  </motion.button>
                  </div>
              )}
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Targeted Questions</h3>
                <p className="text-gray-600">Questions specifically tailored to your job requirements</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Instant Generation</h3>
                <p className="text-gray-600">Get your questions in seconds, not hours</p>
          </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl mb-4">🎭</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Multiple Formats</h3>
                <p className="text-gray-600">Behavioral, technical, and general questions</p>
              </div>
            </div>
          </CreditValidation>
        </div>
      </div>

      {/* Generating Questions Modal */}
      <GeneratingQuestionsModal
        isVisible={showGeneratingModal}
        questionCount={questionCount}
        onComplete={handleModalComplete}
      />

      {/* Upload Guide Tour */}
      <UploadGuideTour
        isVisible={showGuideTour}
        onComplete={handleGuideTourComplete}
        onClose={handleGuideTourClose}
      />
    </div>
  );
} 

export default UploadContent;
