'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Edit3, Save, Trash2 } from 'lucide-react';

interface NotesTakerProps {
  isVisible: boolean;
  onToggle: () => void;
  initialNotes?: string;
  onNotesChange?: (notes: string) => void;
}

export default function NotesTaker({
  isVisible,
  onToggle,
  initialNotes = '',
  onNotesChange
}: NotesTakerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [notes]);

  // Save notes when they change
  useEffect(() => {
    if (onNotesChange) {
      onNotesChange(notes);
    }
  }, [notes, onNotesChange]);

  const handleSave = () => {
    setIsEditing(false);
    // Notes are auto-saved via useEffect
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all notes?')) {
      setNotes('');
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed right-4 top-20 z-40"
      >
        {/* Notes Card */}
        <motion.div
          className={`
            bg-white/80 backdrop-blur-sm border-2 border-orange-200 rounded-2xl shadow-xl
            transition-all duration-300 ease-in-out
            ${isExpanded ? 'w-80 h-96' : 'w-64 h-auto max-h-32'}
          `}
          animate={{
            scale: isExpanded ? 1.02 : 1,
            boxShadow: isExpanded 
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
              : "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-orange-100">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-700 text-lg">Notes Taker</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-orange-100 rounded-full transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-orange-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-orange-600" />
                )}
              </button>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-orange-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-orange-600" />
              </button>
            </div>
          </div>

          {/* Notes Content */}
          <div className="p-4 overflow-hidden">
            <div className={`transition-all duration-300 ${
              isExpanded ? 'opacity-100 max-h-80' : 'opacity-60 max-h-20'
            }`}>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 mb-3">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 text-xs rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                )}
                
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>

              {/* Notes Text */}
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Start taking notes here..."
                  className="w-full min-h-[200px] p-3 text-sm border border-orange-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/60"
                  style={{ fontFamily: 'inherit' }}
                />
              ) : (
                <div className="min-h-[200px] p-3 bg-white/40 rounded-lg border border-orange-100">
                  {notes ? (
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {notes}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic text-center py-8">
                      No notes yet. Click "Edit" to start taking notes.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expand/Collapse Indicator */}
          {!isExpanded && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-1 bg-orange-400 rounded-full"
              />
            </div>
          )}

          {/* Scroll Indicator */}
          {isExpanded && notes.length > 200 && (
            <div className="absolute bottom-2 right-2">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-orange-400 rounded-full opacity-60"
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
