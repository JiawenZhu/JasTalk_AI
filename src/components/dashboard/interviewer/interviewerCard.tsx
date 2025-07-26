import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  MicrophoneIcon,
  StarIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import Modal from "@/components/dashboard/Modal";
import { Interviewer } from "@/types/interviewer";
import InterviewerDetailsModal from "@/components/dashboard/interviewer/interviewerDetailsModal";

interface Props {
  interviewer: Interviewer;
}

const InterviewerCard = ({ interviewer }: Props) => {
  const [open, setOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-400';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
              <Image
                src={interviewer.image}
                alt={`${interviewer.name} avatar`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(interviewer.sync_status || 'active')} rounded-full border-2 border-white`}></div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {interviewer.name}
              </h3>
              <div className="flex items-center space-x-1">
                <StarIcon className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-gray-500">4.9</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2 overflow-hidden text-ellipsis">
              {interviewer.description || "Professional AI interviewer ready to help you practice"}
            </p>

            {/* Stats */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <MicrophoneIcon className="w-3 h-3" />
                <span>Voice</span>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-3 h-3" />
                <span>24/7</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
            <div className="text-xs text-gray-500">
              {interviewer.empathy || 7}/10 empathy
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Professional
          </span>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Experienced
          </span>
          {interviewer.sync_status === 'active' && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
              Synced
            </span>
          )}
        </div>
      </motion.div>

      <Modal
        open={open}
        closeOnOutsideClick={true}
        onClose={() => {
          setOpen(false);
        }}
      >
        <InterviewerDetailsModal interviewer={interviewer} />
      </Modal>
    </>
  );
};

export default InterviewerCard;
