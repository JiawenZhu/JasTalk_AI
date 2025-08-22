'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { X, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  category: string;
}

interface MovableQuestionsPanelProps {
  questions: Question[];
  currentQuestionIndex: number;
  totalQuestionsAnswered: number;
  followUpQuestionsCount: number;
  onQuestionSelect: (index: number) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const MovableQuestionsPanel: React.FC<MovableQuestionsPanelProps> = ({
  questions,
  currentQuestionIndex,
  totalQuestionsAnswered,
  followUpQuestionsCount,
  onQuestionSelect,
  isVisible,
  onToggle
}) => {
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [size, setSize] = useState({ width: 600, height: 600 }); // 0.75x width, 1x height for better vertical space
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [expansionLevel, setExpansionLevel] = useState(0); // 0: 0.75x, 1: 1x, 2: 1.5x, 3: 2x, 4: 3x
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Safety checks for props
  const safeQuestions = questions || [];
  const safeCurrentQuestionIndex = currentQuestionIndex || 0;
  const safeTotalQuestionsAnswered = totalQuestionsAnswered || 0;
  const safeFollowUpQuestionsCount = followUpQuestionsCount || 0;

  // Handle scroll to update opacity
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Handle drag
  const handleDrag = (event: any, info: PanInfo) => {
    if (!isDragging) return;
    setPosition({
      x: position.x + info.delta.x,
      y: position.y + info.delta.y
    });
  };

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  // Handle resize
  const handleResize = (direction: string, delta: { x: number; y: number }) => {
    if (!isResizing) return;
    
    setSize(prev => ({
      width: Math.max(480, prev.width + delta.x), // 0.75x of minimum console width
      height: Math.max(480, prev.height + delta.y) // 1x of minimum console height for better vertical space
    }));
  };

  const handleResizeStart = () => setIsResizing(true);
  const handleResizeEnd = () => setIsResizing(false);

  // Toggle minimize
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Handle double-click to cycle through expansion levels
  const handleDoubleClick = () => {
    const baseWidth = 800; // Base console width
    const baseHeight = 600; // Base console height
    
    const expansionLevels = [
      { width: baseWidth * 0.75, height: baseHeight * 0.75 }, // 0.75x
      { width: baseWidth * 1, height: baseHeight * 1 },       // 1x
      { width: baseWidth * 1.5, height: baseHeight * 1.5 },   // 1.5x
      { width: baseWidth * 2, height: baseHeight * 2 },       // 2x
      { width: baseWidth * 3, height: baseHeight * 3 }        // 3x
    ];
    
    const nextLevel = (expansionLevel + 1) % expansionLevels.length;
    const newSize = expansionLevels[nextLevel];
    
    setExpansionLevel(nextLevel);
    setSize(newSize);
    
    const levelNames = ['0.75x', '1x', '1.5x', '2x', '3x'];
    console.log(`📏 Questions Panel expanded to ${levelNames[nextLevel]}:`, newSize);
    console.log(`📏 Current size state:`, size);
  };

  // Handle double-click on header to reset size
  const handleHeaderDoubleClick = () => {
    setSize({ width: 600, height: 600 }); // 0.75x width, 1x height for better vertical space
    setExpansionLevel(0); // Reset to initial expansion level
    console.log('📏 Questions Panel reset to 0.75x width, 1x height');
  };

  if (!isVisible) return null;

  return (
    <motion.div
      ref={panelRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDrag={handleDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      className="select-none"
    >
      <Card 
        className={`shadow-2xl border-2 ${isMinimized ? 'h-12' : ''} !w-auto !h-auto`}
        style={{ 
          width: isMinimized ? 'auto' : `${size.width}px`,
          height: isMinimized ? 'auto' : `${size.height}px`,
          minWidth: isMinimized ? 'auto' : `${size.width}px`,
          minHeight: isMinimized ? 'auto' : `${size.height}px`,
          maxWidth: isMinimized ? 'auto' : 'none',
          maxHeight: isMinimized ? 'auto' : 'none',
          transition: isMinimized ? 'all 0.3s ease' : 'none',
          flexShrink: 0,
          flexGrow: 0
        }}
      >
        <CardHeader 
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
          onDoubleClick={handleHeaderDoubleClick}
          title="Double-click header to reset size"
        >
                      <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GripVertical className="w-4 h-4" />
                <CardTitle className="text-sm">Interview Questions</CardTitle>
                <span className="text-xs opacity-70">
                  (Drag to move, corners to resize) • {['0.75x', '1x', '1.5x', '2x', '3x'][expansionLevel]} • {size.width}x{size.height}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={toggleMinimize}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={onToggle}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0 overflow-hidden relative !w-full !h-full">
            {/* Resize Handle - Bottom Right */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-tl"
              onMouseDown={(e) => {
                e.preventDefault();
                handleResizeStart();
                const startX = e.clientX;
                const startY = e.clientY;
                const startSize = { ...size };
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaX = moveEvent.clientX - startX;
                  const deltaY = moveEvent.clientY - startY;
                  handleResize('se', { x: deltaX, y: deltaY });
                };
                
                const handleMouseUp = () => {
                  handleResizeEnd();
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
            
            {/* Resize Handle - Top Left */}
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-br"
              onMouseDown={(e) => {
                e.preventDefault();
                handleResizeStart();
                const startX = e.clientX;
                const startY = e.clientY;
                const startSize = { ...size };
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaX = startX - moveEvent.clientX;
                  const deltaY = startY - moveEvent.clientY;
                  handleResize('nw', { x: deltaX, y: deltaY });
                };
                
                const handleMouseUp = () => {
                  handleResizeEnd();
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
            
            <div className="h-full flex flex-col">
              {/* Header with Progress */}
              <div 
                className="p-3 border-b bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onDoubleClick={handleDoubleClick}
                title="Double-click to expand 3x"
              >
                <div className="space-y-2">
                  {/* Official Question Progress */}
                  <div>
                    <div className="text-xs text-gray-600 mb-1">
                      Official Questions: {safeCurrentQuestionIndex + 1} of {safeQuestions.length}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${((safeCurrentQuestionIndex + 1) / safeQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Follow-up Questions Count */}
                  <div>
                    <div className="text-xs text-gray-600 mb-1">
                      Follow-up Questions: {safeFollowUpQuestionsCount}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((safeFollowUpQuestionsCount / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Total Progress */}
                  <div>
                    <div className="text-xs text-gray-600 mb-1">
                      Total Progress: {safeTotalQuestionsAnswered} responses
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(((safeCurrentQuestionIndex + 1) / safeQuestions.length) * 100)}% complete
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Questions List with Limited Height */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
                style={{ maxHeight: '300px' }}
                onScroll={handleScroll}
              >
                <div className="p-2 space-y-2">
                  {safeQuestions.map((question, index) => {
                    // Calculate opacity based on scroll position and viewport visibility
                    const questionHeight = 60; // Approximate height of each question card
                    const questionTop = index * questionHeight;
                    const questionBottom = questionTop + questionHeight;
                    const containerHeight = 180; // maxHeight of scroll container
                    
                    // Calculate how much of the question is visible in the viewport
                    const visibleTop = Math.max(0, questionTop - scrollTop);
                    const visibleBottom = Math.min(containerHeight, questionBottom - scrollTop);
                    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
                    const visibilityRatio = visibleHeight / questionHeight;
                    
                    // Base opacity from distance from current question
                    const distanceFromCurrent = Math.abs(index - safeCurrentQuestionIndex);
                    let baseOpacity = 1;
                    let transform = '';
                    
                    if (distanceFromCurrent === 0) {
                      // Current question - full opacity and highlighted
                      baseOpacity = 1;
                      transform = 'scale(1.01)';
                    } else if (distanceFromCurrent === 1) {
                      // Adjacent questions - slightly reduced opacity
                      baseOpacity = 0.95;
                    } else if (distanceFromCurrent === 2) {
                      // Further questions - more reduced opacity
                      baseOpacity = 0.85;
                    } else {
                      // Distant questions - moderately reduced opacity
                      baseOpacity = 0.75;
                    }
                    
                    // Ensure questions in viewport are always clearly visible
                    let finalOpacity = baseOpacity;
                    
                    // If question is visible enough in viewport, keep it fully opaque
                    if (visibilityRatio > 0.2) {
                      finalOpacity = baseOpacity; // Keep original opacity for visible questions
                    } else {
                      // Only reduce opacity for questions that are barely visible (at edges)
                      finalOpacity = baseOpacity * 0.6; // Minimum 60% opacity
                    }
                    
                    // Add subtle transform based on scroll position for mobile-like feel
                    const scrollTransform = `translateY(${(1 - visibilityRatio) * 2}px)`;
                    const finalTransform = transform ? `${transform} ${scrollTransform}` : scrollTransform;
                    
                    return (
                      <motion.div
                        key={question.id}
                        className={`p-2 rounded-md border cursor-pointer transition-all duration-150 ${
                          index === safeCurrentQuestionIndex
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                            : index < safeCurrentQuestionIndex
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 bg-white dark:bg-gray-800 hover:border-gray-300'
                        }`}
                        style={{
                          opacity: finalOpacity,
                          transform: finalTransform,
                          zIndex: safeQuestions.length - distanceFromCurrent
                        }}
                        animate={distanceFromCurrent === 0 ? {
                          boxShadow: ['0 2px 4px -1px rgba(0, 0, 0, 0.1)', '0 4px 6px -1px rgba(0, 0, 0, 0.1)', '0 2px 4px -1px rgba(0, 0, 0, 0.1)']
                        } : {}}
                        transition={{ duration: 1.5, repeat: distanceFromCurrent === 0 ? Infinity : 0 }}
                        onClick={() => onQuestionSelect(index)}
                      >
                        <div className="flex items-start space-x-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                            index === safeCurrentQuestionIndex
                              ? 'bg-blue-500 text-white'
                              : index < safeCurrentQuestionIndex
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium leading-tight ${
                              index === safeCurrentQuestionIndex
                                ? 'text-blue-700 dark:text-blue-300'
                                : index < safeCurrentQuestionIndex
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {question.text}
                            </p>
                            <div className="flex items-center space-x-1 mt-1">
                              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                                question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {question.difficulty}
                              </span>
                              <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {question.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              
              {/* Scroll Indicator */}
              <div className="p-1.5 border-t bg-gray-50 dark:bg-gray-800 text-center">
                <div className="text-xs text-gray-400">
                  ↓ Scroll for more questions
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Resize handles */}
      {!isMinimized && (
        <>
          {/* Bottom-right resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResizeStart}
            onMouseMove={(e) => {
              if (isResizing) {
                const rect = panelRef.current?.getBoundingClientRect();
                if (rect) {
                  const deltaX = e.clientX - rect.right;
                  const deltaY = e.clientY - rect.bottom;
                  handleResize('se', { x: deltaX, y: deltaY });
                }
              }
            }}
            onMouseUp={handleResizeEnd}
            onMouseLeave={handleResizeEnd}
          >
            <div className="w-full h-full bg-gradient-to-br from-transparent to-gray-400 rounded-bl-lg" />
          </div>
          
          {/* Right resize handle */}
          <div
            className="absolute top-1/2 right-0 w-2 h-8 -translate-y-1/2 cursor-e-resize"
            onMouseDown={handleResizeStart}
            onMouseMove={(e) => {
              if (isResizing) {
                const rect = panelRef.current?.getBoundingClientRect();
                if (rect) {
                  const deltaX = e.clientX - rect.right;
                  handleResize('e', { x: deltaX, y: 0 });
                }
              }
            }}
            onMouseUp={handleResizeEnd}
            onMouseLeave={handleResizeEnd}
          />
          
          {/* Bottom resize handle */}
          <div
            className="absolute bottom-0 left-1/2 w-8 h-2 -translate-x-1/2 cursor-s-resize"
            onMouseDown={handleResizeStart}
            onMouseMove={(e) => {
              if (isResizing) {
                const rect = panelRef.current?.getBoundingClientRect();
                if (rect) {
                  const deltaY = e.clientY - rect.bottom;
                  handleResize('s', { x: 0, y: deltaY });
                }
              }
            }}
            onMouseUp={handleResizeEnd}
            onMouseLeave={handleResizeEnd}
          />
        </>
      )}
    </motion.div>
  );
};

export default MovableQuestionsPanel;
