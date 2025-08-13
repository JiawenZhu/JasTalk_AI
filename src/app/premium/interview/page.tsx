"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { 
  Camera, 
  FileText, 
  Type, 
  Play, 
  Sparkles, 
  Clock, 
  Users,
  Brain,
  Code,
  Palette,
  Building2,
  Zap
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: 'technical' | 'behavioral' | 'system-design' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface JobTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const jobTemplates: JobTemplate[] = [
  {
    id: 'software-engineer',
    name: 'Software Engineer',
    icon: <Code className="w-5 h-5" />,
    description: 'Full-stack development, algorithms, system design',
    color: 'from-blue-500 to-purple-600'
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    icon: <Brain className="w-5 h-5" />,
    description: 'Machine learning, statistics, data analysis',
    color: 'from-green-500 to-blue-600'
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Product strategy, user research, roadmap planning',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'ux-designer',
    name: 'UX Designer',
    icon: <Palette className="w-5 h-5" />,
    description: 'User experience, interface design, user research',
    color: 'from-orange-500 to-red-600'
  }
];

export default function PremiumInterviewPage() {
  const [activeTab, setActiveTab] = useState<'text' | 'files' | 'camera'>('text');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      const text = textareaRef.current.value;
      setCharacterCount(text.length);
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    }
  }, [jobDescription]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = jobTemplates.find(t => t.id === templateId);
    if (template) {
      const sampleDescription = `We are looking for a ${template.name} to join our team. The ideal candidate will have experience with modern technologies, strong problem-solving skills, and excellent communication abilities. You will be responsible for collaborating with cross-functional teams, driving innovation, and delivering high-quality solutions that meet business objectives.`;
      setJobDescription(sampleDescription);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job Description Required",
        description: "Please paste a job description before generating questions.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          questionCount: 3,
          interviewType: 'technical',
          difficulty: 'medium',
          focusAreas: ['technical', 'behavioral', 'system-design']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      setQuestions(data.questions || []);
      toast({
        title: "Questions Generated!",
        description: "Your interview questions are ready. Click 'Start Interview Practice' to begin.",
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartPractice = () => {
    if (questions.length === 0) {
      toast({
        title: "No Questions Available",
        description: "Please generate questions before starting practice.",
        variant: "destructive"
      });
      return;
    }
    setIsPracticeMode(true);
    // Navigate to practice session
    window.location.href = `/practice/new?questions=${encodeURIComponent(JSON.stringify(questions))}`;
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'technical': return <Code className="w-4 h-4" />;
      case 'behavioral': return <Users className="w-4 h-4" />;
      case 'system-design': return <Building2 className="w-4 h-4" />;
      case 'coding': return <Code className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Premium Interview Experience
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate personalized interview questions and practice with our advanced AI interviewer
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Tabs */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">Input Method</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="files" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Files
                    </TabsTrigger>
                    <TabsTrigger value="camera" className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Camera
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="mt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Paste Job Description
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Copy and paste job descriptions from Indeed, LinkedIn, or any source
                        </p>
                      </div>
                      
                      <Textarea
                        ref={textareaRef}
                        placeholder="Paste your job description here... Example: We are looking for a Software Engineer to join our team. The ideal candidate will have experience with React, Node.js, and cloud technologies..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="min-h-[200px] resize-none text-sm"
                      />
                      
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{characterCount} characters</span>
                        <span>{wordCount} words</span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="files" className="mt-6">
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Files</h3>
                      <p className="text-gray-600 mb-4">Upload PDF, DOC, or TXT files with job descriptions</p>
                      <Button variant="outline" className="border-dashed">
                        Choose Files
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="camera" className="mt-6">
                    <div className="text-center py-12">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Input</h3>
                      <p className="text-gray-600 mb-4">Take a photo of printed job descriptions or whiteboards</p>
                      <Button variant="outline">
                        Open Camera
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Quick Templates</CardTitle>
                <CardDescription>
                  Select a job role to auto-fill with sample description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {jobTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 ${
                        selectedTemplate === template.id 
                          ? `bg-gradient-to-r ${template.color} text-white border-0` 
                          : 'hover:scale-105'
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      {template.icon}
                      <span className="font-medium text-sm">{template.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="text-center">
              <Button
                onClick={handleGenerateQuestions}
                disabled={isGenerating || !jobDescription.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate 3 Interview Questions
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - Questions Display */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 sticky top-8">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Your Interview Questions</CardTitle>
                <CardDescription>
                  {questions.length > 0 ? `${questions.length} questions generated` : 'No questions yet'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Generate questions to see them here</p>
                  </div>
                ) : (
                  <>
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100"
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant="secondary" className="shrink-0 mt-1">
                            Q{index + 1}
                          </Badge>
                          <div className="flex-1 space-y-2">
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {question.text}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                {getQuestionTypeIcon(question.type)}
                                <span className="capitalize">{question.type.replace('-', ' ')}</span>
                              </div>
                              <span>•</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getDifficultyColor(question.difficulty)}`}
                              >
                                {question.difficulty}
                              </Badge>
                              <span>•</span>
                              <span>{question.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      onClick={handleStartPractice}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Interview Practice
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
