import { Question } from "@/types/interview";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuestionCardProps {
  questionNumber: number;
  questionData: Question;
  onQuestionChange: (id: string, question: Question) => void;
  onDelete: (id: string) => void;
}

const questionCard = ({
  questionNumber,
  questionData,
  onQuestionChange,
  onDelete,
}: QuestionCardProps) => {
  return (
    <Card className="shadow-md w-full">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-3">
          <CardTitle className="text-lg">Question {questionNumber}</CardTitle>
          <div className="flex flex-row items-center space-x-2">
            <h3 className="text-sm font-semibold whitespace-nowrap">Depth Level:</h3>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className={`text-xs h-7 hover:bg-indigo-800 ${
                        questionData?.follow_up_count == 1
                          ? "bg-indigo-600"
                          : "opacity-50"
                      }`}
                      onClick={() =>
                        onQuestionChange(questionData.id, {
                          ...questionData,
                          follow_up_count: 1,
                        })
                      }
                    >
                      Low
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-200">
                    <p className="text-zinc-800">Brief follow-up</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className={`text-xs h-7 hover:bg-indigo-800 ${
                        questionData?.follow_up_count == 2
                          ? "bg-indigo-600"
                          : "opacity-50"
                      }`}
                      onClick={() =>
                        onQuestionChange(questionData.id, {
                          ...questionData,
                          follow_up_count: 2,
                        })
                      }
                    >
                      Medium
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-200">
                    <p className="text-zinc-800">Moderate follow-up</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className={`text-xs h-7 hover:bg-indigo-800 ${
                        questionData?.follow_up_count == 3
                          ? "bg-indigo-600"
                          : "opacity-50"
                      }`}
                      onClick={() =>
                        onQuestionChange(questionData.id, {
                          ...questionData,
                          follow_up_count: 3,
                        })
                      }
                    >
                      High
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-200">
                    <p className="text-zinc-800">In-depth follow-up</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        <div className="flex flex-row items-start gap-3">
          <textarea
            value={questionData?.question}
            className="flex-1 min-h-[80px] p-3 border-2 rounded-md border-gray-400 resize-none"
            placeholder="e.g. Can you tell me about a challenging project you've worked on?"
            onChange={(e) =>
              onQuestionChange(questionData.id, {
                ...questionData,
                question: e.target.value,
              })
            }
            onBlur={(e) =>
              onQuestionChange(questionData.id, {
                ...questionData,
                question: e.target.value.trim(),
              })
            }
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
            onClick={() => onDelete(questionData.id)}
          >
            <Trash2 size={20} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default questionCard;
