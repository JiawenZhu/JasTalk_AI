"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useOrganization } from "@/contexts/organization.context";
import { useAuth } from "@/contexts/auth.context";
import InterviewCard from "@/components/dashboard/interview/interviewCard";
import CreateInterviewCard from "@/components/dashboard/interview/createInterviewCard";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { InterviewService } from "@/services/interviews.service";
import { ClientService } from "@/services/clients.service";
import { ResponseService } from "@/services/responses.service";
import { useInterviews } from "@/contexts/interviews.context";
import Modal from "@/components/dashboard/Modal";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { InterviewCardSkeleton, ImageSkeleton } from "@/components/ui/loading-states";
import { Gem, Plus } from "lucide-react";
import Image from "next/image";
import { useInterviewers } from "@/contexts/interviewers.context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Interview } from "@/types/interview";
import CreateInterviewModal from "@/components/dashboard/interview/createInterviewModal";
import { cn } from "@/lib/utils";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

// Memoized loading component with exact dimensions
const InterviewsLoader = memo(() => {
  return (
    <div className="flex flex-row gap-3">
      {[...Array(3)].map((_, index) => (
        <InterviewCardSkeleton key={index} />
      ))}
    </div>
  );
});

InterviewsLoader.displayName = "InterviewsLoader";

// Memoized upgrade modal content with stable image loading
const UpgradeModalContent = memo(() => (
  <div className="flex flex-col space-y-4">
    <div className="flex justify-center text-indigo-600">
      <Gem />
    </div>
    <h3 className="text-xl font-semibold text-center">
      Upgrade to Pro
    </h3>
    <p className="text-l text-center">
      You have reached your limit for the free trial. Please
      upgrade to pro to continue using our features.
    </p>
    <div className="grid grid-cols-2 gap-2">
      <div className="flex justify-center items-center">
        <div className="relative w-[299px] h-[300px] bg-gray-50 rounded-lg overflow-hidden">
          <Image
            src="/premium-plan-icon.png"
            alt="Premium Plan"
            className="object-contain"
            sizes="(max-width: 768px) 150px, 299px"
            priority={false}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLliDGhQpqRXrZZbKWEhYAQCm4xdVG4U4wKN2kR9rA5b/9k="
            fill
          />
        </div>
      </div>

      <div className="grid grid-rows-2 gap-2">
        <div className="p-4 border rounded-lg bg-white">
          <h4 className="text-lg font-medium">Free Plan</h4>
          <ul className="list-disc pl-5 mt-2">
            <li>10 Responses</li>
            <li>Basic Support</li>
            <li>Limited Features</li>
          </ul>
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <h4 className="text-lg font-medium">Pro Plan</h4>
          <ul className="list-disc pl-5 mt-2">
            <li>Flexible Pay-Per-Response</li>
            <li>Priority Support</li>
            <li>All Features</li>
          </ul>
        </div>
      </div>
    </div>
    <p className="text-l text-center">
      Contact{" "}
      <span className="font-semibold">founders@folo-up.co</span>{" "}
      to upgrade your plan.
    </p>
  </div>
));

UpgradeModalContent.displayName = "UpgradeModalContent";

// Memoized create interview disabled card with stable dimensions
const CreateInterviewDisabledCard = memo(() => (
  <Card className="create-card flex items-center border-dashed border-gray-700 border-2 ml-1 mr-3 mt-4 shrink-0 overflow-hidden shadow-md">
    <CardContent className="flex items-center flex-col mx-auto p-6">
      <div className="flex flex-col justify-center items-center w-full overflow-hidden mb-4">
        <Plus size={90} strokeWidth={0.5} className="text-gray-700" />
      </div>
      <CardTitle className="p-0 text-md text-center leading-tight">
        You cannot create any more interviews unless you upgrade
      </CardTitle>
    </CardContent>
  </Card>
));

CreateInterviewDisabledCard.displayName = "CreateInterviewDisabledCard";

// Main dashboard component
function Interviews() {
  const { interviews, interviewsLoading, fetchInterviews } = useInterviews();
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<string>("");
  const [allowedResponsesCount, setAllowedResponsesCount] = useState<number>(10);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [contentReady, setContentReady] = useState<boolean>(false);

  // Memoized values for better performance
  const isTrialOver = useMemo(() => currentPlan === "free_trial_over", [currentPlan]);
  const shouldShowLoader = useMemo(() => interviewsLoading || loading, [interviewsLoading, loading]);

  // Set content ready after initial load
  useEffect(() => {
    if (!interviewsLoading) {
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 100);
      
return () => clearTimeout(timer);
    }
  }, [interviewsLoading]);

  // Memoized onboarding check
  const checkOnboarding = useCallback(() => {
    // Multiple checks to determine if this is a first-time user
    const hasSeenOnboarding = localStorage.getItem('foloup-onboarding-completed');
    const hasExistingInterviews = interviews && interviews.length > 0;
    const lastLoginTime = localStorage.getItem('foloup-last-login');
    const currentTime = Date.now();
    
    // Check if user has been active recently (within last 7 days)
    const isRecentUser = lastLoginTime && 
      (currentTime - parseInt(lastLoginTime)) < (7 * 24 * 60 * 60 * 1000);
    
    // Set current login time
    localStorage.setItem('foloup-last-login', currentTime.toString());
    
    // Only show onboarding if:
    // 1. Haven't seen onboarding before AND
    // 2. Have no existing interviews AND 
    // 3. Not a recent user AND
    // 4. User is loaded and interviews are loaded
    const shouldShowOnboarding = !hasSeenOnboarding && 
                                !hasExistingInterviews && 
                                !isRecentUser && 
                                user && 
                                !interviewsLoading;
    
    if (shouldShowOnboarding) {
      // Show welcome modal after a short delay for better UX
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 1000);
      
return () => clearTimeout(timer);
    }
  }, [user, interviewsLoading, interviews]);

  // Memoized organization data fetch
  const fetchOrganizationData = useCallback(async () => {
    if (!organization?.id) {return;}
    
    try {
      const data = await ClientService.getOrganizationById(organization.id);
      if (data?.plan) {
        setCurrentPlan(data.plan);
        if (data.plan === "free_trial_over") {
          setIsModalOpen(true);
        }
      }
      if (data?.allowed_responses_count) {
        setAllowedResponsesCount(data.allowed_responses_count);
      }
    } catch (error) {
      console.error("Error fetching organization data:", error);
    }
  }, [organization?.id]);

  // Memoized responses count fetch
  const fetchResponsesCount = useCallback(async () => {
    if (!organization || currentPlan !== "free") {
      return;
    }

    setLoading(true);
    try {
      const totalResponses = await ResponseService.getResponseCountByOrganizationId(
        organization.id,
      );
      const hasExceededLimit = totalResponses >= allowedResponsesCount;
      if (hasExceededLimit) {
        setCurrentPlan("free_trial_over");
        await Promise.all([
          InterviewService.deactivateInterviewsByOrgId(organization.id),
          ClientService.updateOrganization(
            { plan: "free_trial_over" },
            organization.id,
          ),
        ]);
      }
    } catch (error) {
      console.error("Error fetching responses:", error);
    } finally {
      setLoading(false);
    }
  }, [organization, currentPlan, allowedResponsesCount]);

  // Memoized modal close handler
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleWelcomeModalClose = useCallback(() => {
    setShowWelcomeModal(false);
  }, []);

  // Effects with proper dependencies
  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  useEffect(() => {
    fetchResponsesCount();
  }, [fetchResponsesCount]);

  // Memoized interview cards
  const interviewCards = useMemo(() => {
    return interviews.map((item) => (
      <InterviewCard
        id={item.id}
        interviewerId={item.interviewer_id}
        key={item.id}
        name={item.name}
        url={item.url ?? ""}
        readableSlug={item.readable_slug}
        hasCodingQuestions={item.has_coding_questions}
        codingQuestionCount={item.coding_question_count}
        showDeleteButton={true}
        onDeleted={(deletedId) => {
          fetchInterviews();
        }}
      />
    ));
  }, [interviews, fetchInterviews]);

  return (
    <main className={`dashboard-container p-8 pt-0 ml-12 mr-auto rounded-md route-container transition-all duration-200 ${
      contentReady ? 'content-container ready' : 'content-container'
    }`}>
      <div className="flex flex-col items-left">
        <div className={`transition-opacity duration-300 ${contentReady ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="mr-2 text-2xl font-semibold tracking-tight mt-8">
            My Interviews
          </h2>
          <h3 className="text-sm tracking-tight text-gray-600 font-medium">
            Start getting responses now!
          </h3>
        </div>
        
        <div className={`dashboard-grid relative mt-4 transition-all duration-300 ${
          contentReady ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
        }`}>
          {/* Always render the create card or disabled card to maintain layout */}
          {isTrialOver ? (
            <CreateInterviewDisabledCard />
          ) : (
            <div className="create-card-wrapper">
              <CreateInterviewCard />
            </div>
          )}
          
          {/* Content area with stable dimensions */}
          <div className="flex flex-wrap gap-3 async-content">
            {shouldShowLoader ? (
              <InterviewsLoader />
            ) : (
              <div className="transition-all duration-200">
                {interviewCards}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={handleModalClose}>
          <UpgradeModalContent />
        </Modal>
      )}

      {/* Welcome Modal */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        userName={user?.email}
        onClose={handleWelcomeModalClose}
      />
    </main>
  );
}

// Export memoized component
export default memo(Interviews);
