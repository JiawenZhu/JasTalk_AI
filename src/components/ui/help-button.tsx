"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import WelcomeModal from "@/components/onboarding/welcome-modal";

interface HelpButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "floating" | "inline";
  position?: "top-right" | "bottom-right" | "bottom-left";
}

export default function HelpButton({ 
  className = "", 
  size = "md", 
  variant = "floating",
  position = "bottom-right"
}: HelpButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenHelp = () => {
    setIsModalOpen(true);
  };

  const handleCloseHelp = () => {
    setIsModalOpen(false);
  };

  // Listen for global open event (emitted by MobileNav)
  useEffect(() => {
    const handler = () => setIsModalOpen(true);
    if (typeof document !== 'undefined') {
      document.addEventListener('open-help-modal', handler as EventListener);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('open-help-modal', handler as EventListener);
      }
    };
  }, []);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const positionClasses = {
    "top-right": "top-4 right-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4"
  };

  if (variant === "floating") {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleOpenHelp}
          className={`fixed ${positionClasses[position]} ${sizeClasses[size]} bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 flex items-center justify-center ${className} sm:${position === 'bottom-right' ? 'bottom-4 right-4' : ''}`}
          aria-label="Help"
        >
          <QuestionMarkCircleIcon className="w-6 h-6" />
        </motion.button>

        <WelcomeModal
          isOpen={isModalOpen}
          onClose={handleCloseHelp}
          isFirstTime={false}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleOpenHelp}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors ${className}`}
        aria-label="Help"
      >
        <QuestionMarkCircleIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Help</span>
      </button>

      <WelcomeModal
        isOpen={isModalOpen}
        onClose={handleCloseHelp}
        isFirstTime={false}
      />
    </>
  );
} 
