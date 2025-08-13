"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Animated Interview Banner Component
const AnimatedInterviewBanner = () => {
  const router = useRouter();
  
  // Array of characters to represent the different interviewees with accessories.
  const interviewees = [
    {
      label: 'Student',
      headColor: '#FFF5E1',
      jacketColor: '#53B0AE',
      shirtColor: '#FFFFFF',
      hairColor: '#4A4E69',
      hasGlasses: true,
      hasHat: false,
      hasTie: true,
      tieColor: '#3498DB',
    },
    {
      label: 'Teacher',
      headColor: '#DDA0DD',
      jacketColor: '#E65D5E',
      shirtColor: '#FDFEFE',
      hairColor: '#A9A9A9',
      hasGlasses: false,
      hasHat: false,
      hasTie: true,
      tieColor: '#8E44AD',
    },
    {
      label: 'Engineer',
      headColor: '#C4A484',
      jacketColor: '#607D8B',
      shirtColor: '#FDFEFE',
      hairColor: '#800000',
      hasGlasses: false,
      hasHat: true,
      hasTie: false,
      tieColor: null,
    },
  ];

  // State to track the current interviewee index
  const [intervieweeIndex, setIntervieweeIndex] = useState(0);
  // State to control which character is talking and the message animation
  const [talking, setTalking] = useState<'interviewer' | 'interviewee' | null>(null);
  const [message, setMessage] = useState('');
  const [messageVisible, setMessageVisible] = useState(false);
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0, width: 0 });
  const conversationIndex = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // The new conversational script with optimized timing
  const conversationScript: Array<{ speaker: 'interviewer' | 'interviewee'; message: string }> = [
    { speaker: 'interviewer', message: 'Tell me about yourself?' },
    { speaker: 'interviewee', message: 'I\'m a software engineer with 5 years of experience in web development. I\'m passionate about creating user-friendly interfaces and enjoy problem-solving.' },
    { speaker: 'interviewer', message: 'Why do you want this job?' },
    { speaker: 'interviewee', message: 'I\'m drawn to this position because it aligns perfectly with my career goals and skills. I\'m particularly interested in your company\'s focus on AI-driven solutions.' },
    { speaker: 'interviewer', message: 'What are your strengths?' },
    { speaker: 'interviewee', message: 'I\'m a strong communicator with excellent problem-solving skills. I\'m also a highly motivated and results-oriented individual.' },
    { speaker: 'interviewer', message: 'What are your weaknesses?' },
    { speaker: 'interviewee', message: 'One area I\'m working on is delegating tasks more effectively. I\'m now actively learning to trust others and distribute responsibilities more efficiently.' },
  ];

  // Calculate optimal bubble positioning based on character and message length
  const calculateBubblePosition = (speaker: 'interviewer' | 'interviewee', message: string) => {
    const messageLength = message.length;
    const baseWidth = Math.max(120, Math.min(280, messageLength * 8)); // Dynamic width based on content
    const baseHeight = Math.max(60, Math.min(120, Math.ceil(messageLength / 40) * 30)); // Dynamic height
    
    if (speaker === 'interviewer') {
      // Position above and to the left of the left character
      return {
        x: 'left-1/4 -translate-x-1/2',
        y: 'top-2 sm:top-3 md:top-4',
        width: `max-w-[${baseWidth}px]`,
        height: `h-[${baseHeight}px]`
      };
    } else {
      // Position above and to the right of the right character
      return {
        x: 'right-1/4 translate-x-1/2',
        y: 'top-2 sm:top-3 md:top-4',
        width: `max-w-[${baseWidth}px]`,
        height: `h-[${baseHeight}px]`
      };
    }
  };

  // useEffect hook to handle the conversation loop with refined timing
  useEffect(() => {
    const runConversation = () => {
      // Clear any existing timeout to prevent multiple loops
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const currentStep = conversationScript[conversationIndex.current];
      
      setTalking(currentStep.speaker);
      setMessage(currentStep.message);
      setMessageVisible(true);
      
      // Calculate optimal display duration based on message length and reading speed
      const wordsPerMinute = 200; // Average reading speed
      const wordCount = currentStep.message.split(' ').length;
      const readingTime = (wordCount / wordsPerMinute) * 60 * 1000; // Convert to milliseconds
      const displayDuration = Math.max(2000, Math.min(6000, readingTime + 1000)); // Min 2s, Max 6s
      
      // Schedule the message to disappear
      timeoutRef.current = setTimeout(() => {
        setMessageVisible(false);
        setTalking(null);
        
        // Determine the delay before the next message
        const nextIndex = (conversationIndex.current + 1) % conversationScript.length;
        const isEndOfFullInterview = nextIndex === 0;
        const nextDelay = isEndOfFullInterview ? 4000 : 800; // Longer pause between full cycles

        // Advance to the next step
        conversationIndex.current = nextIndex;

        // Change interviewee after every Q&A pair (2 steps)
        if (conversationIndex.current % 2 === 0) {
          setIntervieweeIndex(prevIndex => (prevIndex + 1) % interviewees.length);
        }

        // Schedule the next conversation step with the calculated delay
        timeoutRef.current = setTimeout(runConversation, nextDelay);
      }, displayDuration);
    };

    // Start the conversation
    runConversation();

    // Cleanup function to clear the timeout when the component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [interviewees.length, conversationScript.length]);

  const currentInterviewee = interviewees[intervieweeIndex];

  // A generic interviewer character that remains static
  const interviewer = {
    headColor: '#F0C2A6',
    jacketColor: '#34495E',
    shirtColor: '#FDFEFE',
    hairColor: '#2F4F4F',
    hasGlasses: false,
    hasHat: false,
    hasTie: true,
    tieColor: '#A0522D',
  };

  // Helper function to render a character with conditional accessories
  const CharacterSVG = ({ character, mirrored = false }: { character: any; mirrored?: boolean }) => (
    <svg 
      width="100" 
      height="100" 
      className="md:w-32 md:h-32 lg:w-36 lg:h-36"
      viewBox="0 0 250 250" 
      style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
    >
      {/* Body and clothes */}
      <path
        d="M50 100 H200 V250 H50 Z M75 150 L125 100 L175 150 V250 H75 Z"
        fill={character.jacketColor}
      />
      <rect x="75" y="150" width="100" height="100" fill={character.shirtColor} />

      {character.hasTie && (
        <>
          <polygon points="125,150 120,165 130,165" fill={character.tieColor} />
          <polygon points="125,165 110,210 140,210" fill={character.tieColor} />
        </>
      )}

      {/* Head */}
      <circle cx="125" cy="100" r="45" fill={character.headColor} />
      
      {/* Hair */}
      <path d="M80 100 Q125 60 170 100" stroke={character.hairColor} strokeWidth="5" fill="none" />
      
      {/* Eyes */}
      <circle cx="110" cy="95" r="3" fill="#212121" />
      <circle cx="140" cy="95" r="3" fill="#212121" />

      {/* Mouth */}
      <path d="M125 130 Q130 132 135 130" stroke="#212121" strokeWidth="1.5" fill="none" />
      
      {character.hasGlasses && (
        <>
          <circle cx="110" cy="100" r="15" fill="none" stroke="#212121" strokeWidth="2" />
          <circle cx="140" cy="100" r="15" fill="none" stroke="#212121" strokeWidth="2" />
          <line x1="120" y1="100" x2="130" y2="100" stroke="#212121" strokeWidth="2" />
          <line x1="95" y1="95" x2="80" y2="90" stroke="#212121" strokeWidth="2" />
          <line x1="155" y1="95" x2="170" y2="90" stroke="#212121" strokeWidth="2" />
        </>
      )}

      {character.hasHat && (
        <path
          d="M100 50 L150 50 L160 70 L90 70 Z M95 70 Q125 80 155 70"
          fill="#4A4E69"
        />
      )}
    </svg>
  );

  return (
    <div className="px-2 sm:px-4 py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden">
      <div className="text-center text-white max-w-4xl mx-auto relative">
        {/* The two-person illustration container with messages */}
        <div className="relative flex justify-center items-end w-full mt-8 sm:mt-12 mb-6 sm:mb-8 px-1 sm:px-2 md:px-4 lg:px-6">
          {/* Interviewer Character */}
          <div className="mx-1 sm:mx-2 md:mx-3 lg:mx-4">
            <CharacterSVG character={interviewer} />
          </div>

          {/* Animated Message Bubble - Above the characters, positioned to fit within banner */}
          <div className={`absolute z-10 p-2 sm:p-3 md:p-4 rounded-2xl text-xs md:text-sm font-medium shadow-xl transition-all duration-500 ease-out
            ${messageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            ${talking === 'interviewer' 
              ? 'left-1/4 -translate-x-1/2 bg-white/50 text-blue-900 border-2 border-white/70 shadow-2xl' 
              : 'right-1/4 translate-x-1/2 bg-white/50 text-blue-900 border-2 border-white/70 shadow-2xl'
            }
            ${talking === 'interviewer' 
              ? 'top-6 sm:top-8 md:top-10 lg:top-12' 
              : 'top-6 sm:top-8 md:top-10 lg:top-12'
            }
            -translate-y-full
            max-w-40 sm:max-w-56 md:max-w-72 lg:max-w-80 xl:max-w-96
            min-h-16 sm:min-h-18 md:min-h-20 max-h-24 sm:max-h-28 md:max-h-32 lg:max-h-36
            overflow-hidden
            will-change-transform will-change-opacity
            hover:bg-opacity-70 hover:border-opacity-95
          `}>
            <div className="relative">
              {/* Speech bubble tail pointing down to the talking character's mouth area */}
              <div className={`absolute w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 transform rotate-45 ${
                talking === 'interviewer' 
                  ? 'left-1/2 -translate-x-1/2 -bottom-1 sm:-bottom-1.5 bg-white/50 border-2 border-white/70' 
                  : 'right-1/2 translate-x-1/2 -bottom-1 sm:-bottom-1.5 bg-white/50 border-2 border-white/70'
              }`} />
              
              {/* Message text with improved text wrapping and readability */}
              <div className="px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-3 leading-relaxed break-words text-center hyphens-auto font-semibold">
                <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {message}
                </span>
              </div>
            </div>
          </div>

          {/* Interviewee Character */}
          <div className="mx-1 sm:mx-2 md:mx-3 lg:mx-4">
            <CharacterSVG character={currentInterviewee} mirrored={true} />
          </div>
        </div>

        {/* Main Headline - Now below the characters */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 md:mb-4">
          Master your interviews
        </h2>
        
        {/* Call-to-Action Button - Now below the characters */}
        <motion.button
          className="w-full max-w-sm mx-auto bg-white text-blue-600 font-semibold py-3 px-6 rounded-xl shadow-lg mb-4 md:mb-6 hover:bg-blue-50 transition-colors duration-200"
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/sign-up?offer=free-credit')}
        >
          Start Free Practice
        </motion.button>
        
        {/* Subheading - Now below the characters */}
        <p className="text-blue-100 mb-6 md:mb-8 text-sm md:text-base lg:text-lg max-w-2xl mx-auto">
          Sign up and get $5 in free credits to start practicing today
        </p>
      </div>
    </div>
  );
};

export default AnimatedInterviewBanner;
