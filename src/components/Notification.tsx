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
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-24 right-8 max-w-sm bg-white rounded-lg shadow-lg overflow-hidden border border-blue-100"
        >
          <div className="relative">
            {/* Decorative top pattern */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400"></div>
            
            {/* Close button */}
            <button 
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="p-5">
              {/* Icon and title */}
              <div className="flex items-center mb-3">
                <div className="mr-3 bg-blue-100 p-2 rounded-full">
                  <Award className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Project Ratings Available!</h3>
              </div>
              
              {/* Content */}
              <p className="text-gray-600 mb-3">
                Curious about your project's quality? Submit your GitHub repo for a comprehensive AI evaluation and get personalized feedback!
              </p>
              
              {/* Rating preview */}
              <div className="flex items-center mb-4 bg-gray-50 p-2 rounded">
                <div className="flex mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={16} 
                      className={star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">Find out your score!</span>
              </div>
              
              {/* Action button */}
              <button
                onClick={onGetRated}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center"
              >
                <span>Rate My Project</span>
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectRatingNotification;