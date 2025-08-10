'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlayIcon, 
  CheckCircleIcon, 
  ChartBarIcon, 
  MicrophoneIcon,
  UserGroupIcon,
  StarIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  CheckIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  DocumentArrowUpIcon,
  DocumentIcon,
  UserIcon,
  SpeakerWaveIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

export default function JasTalkLandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: MicrophoneIcon,
      title: "AI-Powered Interviews",
      description: "Practice with intelligent AI that adapts to your responses and provides real-time feedback.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: ChartBarIcon,
      title: "Performance Analytics",
      description: "Track your progress with detailed insights and identify areas for improvement.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: UserGroupIcon,
      title: "Industry-Specific Questions",
      description: "Practice with questions tailored to your role and company requirements.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure & Private",
      description: "Your practice sessions are completely private and secure.",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "Google",
      content: "JasTalk helped me ace my technical interviews. The AI feedback was incredibly detailed and actionable.",
      rating: 5,
      avatar: "SC",
      companyLogo: "🔍"
    },
    {
      name: "Michael Rodriguez",
      role: "Product Manager",
      company: "Meta",
      content: "The practice sessions felt so realistic. I was much more confident going into my actual interviews.",
      rating: 5,
      avatar: "MR",
      companyLogo: "📘"
    },
    {
      name: "Emily Watson",
      role: "Data Scientist",
      company: "Netflix",
      content: "Finally, an interview prep tool that actually works. The analytics helped me focus on my weak areas.",
      rating: 5,
      avatar: "EW",
      companyLogo: "🎬"
    }
  ];

  const stats = [
    { number: "95%", label: "Success Rate", icon: CheckIcon },
    { number: "10K+", label: "Practice Sessions", icon: MicrophoneIcon },
    { number: "500+", label: "Companies", icon: GlobeAltIcon },
    { number: "4.9/5", label: "User Rating", icon: StarIcon }
  ];

  const benefits = [
    "Real-time AI feedback",
    "Industry-specific questions",
    "Performance analytics",
    "Secure & private sessions",
    "Mobile-friendly interface",
    "24/7 availability"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center space-x-2 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">JasTalk AI</span>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:scale-105">
                  Features
                </a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:scale-105">
                  Testimonials
                </a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:scale-105">
                  Pricing
                </a>
                <Link href="/sign-in" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Sign In
                </Link>
                <Link href="/practice/new" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Start Free Practice
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <SparklesIcon className="w-4 h-4 mr-2" />
              AI-Powered Interview Practice
            </div>
            <h1 className={`text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Master Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Interviews</span>
              <br />
              with AI
            </h1>
            <p className={`text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Practice with intelligent AI interviewers, get real-time feedback, and land your dream job with confidence. 
              Start with $10 free credits.
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 transition-all duration-700 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Link href="/practice/new" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center gap-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Start Free Practice
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link href="/demo" className="border border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-lg">
                <PlayIcon className="w-5 h-5" />
                Watch Demo
              </Link>
            </div>
            
            {/* Stats */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-700 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <stat.icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Practice Anywhere, Anytime
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Access your AI interview practice sessions on any device. Our mobile-optimized interface ensures you can practice your interview skills wherever you are.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckIcon className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 font-medium">Mobile-optimized interface</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckIcon className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 font-medium">Real-time voice conversations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckIcon className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 font-medium">Instant feedback and analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckIcon className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 font-medium">Practice history tracking</span>
                </div>
              </div>
            </div>

            {/* Right - Mobile Phone Mockup */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-72 h-[600px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  {/* Screen */}
                  <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                    {/* Status Bar */}
                    <div className="h-8 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between px-6 text-white text-xs">
                      <span>9:41</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-1 h-1 bg-white rounded-full" />
                        <div className="w-1 h-1 bg-white rounded-full" />
                        <div className="w-1 h-1 bg-white rounded-full" />
                      </div>
                    </div>

                    {/* App Content */}
                    <div className="p-6 h-full flex flex-col">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-lg font-bold text-gray-900">JasTalk AI</span>
                        </div>
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm text-gray-600">👤</span>
                        </div>
                      </div>

                      {/* Welcome Message */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome back!</h3>
                        <p className="text-sm text-gray-600">Ready for your next practice session?</p>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-4 mb-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <MicrophoneIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">Start New Practice</h4>
                            <p className="text-sm text-gray-600">Begin an AI interview session</p>
                          </div>
                          <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                            <ChartBarIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">View Analytics</h4>
                            <p className="text-sm text-gray-600">Check your progress</p>
                          </div>
                          <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>

                      {/* Recent Sessions */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-3">Recent Sessions</h4>
                        <div className="space-y-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">Google Interview</span>
                              <span className="text-xs text-gray-500">2 hours ago</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="text-xs text-gray-600">Completed • 85% score</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">Meta Practice</span>
                              <span className="text-xs text-gray-500">Yesterday</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-xs text-gray-600">In Progress • 60% score</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckIcon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <StarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose JasTalk AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides everything you need to excel in your interviews.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-200 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes and see results immediately.
            </p>
          </div>
          
          {/* Step 1: Upload Your Resume */}
          <div className="mb-20">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Upload Your Resume
                </h3>
                <p className="text-xl text-gray-600 mb-6">
                  Simply upload your resume and job description to get started. Our AI analyzes your experience and creates personalized interview questions.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Upload PDF or Word documents</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">AI analyzes your experience</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Generates relevant questions</span>
                  </div>
                </div>
              </div>
              
              {/* Phone Mockup - Upload Screen */}
              <div className="flex-1 flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="w-64 h-[500px] bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[1.8rem] overflow-hidden relative">
                      {/* Status Bar */}
                      <div className="h-6 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between px-4 text-white text-xs">
                        <span>9:41</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-white rounded-full" />
                          <div className="w-1 h-1 bg-white rounded-full" />
                          <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                      </div>
                      
                      {/* Upload Screen Content */}
                      <div className="p-4 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                              <SparklesIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">JasTalk AI</span>
                          </div>
                        </div>
                        
                        {/* Upload Area */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <DocumentArrowUpIcon className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Resume</h3>
                            <p className="text-sm text-gray-600 mb-6">Drag and drop your resume or click to browse</p>
                            
                            {/* Upload Button */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                              <div className="text-center">
                                <DocumentIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">resume.pdf</p>
                                <p className="text-xs text-gray-400">2.3 MB</p>
                              </div>
                            </div>
                            
                            {/* Job Description Input */}
                            <div className="space-y-3">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Job Description</label>
                                <textarea 
                                  className="w-full text-xs bg-white border border-gray-200 rounded p-2 resize-none" 
                                  rows={3}
                                  placeholder="Paste job description here..."
                                />
                              </div>
                            </div>
                            
                            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg text-sm font-semibold mt-4">
                              Generate Questions
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Practice with AI */}
          <div className="mb-20">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Practice with AI
                </h3>
                <p className="text-xl text-gray-600 mb-6">
                  Engage in realistic interview conversations with our AI interviewers. Experience natural voice interactions and real-time responses.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Natural voice conversations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Real-time AI responses</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Adaptive questioning</span>
                  </div>
                </div>
              </div>
              
              {/* Phone Mockup - Practice Screen */}
              <div className="flex-1 flex justify-center lg:justify-start">
                <div className="relative">
                  <div className="w-64 h-[500px] bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[1.8rem] overflow-hidden relative">
                      {/* Status Bar */}
                      <div className="h-6 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between px-4 text-white text-xs">
                        <span>9:41</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-white rounded-full" />
                          <div className="w-1 h-1 bg-white rounded-full" />
                          <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                      </div>
                      
                      {/* Practice Screen Content */}
                      <div className="p-4 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                              <SparklesIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">JasTalk AI</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs text-gray-600">Recording</span>
                          </div>
                        </div>
                        
                        {/* Call Interface */}
                        <div className="flex-1 flex flex-col">
                          {/* AI Interviewer */}
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">AI Interviewer</p>
                                <p className="text-xs text-gray-600">Google Software Engineer</p>
                              </div>
                            </div>
                                                         <p className="text-sm text-gray-700">
                               &ldquo;Tell me about a challenging project you worked on and how you overcame obstacles...&rdquo;
                             </p>
                          </div>
                          
                          {/* Timer */}
                          <div className="text-center mb-4">
                            <div className="text-2xl font-bold text-gray-900">12:34</div>
                            <div className="text-xs text-gray-600">Question 3 of 8</div>
                          </div>
                          
                          {/* Controls */}
                          <div className="flex justify-center space-x-4 mb-4">
                            <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <SpeakerWaveIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <button className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                              <MicrophoneIcon className="w-8 h-8 text-white" />
                            </button>
                            <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <PauseIcon className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                          
                          {/* Progress */}
                          <div className="bg-gray-100 rounded-full h-2 mb-4">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full w-3/8" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Get Detailed Feedback */}
          <div className="mb-20">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Get Detailed Feedback
                </h3>
                <p className="text-xl text-gray-600 mb-6">
                  Receive comprehensive feedback and analytics to improve your performance. Track your progress over time.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Detailed performance analysis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Audio playback and transcripts</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Progress tracking</span>
                  </div>
                </div>
              </div>
              
              {/* Phone Mockup - Feedback Screen */}
              <div className="flex-1 flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="w-64 h-[500px] bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[1.8rem] overflow-hidden relative">
                      {/* Status Bar */}
                      <div className="h-6 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between px-4 text-white text-xs">
                        <span>9:41</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-white rounded-full" />
                          <div className="w-1 h-1 bg-white rounded-full" />
                          <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                      </div>
                      
                      {/* Feedback Screen Content */}
                      <div className="p-4 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                              <SparklesIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">JasTalk AI</span>
                          </div>
                        </div>
                        
                        {/* Session Summary */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Complete!</h3>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-green-600">85%</div>
                              <div className="text-xs text-gray-600">Score</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-blue-600">12:34</div>
                              <div className="text-xs text-gray-600">Duration</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Feedback Details */}
                        <div className="space-y-3 flex-1">
                          <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">Communication</span>
                              <span className="text-sm text-green-600">Excellent</span>
                            </div>
                            <div className="bg-gray-100 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full w-4/5" />
                            </div>
                          </div>
                          
                          <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">Technical Skills</span>
                              <span className="text-sm text-yellow-600">Good</span>
                            </div>
                            <div className="bg-gray-100 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full w-3/5" />
                            </div>
                          </div>
                          
                          <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">Confidence</span>
                              <span className="text-sm text-blue-600">Very Good</span>
                            </div>
                            <div className="bg-gray-100 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full w-4/5" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-4">
                          <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg text-sm font-semibold">
                            Review Audio
                          </button>
                          <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold">
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their interview skills.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white font-semibold text-sm">{testimonial.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-600 text-sm">{testimonial.role} at {testimonial.company}</p>
                  </div>
                  <div className="text-2xl">{testimonial.companyLogo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transparent Pay-as-You-Go Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No monthly fees. Pay only for what you use. Start with $10 free credits.
            </p>
          </div>

          {/* Free Credits Banner */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 rounded-xl mb-12 text-center max-w-4xl mx-auto shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-3">
              <CurrencyDollarIcon className="w-8 h-8" />
              <h3 className="text-3xl font-bold">$10 Free Credits</h3>
            </div>
            <p className="text-green-100 text-lg">New users get $10 free credits to try JasTalk AI</p>
          </div>

          {/* Pricing Components */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Interview Agent</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-blue-600">$0.15</span>
                <span className="text-gray-600">/minute</span>
              </div>
              <p className="text-sm text-gray-600">Intelligent AI interviewers with real-time conversation</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Knowledge Base</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-blue-600">$0.005</span>
                <span className="text-gray-600">/minute</span>
              </div>
              <p className="text-sm text-gray-600">Industry-specific questions and company research</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Insights</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-blue-600">$0.02</span>
                <span className="text-gray-600">/minute</span>
              </div>
              <p className="text-sm text-gray-600">Detailed performance analysis and improvement suggestions</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Recording</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-green-600">Free</span>
              </div>
              <p className="text-sm text-gray-600">Full conversation recordings for review and practice</p>
            </div>
          </div>

          {/* Pricing Example */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border-2 border-blue-200 max-w-4xl mx-auto shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Example: 30-Minute Practice Session</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="flex items-center gap-3">
                  <MicrophoneIcon className="w-5 h-5 text-blue-600" />
                  AI Interview Agent (30 min)
                </span>
                <span className="font-semibold">$4.50</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="flex items-center gap-3">
                  <UserGroupIcon className="w-5 h-5 text-blue-600" />
                  Knowledge Base (30 min)
                </span>
                <span className="font-semibold">$0.15</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="flex items-center gap-3">
                  <ChartBarIcon className="w-5 h-5 text-blue-600" />
                  Analytics & Insights (30 min)
                </span>
                <span className="font-semibold">$0.60</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-green-600" />
                  Call Recording
                </span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
                <span className="text-lg font-bold">Total Cost</span>
                <span className="text-2xl font-bold text-blue-600">$5.25</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href="/practice/new" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Start Your Free Practice Session
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who have transformed their interview skills with JasTalk AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/practice/new" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Start Free Practice
            </Link>
            <Link href="/dashboard" className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200">
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4 group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold group-hover:text-blue-400 transition-colors duration-200">JasTalk AI</span>
              </Link>
              <p className="text-gray-400">
                Transform your interview skills with AI-powered practice and feedback.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/practice/new" className="hover:text-white transition-colors duration-200">Start Practice</Link></li>
                <li><Link href="/practice/history" className="hover:text-white transition-colors duration-200">Practice History</Link></li>
                <li><Link href="/practice/logs" className="hover:text-white transition-colors duration-200">View Logs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors duration-200">Dashboard</Link></li>
                <li><Link href="/analytics" className="hover:text-white transition-colors duration-200">Analytics</Link></li>
                <li><Link href="/sign-in" className="hover:text-white transition-colors duration-200">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 JasTalk AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
