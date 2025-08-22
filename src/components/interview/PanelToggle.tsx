'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Edit3 } from 'lucide-react';

interface PanelToggleProps {
  showQuestions: boolean;
  showNotes: boolean;
  onToggleQuestions: () => void;
  onToggleNotes: () => void;
}

export default function PanelToggle({
  showQuestions,
  showNotes,
  onToggleQuestions,
  onToggleNotes
}: PanelToggleProps) {
  console.log('PanelToggle rendered:', { showQuestions, showNotes });
  
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-3">
      {/* Questions Toggle */}
      <motion.button
        onClick={onToggleQuestions}
        className={`
          flex items-center justify-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all duration-200 w-40
          ${showQuestions 
            ? 'bg-green-600 text-white shadow-green-200' 
            : 'bg-white/90 text-green-600 border-2 border-green-200 hover:bg-green-50'
          }
        `}
        whileHover={{ scale: 1.05, opacity: 1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0.2 }}
        animate={{ opacity: 0.2 }}
      >
        {showQuestions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        <span className="text-sm font-medium">
          {showQuestions ? 'Hide' : 'Show'} Questions
        </span>
      </motion.button>

      {/* Notes Toggle */}
      <motion.button
        onClick={onToggleNotes}
        className={`
          flex items-center justify-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all duration-200 w-40
          ${showNotes 
            ? 'bg-orange-600 text-white shadow-orange-200' 
            : 'bg-white/90 text-orange-600 border-2 border-orange-200 hover:bg-orange-50'
          }
        `}
        whileHover={{ scale: 1.05, opacity: 1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0.2 }}
        animate={{ opacity: 0.2 }}
      >
        {showNotes ? <EyeOff className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        <span className="text-sm font-medium">
          {showNotes ? 'Hide' : 'Show'} Notes
        </span>
      </motion.button>
    </div>
  );
}
