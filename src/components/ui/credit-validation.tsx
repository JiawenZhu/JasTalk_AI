import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { useCreditValidation } from '@/hooks/use-credit-validation';

interface CreditValidationProps {
  action: 'start-interview' | 'create-questions' | 'resume-interview';
  children?: React.ReactNode;
  showAlways?: boolean;
}

export function CreditValidation({ action, children, showAlways = false }: CreditValidationProps) {
  const { hasCredits, creditsRemaining, isLoading, error, redirectToAddCredits } = useCreditValidation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Checking credits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            Error Checking Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">
            Unable to verify your credit balance. Please try again or contact support.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If user has credits, show the children (normal content)
  if (hasCredits) {
    return <>{children}</>;
  }

  // If showAlways is true, always show the validation component
  if (!showAlways && hasCredits) {
    return <>{children}</>;
  }

  // User has no credits - show the credit purchase prompt
  const getActionText = () => {
    switch (action) {
      case 'start-interview':
        return 'start an interview';
      case 'create-questions':
        return 'create interview questions';
      case 'resume-interview':
        return 'resume your interview';
      default:
        return 'continue';
    }
  };

  const getActionDescription = () => {
    switch (action) {
      case 'start-interview':
        return 'You need minutes to start practicing interviews. Each minute of practice uses 1 minute from your account.';
      case 'create-questions':
        return 'You need credits to generate custom interview questions. Question generation costs 1 minute per question.';
      case 'resume-interview':
        return 'You need credits to continue your interview practice session.';
      default:
        return 'You need credits to continue.';
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <CreditCard className="w-5 h-5" />
          Insufficient Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-orange-700">
          <Clock className="w-4 h-4" />
          <span className="font-medium">Current Balance: {Math.floor(creditsRemaining)} minutes</span>
        </div>
        
        <p className="text-orange-700">
          You don't have enough credits to {getActionText()}. {getActionDescription()}
        </p>

        <div className="bg-white p-4 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Credit Pricing
          </h4>
          <div className="text-sm text-orange-700 space-y-1">
            <p>• Interview Practice: 1 minute per minute of practice</p>
            <p>• Question Generation: $0.005 per minute</p>
            <p>• Start with $5 free credits (42 minutes)</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={redirectToAddCredits}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Add Credits
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard'}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="text-xs text-orange-600 bg-orange-100 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 Tip:</p>
          <p>New users get $5 in free credits when they sign up. Check your email confirmation to activate your account and receive your free credits.</p>
        </div>
      </CardContent>
    </Card>
  );
}
