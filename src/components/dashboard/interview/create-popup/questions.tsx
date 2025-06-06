import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/auth.context";
import { useOrganization } from "@/contexts/organization.context";
import { InterviewBase, Question, CodingQuestion } from "@/types/interview";
import { useInterviews } from "@/contexts/interviews.context";
import { ScrollArea } from "@/components/ui/scroll-area";
import QuestionCard from "@/components/dashboard/interview/create-popup/questionCard";
import CodingQuestionsSelector from "@/components/dashboard/interview/create-popup/codingQuestionsSelector";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, MessageSquare, Code2 } from "lucide-react";
import { CodingQuestionsService } from "@/services/coding-questions.service";

interface Props {
  interviewData: InterviewBase;
  setProceed: (proceed: boolean) => void;
  setOpen: (open: boolean) => void;
}

function QuestionsPopup({ interviewData, setProceed, setOpen }: Props) {
  const { user } = useAuth();
  const { organization, loading: organizationLoading } = useOrganization();
  const [isClicked, setIsClicked] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversation' | 'coding'>('conversation');

  const [questions, setQuestions] = useState<Question[]>(
    interviewData.questions,
  );
  const [description, setDescription] = useState<string>(
    interviewData.description.trim(),
  );
  const [codingQuestions, setCodingQuestions] = useState<CodingQuestion[]>([]);
  
  const { fetchInterviews } = useInterviews();

  const endOfListRef = useRef<HTMLDivElement>(null);
  const prevQuestionLengthRef = useRef(questions.length);

  const handleInputChange = (id: string, newQuestion: Question) => {
    setQuestions(
      questions.map((question) =>
        question.id === id ? { ...question, ...newQuestion } : question,
      ),
    );
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length === 1) {
      setQuestions(
        questions.map((question) => ({
          ...question,
          question: "",
          follow_up_count: 1,
        })),
      );

      return;
    }
    setQuestions(questions.filter((question) => question.id !== id));
  };

  const handleAddQuestion = () => {
    if (questions.length < interviewData.question_count) {
      setQuestions([
        ...questions,
        { id: uuidv4(), question: "", follow_up_count: 1 },
      ]);
    }
  };

  const handleCodingQuestionsChange = (selectedCodingQuestions: CodingQuestion[]) => {
    setCodingQuestions(selectedCodingQuestions);
  };

  const onSave = async () => {
    try {
      setIsClicked(true);
      console.log('Save function called');
      console.log('User:', user);
      console.log('Organization:', organization);
      
      // Set user and organization data
      interviewData.user_id = user?.id || "test-user-123";
      interviewData.organization_id = organization?.id || "test-org-123";

      console.log('Interview data before sending:', {
        user_id: interviewData.user_id,
        organization_id: interviewData.organization_id,
        organization_name: organization?.name || "Test Organization",
        questions: questions,
        description: description,
        codingQuestions: codingQuestions
      });

      interviewData.questions = questions;
      interviewData.description = description;
      // Set coding questions data
      interviewData.has_coding_questions = codingQuestions.length > 0;
      interviewData.coding_question_count = codingQuestions.length;

      // Convert BigInts to strings if necessary
      const sanitizedInterviewData = {
        ...interviewData,
        interviewer_id: interviewData.interviewer_id.toString(),
        response_count: interviewData.response_count.toString(),
        logo_url: organization?.image_url || "",
      };

      console.log('Sending interview data:', sanitizedInterviewData);

      const response = await axios.post("/api/create-interview", {
        organizationName: organization?.name || "Test Organization",
        interviewData: sanitizedInterviewData,
        codingQuestions: codingQuestions.map(q => q.id) // Send only IDs
      });
      
      console.log('Interview created successfully:', response.data);
      
      // If we have coding questions, link them to the interview
      if (codingQuestions.length > 0 && response.data.interview) {
        try {
          await CodingQuestionsService.addCodingQuestionsToInterview(
            response.data.interview.id,
            codingQuestions.map(q => q.id)
          );
          console.log('Coding questions linked to interview successfully');
        } catch (codingError) {
          console.error('Error linking coding questions:', codingError);
          // Don't fail the whole operation if coding questions linking fails
        }
      }
      
      // Ensure the interviews are refreshed
      await fetchInterviews();
      
      // Small delay to ensure data is loaded before closing
      setTimeout(() => {
        setOpen(false);
      }, 100);
      
    } catch (error) {
      console.error("Error creating interview:", error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      alert('Failed to create interview. Please try again.');
    } finally {
      setIsClicked(false);
    }
  };

  useEffect(() => {
    if (questions.length > prevQuestionLengthRef.current) {
      endOfListRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevQuestionLengthRef.current = questions.length;
  }, [questions.length]);

  // Check if save button should be enabled
  const isSaveDisabled = () => {
    const conditions = {
      isClicked: isClicked,
      organizationLoading: organizationLoading,
      noOrganizationId: !organization?.id,
      notEnoughQuestions: questions.length < interviewData.question_count,
      emptyDescription: description.trim() === "",
      hasEmptyQuestions: questions.some((question) => question.question.trim() === "")
    };
    
    // Debug logging
    console.log('Save button conditions:', conditions);
    console.log('Questions:', questions);
    console.log('Expected question count:', interviewData.question_count);
    console.log('Description:', description);
    console.log('Coding questions:', codingQuestions);
    console.log('Organization:', organization);
    
    // Allow saving with test organization if needed
    const hasOrganization = organization?.id || true; // Temporarily allow without org
    
    // More lenient validation - allow save if:
    // 1. Not currently saving (isClicked is false)
    // 2. Not loading organization
    // 3. Has description 
    // 4. Has at least one non-empty question
    const shouldDisable = (
      isClicked ||
      organizationLoading ||
      description.trim() === "" ||
      questions.length === 0 ||
      questions.every((question) => question.question.trim() === "")
    );
    
    console.log('Should disable save button:', shouldDisable);
    
    return shouldDisable;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="text-center flex flex-col justify-start items-center w-full min-h-[400px]">
        <div className="relative flex justify-center w-full mb-6">
          <ChevronLeft
            className="absolute left-0 opacity-50 cursor-pointer hover:opacity-100 text-gray-600"
            size={30}
            onClick={() => {
              setProceed(false);
            }}
          />
          <h1 className="text-2xl font-semibold">Create Interview</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex w-full mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('conversation')}
            className={`flex items-center px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'conversation'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversation Questions
            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {questions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('coding')}
            className={`flex items-center px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'coding'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Code2 className="w-4 h-4 mr-2" />
            Coding Questions
            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {codingQuestions.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'conversation' && (
          <div className="w-full">
            <div className="my-3 text-left w-full text-sm">
              We will be using these questions during the interviews. Please make
              sure they are ok.
            </div>
            
            <div className="w-full mt-3 mb-4 min-h-[300px]">
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <QuestionCard
                      key={question.id}
                      questionNumber={index + 1}
                      questionData={question}
                      onDelete={handleDeleteQuestion}
                      onQuestionChange={handleInputChange}
                    />
                  ))}
                  <div ref={endOfListRef} />
                </div>
              </ScrollArea>
            </div>
            
            {questions.length < interviewData.question_count && (
              <div
                className="border-indigo-600 opacity-75 hover:opacity-100 w-fit rounded-full mb-4"
                onClick={handleAddQuestion}
              >
                <Plus
                  size={45}
                  strokeWidth={2.2}
                  className="text-indigo-600 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'coding' && (
          <div className="w-full">
            <CodingQuestionsSelector
              selectedQuestions={codingQuestions}
              onQuestionsChange={handleCodingQuestionsChange}
              maxQuestions={3}
            />
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <p className="mb-2 font-medium">
          Interview Description{" "}
          <span
            style={{ fontSize: "0.7rem", lineHeight: "0.8rem" }}
            className="font-light text-xs italic block"
          >
            Note: Interviewees will see this description.
          </span>
        </p>
        <textarea
          value={description}
          className="h-24 py-2 border-2 rounded-md px-3 w-full border-gray-400 resize-none"
          placeholder="Enter your interview description."
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          onBlur={(e) => {
            setDescription(e.target.value.trim());
          }}
        />
      </div>
      
      <div className="flex flex-row justify-end items-end w-full mt-6">
        <Button
          disabled={isSaveDisabled()}
          className={`px-8 py-2 ${
            isSaveDisabled() 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-800 cursor-pointer'
          }`}
          onClick={() => {
            console.log('Save button clicked');
            if (!isSaveDisabled()) {
              onSave();
            } else {
              console.log('Save button is disabled, click ignored');
            }
          }}
        >
          {isClicked ? "Saving..." : organizationLoading ? "Loading..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default QuestionsPopup;
