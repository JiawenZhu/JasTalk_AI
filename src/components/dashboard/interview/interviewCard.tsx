import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowUpRight, Code2, Trash2 } from "lucide-react";
import { CopyCheck } from "lucide-react";
import { ResponseService } from "@/services/responses.service";
import { CodingQuestionsService } from "@/services/coding-questions.service";
import axios from "axios";
import MiniLoader from "@/components/loaders/mini-loader/miniLoader";
import { InterviewerService } from "@/services/interviewers.service";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { useDeleteInterview } from "@/hooks/useDeleteInterview";

interface Props {
  name: string | null;
  interviewerId: bigint;
  id: string;
  url: string;
  readableSlug: string;
  hasCodingQuestions?: boolean;
  codingQuestionCount?: number;
  onDeleted?: (interviewId: string) => void;
  showDeleteButton?: boolean;
}

const base_url = process.env.LIVE_URL;

function InterviewCard({ 
  name, 
  interviewerId, 
  id, 
  url, 
  readableSlug,
  hasCodingQuestions = false,
  codingQuestionCount = 0,
  onDeleted,
  showDeleteButton = false
}: Props) {
  const [copied, setCopied] = useState(false);
  const [responseCount, setResponseCount] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [img, setImg] = useState("");
  const [actualHasCoding, setActualHasCoding] = useState(hasCodingQuestions);
  const [actualCodingCount, setActualCodingCount] = useState(codingQuestionCount);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);

  // Don't render if ID is null or invalid
  if (!id || id === 'null' || id === 'undefined') {
    console.warn('InterviewCard: Invalid interview ID provided:', id);
    return null;
  }

  // Hook for handling interview deletion
  const { deleteInterview, isDeleting, deleteError } = useDeleteInterview({
    onSuccess: (interviewId, interviewName) => {
      // Hide the card with animation
      setIsCardVisible(false);
      
      // After animation, call the parent callback
      setTimeout(() => {
        onDeleted?.(interviewId);
      }, 300);
    },
    onError: (error) => {
      console.error('Delete error:', error);
    }
  });

  useEffect(() => {
    const fetchInterviewer = async () => {
      const interviewer =
        await InterviewerService.getInterviewer(interviewerId);
      setImg(interviewer.image);
    };
    fetchInterviewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchCodingQuestions = async () => {
      try {
        const codingQuestions = await CodingQuestionsService.getCodingQuestionsForInterview(id);
        setActualHasCoding(codingQuestions.length > 0);
        setActualCodingCount(codingQuestions.length);
      } catch (error) {
        console.error('Error fetching coding questions for interview:', error);
      }
    };

    const fetchResponses = async () => {
      try {
        const responses = await ResponseService.getAllResponses(id);
        setResponseCount(responses.length);
        if (responses.length > 0) {
          setIsFetching(true);
          for (const response of responses) {
            if (!response.is_analysed) {
              try {
                const result = await axios.post("/api/get-call", {
                  id: response.call_id,
                });

                if (result.status !== 200) {
                  throw new Error(`HTTP error! status: ${result.status}`);
                }
              } catch (error) {
                console.error(
                  `Failed to call api/get-call for response id ${response.call_id}:`,
                  error,
                );
              }
            }
          }
          setIsFetching(false);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchCodingQuestions();
    fetchResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(
        readableSlug ? `${base_url}/call/${readableSlug}` : (url as string),
      )
      .then(
        () => {
          setCopied(true);
          toast.success(
            "The link to your interview has been copied to your clipboard.",
            {
              position: "bottom-right",
              duration: 3000,
            },
          );
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        },
        (err) => {
          console.log("failed to copy", err.mesage);
        },
      );
  };

  const handleJumpToInterview = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const interviewUrl = readableSlug
      ? `/call/${readableSlug}`
      : `/call/${url}`;
    window.open(interviewUrl, "_blank");
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (name) {
      await deleteInterview(id, name);
    }
    setShowDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Don't render if card should be hidden
  if (!isCardVisible) {
    return null;
  }

  return (
    <>
      <a
        href={`/interviews/${id}`}
        style={{
          pointerEvents: isFetching || isDeleting ? "none" : "auto",
          cursor: isFetching || isDeleting ? "default" : "pointer",
        }}
        className={`transition-all duration-300 ${isCardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <Card className="relative p-0 mt-4 inline-block cursor-pointer h-60 w-56 ml-1 mr-3 rounded-xl shrink-0 overflow-hidden shadow-md">
          <CardContent className={`p-0 ${isFetching || isDeleting ? "opacity-60" : ""}`}>
            <div className="w-full h-40 overflow-hidden bg-indigo-600 flex items-center text-center relative">
              <CardTitle className="w-full mt-3 mx-2 text-white text-lg">
                {name}
                {(isFetching || isDeleting) && (
                  <div className="z-100 mt-[-5px]">
                    <MiniLoader />
                  </div>
                )}
              </CardTitle>
              
              {/* Coding Session Indicator */}
              {actualHasCoding && (
                <div className="absolute bottom-3 left-3">
                  <Badge 
                    variant="secondary" 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-xs px-2 py-1 shadow-md"
                  >
                    <Code2 className="w-3 h-3 mr-1" />
                    {actualCodingCount} Coding
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex flex-row items-center mx-4 ">
              <div className="w-full overflow-hidden">
                <Image
                  src={img}
                  alt="Picture of the interviewer"
                  width={70}
                  height={70}
                  className="object-cover object-center"
                />
              </div>
              <div className="text-black text-sm font-semibold mt-2 mr-2 whitespace-nowrap">
                Responses:{" "}
                <span className="font-normal">
                  {responseCount?.toString() || 0}
                </span>
              </div>
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                className="text-xs text-indigo-600 px-1 h-6"
                variant={"secondary"}
                onClick={handleJumpToInterview}
              >
                <ArrowUpRight size={16} />
              </Button>
              <Button
                className={`text-xs text-indigo-600 px-1 h-6  ${
                  copied ? "bg-indigo-300 text-white" : ""
                }`}
                variant={"secondary"}
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  copyToClipboard();
                }}
              >
                {copied ? <CopyCheck size={16} /> : <Copy size={16} />}
              </Button>
              
              {/* Delete Button - Only show if enabled */}
              {showDeleteButton && (
                <Button
                  className="text-xs text-red-600 px-1 h-6 hover:bg-red-100"
                  variant={"secondary"}
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </a>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Interview"
        description="Are you sure you want to delete this interview? This will permanently remove the interview and all associated data including responses, feedback, and coding submissions. This action cannot be undone."
        itemName={name || undefined}
        isLoading={isDeleting}
        destructiveAction="Delete Interview"
      />
    </>
  );
}

export default InterviewCard;
