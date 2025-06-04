import Image from "next/image";
import { CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import ReactAudioPlayer from "react-audio-player";
import { Interviewer } from "@/types/interviewer";

interface Props {
  interviewer: Interviewer | undefined;
}

function InterviewerDetailsModal({ interviewer }: Props) {
  return (
    <div className="text-center w-full max-w-4xl mx-auto px-4">
      <CardTitle className="text-3xl mt-0 p-0 font-semibold mb-6">
        {interviewer?.name}
      </CardTitle>
      <div className="mt-2 p-4 flex flex-col justify-center items-center">
        <div className="flex flex-col lg:flex-row justify-center lg:space-x-12 items-center gap-8 w-full">
          <div className="flex items-center justify-center border-4 overflow-hidden border-gray-500 rounded-xl h-56 w-52 flex-shrink-0">
            <Image
              src={interviewer?.image || ""}
              alt="Picture of the interviewer"
              width={208}
              height={224}
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="flex flex-col gap-6 w-full lg:w-[30rem]">
            <p className="text-base leading-relaxed mt-0 whitespace-normal text-left">
              {interviewer?.description}
            </p>
            {interviewer?.audio && (
              <div className="w-full">
                <ReactAudioPlayer 
                  src={`/audio/${interviewer.audio}`} 
                  controls 
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
        <div className="w-full mt-10">
          <h3 className="text-xl font-medium mb-8">
            Interviewer Settings:
          </h3>
          <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-16 justify-center items-start">
            <div className="flex flex-col justify-start items-start space-y-6 w-full lg:w-auto">
              <div className="flex flex-row justify-between items-center w-full min-w-[250px]">
                <h4 className="w-24 text-left font-medium">Empathy</h4>
                <div className="w-44 space-x-4 ml-4 flex justify-between items-center">
                  <Slider
                    value={[(interviewer?.empathy || 10) / 10]}
                    max={1}
                    step={0.1}
                    disabled
                    className="flex-1"
                  />
                  <span className="w-10 text-left font-semibold">
                    {(interviewer?.empathy || 10) / 10}
                  </span>
                </div>
              </div>
              <div className="flex flex-row justify-between items-center w-full min-w-[250px]">
                <h4 className="w-24 text-left font-medium">Rapport</h4>
                <div className="w-44 space-x-4 ml-4 flex justify-between items-center">
                  <Slider
                    value={[(interviewer?.rapport || 10) / 10]}
                    max={1}
                    step={0.1}
                    disabled
                    className="flex-1"
                  />
                  <span className="w-10 text-left font-semibold">
                    {(interviewer?.rapport || 10) / 10}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-start items-start space-y-6 w-full lg:w-auto">
              <div className="flex flex-row justify-between items-center w-full min-w-[250px]">
                <h4 className="w-24 text-left font-medium">Exploration</h4>
                <div className="w-44 space-x-4 ml-4 flex justify-between items-center">
                  <Slider
                    value={[(interviewer?.exploration || 10) / 10]}
                    max={1}
                    step={0.1}
                    disabled
                    className="flex-1"
                  />
                  <span className="w-10 text-left font-semibold">
                    {(interviewer?.exploration || 10) / 10}
                  </span>
                </div>
              </div>
              <div className="flex flex-row justify-between items-center w-full min-w-[250px]">
                <h4 className="w-24 text-left font-medium">Speed</h4>
                <div className="w-44 space-x-4 ml-4 flex justify-between items-center">
                  <Slider
                    value={[(interviewer?.speed || 10) / 10]}
                    max={1}
                    step={0.1}
                    disabled
                    className="flex-1"
                  />
                  <span className="w-10 text-left font-semibold">
                    {(interviewer?.speed || 10) / 10}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewerDetailsModal;
