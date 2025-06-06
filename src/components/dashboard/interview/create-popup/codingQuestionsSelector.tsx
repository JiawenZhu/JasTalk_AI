'use client';

import React, { useState, useEffect } from 'react';
import { CodingQuestion, DifficultyLevel } from '@/types/interview';
import { CodingQuestionsService } from '@/services/coding-questions.service';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Clock, MemoryStick, Building, Tag, Plus, X, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CodingQuestionsSelectorProps {
  selectedQuestions: CodingQuestion[];
  onQuestionsChange: (questions: CodingQuestion[]) => void;
  maxQuestions?: number;
}

export default function CodingQuestionsSelector({
  selectedQuestions,
  onQuestionsChange,
  maxQuestions = 3
}: CodingQuestionsSelectorProps) {
  const [allQuestions, setAllQuestions] = useState<CodingQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);

  useEffect(() => {
    fetchCodingQuestions();
    fetchFilters();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allQuestions, searchTerm, difficultyFilter, topicFilter, companyFilter]);

  const fetchCodingQuestions = async () => {
    try {
      setLoading(true);
      const questions = await CodingQuestionsService.getAllCodingQuestions();
      setAllQuestions(questions);
      setFilteredQuestions(questions);
    } catch (error) {
      console.error('Error fetching coding questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [topics, companies] = await Promise.all([
        CodingQuestionsService.getAvailableTopics(),
        CodingQuestionsService.getAvailableCompanies()
      ]);
      setAvailableTopics(topics);
      setAvailableCompanies(companies);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const applyFilters = () => {
    let filtered = allQuestions;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(searchLower) ||
        q.description.toLowerCase().includes(searchLower) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    // Topic filter
    if (topicFilter !== 'all') {
      filtered = filtered.filter(q => q.topic === topicFilter);
    }

    // Company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(q => q.company_origin === companyFilter);
    }

    setFilteredQuestions(filtered);
  };

  const isQuestionSelected = (question: CodingQuestion) => {
    return selectedQuestions.some(q => q.id === question.id);
  };

  const handleQuestionToggle = (question: CodingQuestion) => {
    if (isQuestionSelected(question)) {
      // Remove question
      const newQuestions = selectedQuestions.filter(q => q.id !== question.id);
      onQuestionsChange(newQuestions);
    } else {
      // Add question (if not at max)
      if (selectedQuestions.length < maxQuestions) {
        onQuestionsChange([...selectedQuestions, question]);
      }
    }
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDifficultyFilter('all');
    setTopicFilter('all');
    setCompanyFilter('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading coding questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Add Coding Questions</h3>
        <p className="text-sm text-gray-600">
          Select up to {maxQuestions} coding questions from our curated pool
        </p>
        <div className="mt-2">
          <Badge variant="outline">
            {selectedQuestions.length}/{maxQuestions} selected
          </Badge>
        </div>
      </div>

      {/* Selected Questions Preview */}
      {selectedQuestions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <Code2 className="w-4 h-4 mr-2" />
            Selected Questions
          </h4>
          <div className="space-y-2">
            {selectedQuestions.map((question) => (
              <div key={question.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2">
                <div className="flex items-center space-x-2">
                  <Badge className={getDifficultyColor(question.difficulty)}>
                    {question.difficulty}
                  </Badge>
                  <span className="text-sm font-medium">{question.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuestionToggle(question)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </h4>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Difficulty Filter */}
          <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as DifficultyLevel | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>

          {/* Topic Filter */}
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {availableTopics.map((topic) => (
                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Company Filter */}
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {availableCompanies.map((company) => (
                <SelectItem key={company} value={company}>{company}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Questions List */}
      <div className="border rounded-lg">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No coding questions found matching your filters.</p>
                <Button variant="ghost" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <Card 
                  key={question.id} 
                  className={`cursor-pointer transition-all ${
                    isQuestionSelected(question) 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:shadow-md'
                  } ${selectedQuestions.length >= maxQuestions && !isQuestionSelected(question) ? 'opacity-50' : ''}`}
                  onClick={() => handleQuestionToggle(question)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base flex items-center">
                        {isQuestionSelected(question) ? (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                            <Plus className="w-3 h-3 text-white rotate-45" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-2 flex items-center justify-center">
                            <Plus className="w-3 h-3 text-gray-400" />
                          </div>
                        )}
                        {question.title}
                      </CardTitle>
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {question.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {question.company_origin && (
                        <Badge variant="outline" className="text-xs">
                          <Building className="w-3 h-3 mr-1" />
                          {question.company_origin}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {question.topic}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {question.time_limit}m
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <MemoryStick className="w-3 h-3 mr-1" />
                        {question.memory_limit}MB
                      </Badge>
                    </div>

                    {question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {question.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {question.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{question.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 
