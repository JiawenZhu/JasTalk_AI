"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { useResponses } from "@/contexts/responses.context";
import Image from "next/image";
import axios from "axios";
import { RetellWebClient } from "retell-client-js-sdk";
import MiniLoader from "../loaders/mini-loader/miniLoader";
import { toast } from "sonner";
import { isLightColor, testEmail } from "@/lib/utils";
import { ResponseService } from "@/services/responses.service";
import { Interview } from "@/types/interview";
import { FeedbackData } from "@/types/response";
import { FeedbackService } from "@/services/feedback.service";
import { FeedbackForm } from "@/components/call/feedbackForm";
import {
  TabSwitchWarning,
  useTabSwitchPrevention,
} from "./tabSwitchPrevention";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InterviewerService } from "@/services/interviewers.service";
import { CodingQuestionsService } from "@/services/coding-questions.service";
import { CodingQuestion } from "@/types/interview";
import CodingEnvironment from "@/components/coding/CodingEnvironment";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, MessageSquare, Code2, ChevronLeft, ChevronRight, AlarmClockIcon, XCircleIcon, CheckCircleIcon, ArrowUpRight } from 'lucide-react';
import { CodingProblem } from '@/components/coding/ProblemStatement';

const webClient = new RetellWebClient();

type InterviewProps = {
  interview: Interview;
};

type registerCallResponseType = {
  data: {
    registerCallResponse: {
      call_id: string;
      access_token: string;
    };
  };
};

type transcriptType = {
  role: string;
  content: string;
};

// Convert CodingQuestion to CodingProblem format
const convertToCodingProblem = (question: CodingQuestion): CodingProblem => {
  return {
    id: question.id,
    title: question.title,
    difficulty: question.difficulty,
    description: question.description,
    examples: question.examples || [],
    constraints: question.constraints || [],
    testCases: (question.test_cases || []).map((tc, index) => ({
      id: `test-${index}`,
      input: tc.input,
      expectedOutput: tc.expected_output,
      explanation: undefined,
      isHidden: tc.is_hidden
    })),
    hints: question.hints || [],
    timeLimit: question.time_limit,
    memoryLimit: question.memory_limit
  };
};

function Call({ interview }: InterviewProps) {
  const { createResponse } = useResponses();
  const [lastInterviewerResponse, setLastInterviewerResponse] =
    useState<string>("");
  const [lastUserResponse, setLastUserResponse] = useState<string>("");
  const [activeTurn, setActiveTurn] = useState<string>("");
  const [Loading, setLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
  const [isOldUser, setIsOldUser] = useState<boolean>(false);
  const [callId, setCallId] = useState<string>("");
  const { tabSwitchCount } = useTabSwitchPrevention();
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [interviewerImg, setInterviewerImg] = useState("");
  const [interviewTimeDuration, setInterviewTimeDuration] =
    useState<string>("1");
  const [time, setTime] = useState(0);
  const [currentTimeDuration, setCurrentTimeDuration] = useState<string>("0");

  // NEW: Coding Environment State
  const [activeTab, setActiveTab] = useState<'conversation' | 'coding'>('conversation');
  const [codingQuestions, setCodingQuestions] = useState<CodingQuestion[]>([]);
  const [currentCodingQuestionIndex, setCurrentCodingQuestionIndex] = useState(0);
  const [hasCodingQuestions, setHasCodingQuestions] = useState(false);

  const lastUserResponseRef = useRef<HTMLDivElement | null>(null);

  // NEW: Load coding questions if interview has them
  useEffect(() => {
    const loadCodingQuestions = async () => {
      if (interview.has_coding_questions) {
        try {
          const questions = await CodingQuestionsService.getCodingQuestionsForInterview(interview.id);
          if (questions.length > 0) {
            const codingQuestionData = questions.map(q => q.coding_question).filter(Boolean) as CodingQuestion[];
            setCodingQuestions(codingQuestionData);
            setHasCodingQuestions(true);
          }
        } catch (error) {
          console.error('Error loading coding questions:', error);
        }
      }
    };

    loadCodingQuestions();
  }, [interview.id, interview.has_coding_questions]);

  const handleFeedbackSubmit = async (
    formData: Omit<FeedbackData, "interview_id">,
  ) => {
    try {
      const result = await FeedbackService.submitFeedback({
        ...formData,
        interview_id: interview.id,
      });

      if (result) {
        toast.success("Thank you for your feedback!");
        setIsFeedbackSubmitted(true);
        setIsDialogOpen(false);
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("An error occurred. Please try again later.");
    }
  };

  const handleCodingExecute = async (code: string, language: string) => {
    try {
      const response = await fetch('/api/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          testCases: codingQuestions[currentCodingQuestionIndex]?.test_cases?.map(tc => ({
            input: tc.input,
            expectedOutput: tc.expected_output
          })) || []
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Execution failed');
      }

      return result;
    } catch (error) {
      console.error('Execution error:', error);
      throw error;
    }
  };

  const handleCodingSubmit = async (code: string, language: string) => {
    try {
      const response = await fetch('/api/submit-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          problemId: codingQuestions[currentCodingQuestionIndex]?.id,
          interviewId: interview.id,
          responseId: callId // Use call ID as response reference
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      toast.success(`Code submitted! Score: ${result.score}/100`, {
        description: `${result.testResults.passed}/${result.testResults.total} test cases passed`,
      });

      return result;
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Submission failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  useEffect(() => {
    if (lastUserResponseRef.current) {
      const { current } = lastUserResponseRef;
      current.scrollTop = current.scrollHeight;
    }
  }, [lastUserResponse]);

  useEffect(() => {
    let intervalId: any;
    if (isCalling) {
      // setting time from 0 to 1 every 10 milisecond using javascript setInterval method
      intervalId = setInterval(() => setTime(time + 1), 10);
    }
    setCurrentTimeDuration(String(Math.floor(time / 100)));
    if (Number(currentTimeDuration) == Number(interviewTimeDuration) * 60) {
      webClient.stopCall();
      setIsEnded(true);
    }

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCalling, time, currentTimeDuration]);

  useEffect(() => {
    if (testEmail(email)) {
      setIsValidEmail(true);
    }
  }, [email]);

  useEffect(() => {
    webClient.on("call_started", () => {
      console.log("Call started");
      setIsCalling(true);
    });

    webClient.on("call_ended", () => {
      console.log("Call ended");
      setIsCalling(false);
      setIsEnded(true);
    });

    webClient.on("agent_start_talking", () => {
      setActiveTurn("agent");
    });

    webClient.on("agent_stop_talking", () => {
      // Optional: Add any logic when agent stops talking
      setActiveTurn("user");
    });

    webClient.on("error", (error) => {
      console.error("An error occurred:", error);
      webClient.stopCall();
      setIsEnded(true);
      setIsCalling(false);
    });

    webClient.on("update", (update) => {
      if (update.transcript) {
        const transcripts: transcriptType[] = update.transcript;
        const roleContents: { [key: string]: string } = {};

        transcripts.forEach((transcript) => {
          roleContents[transcript?.role] = transcript?.content;
        });

        setLastInterviewerResponse(roleContents["agent"]);
        setLastUserResponse(roleContents["user"]);
      }
      //TODO: highlight the newly uttered word in the UI
    });

    return () => {
      // Clean up event listeners
      webClient.removeAllListeners();
    };
  }, []);

  const onEndCallClick = async () => {
    if (isStarted) {
      setLoading(true);
      webClient.stopCall();
      setIsEnded(true);
      setLoading(false);
    } else {
      setIsEnded(true);
    }
  };

  const startConversation = async () => {
    const data = {
      mins: interview?.time_duration,
      objective: interview?.objective,
      questions: interview?.questions.map((q) => q.question).join(", "),
      name: name || "not provided",
    };
    setLoading(true);

    try {
      console.log("Starting conversation for interview:", interview.id);
      
      // Get old user emails with error handling
      let oldUserEmails: string[] = [];
      try {
        const emailResponse = await ResponseService.getAllEmails(interview.id);
        oldUserEmails = emailResponse.map((item) => item.email);
        console.log("Retrieved old user emails:", oldUserEmails);
      } catch (error) {
        console.error("Failed to get old user emails:", error);
        // Continue without old user check in development
        if (process.env.NODE_ENV === 'development') {
          console.log("Continuing without old user email check in development");
        } else {
          throw error;
        }
      }

      const OldUser =
        oldUserEmails.includes(email) ||
        (interview?.respondents && !interview?.respondents.includes(email));

      if (OldUser) {
        console.log("User identified as old user");
        setIsOldUser(true);
      } else {
        console.log("Registering new call");
        
        try {
          const registerCallResponse: registerCallResponseType = await axios.post(
            "/api/register-call",
            { dynamic_data: data, interviewer_id: interview?.interviewer_id },
          );
          
          console.log("Register call response received");
          
          if (registerCallResponse.data.registerCallResponse.access_token) {
            console.log("Starting web call with access token");
            
            await webClient
              .startCall({
                accessToken:
                  registerCallResponse.data.registerCallResponse.access_token,
              })
              .catch((error) => {
                console.error("Error starting web call:", error);
                throw error;
              });
              
            setIsCalling(true);
            setIsStarted(true);
            setCallId(registerCallResponse?.data?.registerCallResponse?.call_id);

            console.log("Creating response record");
            const response = await createResponse({
              interview_id: interview.id,
              call_id: registerCallResponse.data.registerCallResponse.call_id,
              email: email,
              name: name,
            });
            console.log("Response created:", response);
          } else {
            console.error("Failed to register call - no access token received");
            throw new Error("No access token received from register call");
          }
        } catch (error) {
          console.error("Error during call registration:", error);
          // Show user-friendly error message
          if (axios.isAxiosError(error)) {
            console.error("Axios error details:", {
              status: error.response?.status,
              data: error.response?.data,
              message: error.message
            });
          }
          throw error;
        }
      }
    } catch (error) {
      console.error("Error in startConversation:", error);
      // Handle error gracefully - maybe show a toast or error message
      // For now, just log it
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interview?.time_duration) {
      setInterviewTimeDuration(interview?.time_duration);
    }
  }, [interview]);

  useEffect(() => {
    const fetchInterviewer = async () => {
      const interviewer = await InterviewerService.getInterviewer(
        interview.interviewer_id,
      );
      setInterviewerImg(interviewer.image);
    };
    fetchInterviewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview.interviewer_id]);

  useEffect(() => {
    if (isEnded) {
      const updateInterview = async () => {
        await ResponseService.saveResponse(
          { is_ended: true, tab_switch_count: tabSwitchCount },
          callId,
        );
      };

      updateInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnded]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {isStarted && <TabSwitchWarning />}
      <div className="bg-white rounded-md md:w-[80%] w-[90%]">
        <Card className="h-[88vh] rounded-lg border-2 border-b-4 border-r-4 border-black text-xl font-bold transition-all md:block dark:border-white overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="m-4 h-[15px] rounded-lg border-[1px] border-black flex-shrink-0">
              <div
                className=" bg-indigo-600 h-[15px] rounded-lg"
                style={{
                  width: isEnded
                    ? "100%"
                    : `${
                        (Number(currentTimeDuration) /
                          (Number(interviewTimeDuration) * 60)) *
                        100
                      }%`,
                }}
              />
            </div>
            <CardHeader className="items-center p-1 flex-shrink-0">
              {!isEnded && (
                <CardTitle className="flex flex-row items-center text-lg md:text-xl font-bold mb-2">
                  {interview?.name}
                </CardTitle>
              )}
              {!isEnded && (
                <div className="flex mt-2 flex-row">
                  <AlarmClockIcon
                    className="text-indigo-600 h-[1rem] w-[1rem] rotate-0 scale-100  dark:-rotate-90 dark:scale-0 mr-2 font-bold"
                    style={{ color: interview.theme_color }}
                  />
                  <div className="text-sm font-normal">
                    Expected duration:{" "}
                    <span
                      className="font-bold"
                      style={{ color: interview.theme_color }}
                    >
                      {interviewTimeDuration} mins{" "}
                    </span>
                    or less
                  </div>
                </div>
              )}
            </CardHeader>
            <div className="flex-1 min-h-0 flex flex-col">
              {!isStarted && !isEnded && !isOldUser && (
                <div className="w-fit min-w-[400px] max-w-[400px] mx-auto mt-2  border border-indigo-200 rounded-md p-2 m-2 bg-slate-50">
                  <div>
                    {interview?.logo_url && (
                      <div className="p-1 flex justify-center">
                        <Image
                          src={interview?.logo_url}
                          alt="Logo"
                          className="h-10 w-auto"
                          width={100}
                          height={100}
                        />
                      </div>
                    )}
                    <div className="p-2 font-normal text-sm mb-4 whitespace-pre-line">
                      {interview?.description}
                      <p className="font-bold text-sm">
                        {"\n"}Ensure your volume is up and grant microphone access
                        when prompted. Additionally, please make sure you are in a
                        quiet environment.
                        {"\n\n"}Note: Tab switching will be recorded.
                      </p>
                    </div>
                    {!interview?.is_anonymous && (
                      <div className="flex flex-col gap-2 justify-center">
                        <div className="flex justify-center">
                          <input
                            value={email}
                            className="h-fit mx-auto py-2 border-2 rounded-md w-[75%] self-center px-2 border-gray-400 text-sm font-normal"
                            placeholder="Enter your email address"
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-center">
                          <input
                            value={name}
                            className="h-fit mb-4 mx-auto py-2 border-2 rounded-md w-[75%] self-center px-2 border-gray-400 text-sm font-normal"
                            placeholder="Enter your first name"
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-[80%] flex flex-row mx-auto justify-center items-center align-middle">
                    <Button
                      className="min-w-20 h-10 rounded-lg flex flex-row justify-center mb-8"
                      style={{
                        backgroundColor: interview.theme_color ?? "#4F46E5",
                        color: isLightColor(interview.theme_color ?? "#4F46E5")
                          ? "black"
                          : "white",
                      }}
                      disabled={
                        Loading ||
                        (!interview?.is_anonymous && (!isValidEmail || !name))
                      }
                      onClick={startConversation}
                    >
                      {!Loading ? "Start Interview" : <MiniLoader />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger>
                        <Button
                          className="bg-white border ml-2 text-black min-w-15 h-10 rounded-lg flex flex-row justify-center mb-8"
                          style={{ borderColor: interview.theme_color }}
                          disabled={Loading}
                        >
                          Exit
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-indigo-600 hover:bg-indigo-800"
                            onClick={async () => {
                              await onEndCallClick();
                            }}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
              {isStarted && !isEnded && !isOldUser && (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Tab Navigation - only show if has coding questions */}
                  {hasCodingQuestions && (
                    <div className="flex w-full border-b border-gray-200 bg-gray-50 flex-shrink-0">
                      <button
                        onClick={() => setActiveTab('conversation')}
                        className={`flex items-center px-6 py-3 font-medium text-sm transition-colors ${
                          activeTab === 'conversation'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Conversation
                      </button>
                      <button
                        onClick={() => setActiveTab('coding')}
                        className={`flex items-center px-6 py-3 font-medium text-sm transition-colors ${
                          activeTab === 'coding'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Code2 className="w-4 h-4 mr-2" />
                        Coding Challenge
                        {codingQuestions.length > 0 && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                            {currentCodingQuestionIndex + 1}/{codingQuestions.length}
                          </span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Tab Content */}
                  {(!hasCodingQuestions || activeTab === 'conversation') && (
                    <div className="flex flex-row flex-1 min-h-0">
                      <div className="border-x-2 border-grey w-[50%] flex flex-col">
                        <div
                          className={`text-[18px] w-[90%] md:text-[20px] mx-auto px-4 py-4 overflow-y-auto flex-1 min-h-0 leading-relaxed`}
                        >
                          {lastInterviewerResponse}
                        </div>
                        <div className="flex flex-col mx-auto justify-center items-center align-middle py-4 flex-shrink-0">
                          <Image
                            src={interviewerImg}
                            alt="Image of the interviewer"
                            width={120}
                            height={120}
                            className={`object-cover object-center mx-auto my-auto ${
                              activeTurn === "agent"
                                ? `border-4 border-[${interview.theme_color}] rounded-full`
                                : ""
                            }`}
                          />
                          <div className="font-semibold mt-2">Interviewer</div>
                        </div>
                      </div>

                      <div className="flex flex-col w-[50%]">
                        <div
                          ref={lastUserResponseRef}
                          className={`text-[18px] w-[90%] md:text-[20px] mx-auto px-4 py-4 overflow-y-auto flex-1 min-h-0 leading-relaxed`}
                        >
                          {lastUserResponse}
                        </div>
                        <div className="flex flex-col mx-auto justify-center items-center align-middle py-4 flex-shrink-0">
                          <Image
                            src={`/user-icon.png`}
                            alt="Picture of the user"
                            width={120}
                            height={120}
                            className={`object-cover object-center mx-auto my-auto ${
                              activeTurn === "user"
                                ? `border-4 border-[${interview.theme_color}] rounded-full`
                                : ""
                            }`}
                          />
                          <div className="font-semibold mt-2">You</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Coding Environment Tab */}
                  {hasCodingQuestions && activeTab === 'coding' && codingQuestions.length > 0 && (
                    <div className="flex-1 min-h-0 p-4">
                      <CodingEnvironment
                        problem={convertToCodingProblem(codingQuestions[currentCodingQuestionIndex])}
                        onExecute={handleCodingExecute}
                        onSubmit={handleCodingSubmit}
                      />
                      
                      {/* Question Navigation */}
                      {codingQuestions.length > 1 && (
                        <div className="flex justify-center items-center mt-4 p-4 bg-gray-50 rounded-lg">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentCodingQuestionIndex(Math.max(0, currentCodingQuestionIndex - 1))}
                            disabled={currentCodingQuestionIndex === 0}
                            className="mr-4"
                          >
                            Previous Question
                          </Button>
                          <span className="text-sm text-gray-600 mx-4">
                            Question {currentCodingQuestionIndex + 1} of {codingQuestions.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentCodingQuestionIndex(Math.min(codingQuestions.length - 1, currentCodingQuestionIndex + 1))}
                            disabled={currentCodingQuestionIndex === codingQuestions.length - 1}
                            className="ml-4"
                          >
                            Next Question
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {isStarted && !isEnded && !isOldUser && (
              <div className="items-center p-2 flex-shrink-0">
                <AlertDialog>
                  <AlertDialogTrigger className="w-full">
                    <Button
                      className=" bg-white text-black border  border-indigo-600 h-10 mx-auto flex flex-row justify-center mb-8"
                      disabled={Loading}
                    >
                      End Interview{" "}
                      <XCircleIcon className="h-[1.5rem] ml-2 w-[1.5rem] rotate-0 scale-100  dark:-rotate-90 dark:scale-0 text-red" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This action will end the
                        call.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-indigo-600 hover:bg-indigo-800"
                        onClick={async () => {
                          await onEndCallClick();
                        }}
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            {isEnded && !isOldUser && (
              <div className="w-fit min-w-[400px] max-w-[400px] mx-auto mt-2  border border-indigo-200 rounded-md p-2 m-2 bg-slate-50  absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                <div>
                  <div className="p-2 font-normal text-base mb-4 whitespace-pre-line">
                    <CheckCircleIcon className="h-[2rem] w-[2rem] mx-auto my-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-indigo-500 " />
                    <p className="text-lg font-semibold text-center">
                      {isStarted
                        ? `Thank you for taking the time to participate in this interview`
                        : "Thank you very much for considering."}
                    </p>
                    <p className="text-center">
                      {"\n"}
                      You can close this tab now.
                    </p>
                  </div>

                  {!isFeedbackSubmitted && (
                    <AlertDialog
                      open={isDialogOpen}
                      onOpenChange={setIsDialogOpen}
                    >
                      <AlertDialogTrigger className="w-full flex justify-center">
                        <Button
                          className="bg-indigo-600 text-white h-10 mt-4 mb-4"
                          onClick={() => setIsDialogOpen(true)}
                        >
                          Provide Feedback
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <FeedbackForm
                          email={email}
                          onSubmit={handleFeedbackSubmit}
                        />
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )}
            {isOldUser && (
              <div className="w-fit min-w-[400px] max-w-[400px] mx-auto mt-2  border border-indigo-200 rounded-md p-2 m-2 bg-slate-50  absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                <div>
                  <div className="p-2 font-normal text-base mb-4 whitespace-pre-line">
                    <CheckCircleIcon className="h-[2rem] w-[2rem] mx-auto my-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-indigo-500 " />
                    <p className="text-lg font-semibold text-center">
                      You have already responded in this interview or you are
                      not eligible to respond. Thank you!
                    </p>
                    <p className="text-center">
                      {"\n"}
                      You can close this tab now.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
        <a
          className="flex flex-row justify-center align-middle mt-3"
          href="https://folo-up.co/"
          target="_blank"
        >
          <div className="text-center text-md font-semibold mr-2  ">
            Powered by{" "}
            <span className="font-bold">
              Folo<span className="text-indigo-600">Up</span>
            </span>
          </div>
          <ArrowUpRight className="h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-indigo-500 " />
        </a>
      </div>
    </div>
  );
}

export default Call;
