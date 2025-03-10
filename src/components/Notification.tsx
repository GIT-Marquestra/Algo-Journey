import React, { useState, useEffect } from 'react';
import { Star, Award, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
//@ts-expect-error : dont know what to do here
const ProjectRatingNotification = ({ onClose, onGetRated }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Show notification after a small delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.95, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 right-6 max-w-xs bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="relative">
            {/* Subtle top pattern */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-300 opacity-75"></div>
            
            {/* Close button */}
            <button 
              onClick={handleClose}
              className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X size={14} />
            </button>
            
            <div className="p-3">
              {/* Icon and title */}
              <div className="flex items-center mb-2">
                <div className="mr-2 bg-blue-50 p-1 rounded-full">
                  <Award className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-700">Project Rating</h3>
              </div>
              
              {/* Content */}
              <p className="text-gray-500 text-xs mb-2">
                Submit your GitHub repo for an AI evaluation and feedback
              </p>
              
              {/* Rating preview */}
              <div className="flex items-center mb-2 bg-gray-50/70 p-1 rounded">
                <div className="flex mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={12} 
                      className={star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} 
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">Discover your score</span>
              </div>
              
              {/* Action button */}
              <button
                onClick={onGetRated}
                className="w-full py-1 px-3 bg-blue-50 text-blue-500 text-xs rounded hover:bg-blue-100 transition-all flex items-center justify-center"
              >
                <span>Rate My Project</span>
                <ChevronRight size={12} className="ml-1" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectRatingNotification;