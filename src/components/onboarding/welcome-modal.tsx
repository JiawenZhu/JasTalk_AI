"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  BarChart3, 
  Share2, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Users,
  Zap,
  Target
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const onboardingSteps = [
  {
    title: "Welcome to FoloUp!",
    description: "Your AI-powered interview practice platform",
    content: (
      <div className="text-center space-y-6">
        <div className="mx-auto w-24 h-24 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-full flex items-center justify-center">
          <Target className="h-12 w-12 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to ace your next interview?
          </h3>
          <p className="text-gray-600">
            We'll help you practice with AI-powered mock interviews tailored to your needs.
          </p>
        </div>
      </div>
    )
  },
  {
    title: "AI Voice Interviews",
    description: "Practice with realistic AI interviewers",
    content: (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
            <Mic className="h-10 w-10 text-indigo-600" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Natural Conversation Flow
          </h3>
          <p className="text-gray-600 mb-4">
            Our AI interviewers adapt to your responses and provide realistic interview experiences.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Industry-specific questions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Real-time voice responses</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Behavioral & technical questions</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Performance Analytics",
    description: "Get detailed insights and feedback",
    content: (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <BarChart3 className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Track Your Progress
          </h3>
          <p className="text-gray-600 mb-4">
            Receive comprehensive feedback on your interview performance.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Communication skills analysis</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Response time metrics</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Improvement suggestions</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Share & Collaborate",
    description: "Create shareable interview links",
    content: (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Share2 className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Custom Interview Links
          </h3>
          <p className="text-gray-600 mb-4">
            Generate unique links for remote assessments or team evaluations.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>One-click link generation</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Candidate result tracking</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Team collaboration tools</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Ready to Start!",
    description: "Begin your interview practice journey",
    content: (
      <div className="text-center space-y-6">
        <div className="mx-auto w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
          <Zap className="h-12 w-12 text-green-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            You're All Set!
          </h3>
          <p className="text-gray-600 mb-6">
            Time to practice and improve your interview skills. Good luck!
          </p>
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-800 font-medium">
              💡 Pro Tip: Start with 2-3 practice sessions to get comfortable with the platform.
            </p>
          </div>
        </div>
      </div>
    )
  }
];

export function WelcomeModal({ isOpen, onClose, userName }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('foloup-onboarding-completed', 'true');
    onClose();
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="relative">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-600 to-blue-600"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-8 pt-12">
            <DialogHeader className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {onboardingSteps[currentStep].title}
                  </DialogTitle>
                  <p className="text-gray-600 mt-1">
                    {onboardingSteps[currentStep].description}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {currentStep + 1} of {onboardingSteps.length}
                </Badge>
              </div>
            </DialogHeader>

            <div className="relative h-96 overflow-hidden">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);

                    if (swipe < -swipeConfidenceThreshold && currentStep < onboardingSteps.length - 1) {
                      nextStep();
                    } else if (swipe > swipeConfidenceThreshold && currentStep > 0) {
                      prevStep();
                    }
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Card className="w-full border-none shadow-none">
                    <CardContent className="p-6">
                      {onboardingSteps[currentStep].content}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {onboardingSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentStep ? 1 : -1);
                      setCurrentStep(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? "bg-indigo-600"
                        : index < currentStep
                        ? "bg-indigo-300"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {currentStep < onboardingSteps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  Get Started
                  <Zap className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 