'use client';

import React, { useState, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { X, GripVertical, Maximize2, Minimize2, Save, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MovableNotesTakerProps {
  isVisible: boolean;
  onToggle: () => void;
  initialNotes: string;
  onNotesChange: (notes: string) => void;
}

const MovableNotesTaker: React.FC<MovableNotesTakerProps> = ({
  isVisible,
  onToggle,
  initialNotes,
  onNotesChange
}) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 650, y: 100 }); // Adjusted for new 600px width
  const [size, setSize] = useState({ width: 600, height: 450 }); // 0.75x of typical console size (800x600)
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [expansionLevel, setExpansionLevel] = useState(0); // 0: 0.75x, 1: 1x, 2: 1.5x, 3: 2x, 4: 3x
  const panelRef = useRef<HTMLDivElement>(null);

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
      height: Math.max(360, prev.height + delta.y) // 0.75x of minimum console height
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
    console.log(`📝 Notes Panel expanded to ${levelNames[nextLevel]}:`, newSize);
    console.log(`📝 Current size state:`, size);
  };

  // Handle double-click on header to reset size
  const handleHeaderDoubleClick = () => {
    setSize({ width: 600, height: 450 }); // 0.75x of typical console size
    setExpansionLevel(0); // Reset to initial expansion level
    console.log('📝 Notes Panel reset to 0.75x size');
  };

  // Handle notes change
  const handleNotesChange = (value: string) => {
    setNotes(value);
    onNotesChange(value);
  };

  // Save notes
  const handleSave = () => {
    // Save to localStorage as backup
    localStorage.setItem('interviewNotes', notes);
    setLastSaved(new Date());
    
    // You can also save to database here if needed
    console.log('📝 Notes saved:', notes);
  };

  // Download notes
  const handleDownload = () => {
    const blob = new Blob([notes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-notes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-save notes every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (notes.trim() && notes !== initialNotes) {
        handleSave();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [notes, initialNotes]);

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
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
          onDoubleClick={handleHeaderDoubleClick}
          title="Double-click header to reset size"
        >
                      <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GripVertical className="w-4 h-4" />
                <CardTitle className="text-sm">Interview Notes</CardTitle>
                <span className="text-xs opacity-70">
                  (Drag to move, corners to resize) • {['0.75x', '1x', '1.5x', '2x', '3x'][expansionLevel]}
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
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-green-500/20 hover:bg-green-500/40 transition-colors rounded-tl"
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
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize bg-green-500/20 hover:bg-green-500/40 transition-colors rounded-br"
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
              {/* Notes Editor */}
              <div 
                className="flex-1 p-4 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors"
                onDoubleClick={handleDoubleClick}
                title="Double-click to expand 3x"
              >
                <div className="mb-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Take notes during your interview:
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Start typing your notes here... You can include key points, questions, follow-ups, or any insights from the interview."
                    className="min-h-[300px] resize-none border-gray-300 focus:border-green-500 focus:ring-green-500"
                    style={{ height: size.height - 200 }}
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={handleDownload}
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                  
                  {lastSaved && (
                    <div className="text-xs text-gray-500">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="border-t bg-gray-50 dark:bg-gray-800 p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Quick Actions:
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Key Points',
                    'Follow-up Questions',
                    'Technical Details',
                    'Behavioral Examples',
                    'Company Culture',
                    'Next Steps'
                  ].map((template) => (
                    <button
                      key={template}
                      onClick={() => handleNotesChange(notes + `\n\n## ${template}\n`)}
                      className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      {template}
                    </button>
                  ))}
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

export default MovableNotesTaker;
