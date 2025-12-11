import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const steps = [
  "Parsing CSV Structure...",
  "Calculating Recency, Frequency, Monetary...",
  "Initializing K-Means Algorithm...",
  "Optimizing Centroids (Iteration 1)...",
  "Optimizing Centroids (Iteration 5)...",
  "Labeling Clusters...",
  "Finalizing Visualization..."
];

const ProcessingState = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative w-24 h-24 mb-8">
         <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
         <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
         <div className="absolute inset-4 bg-amber-500/10 rounded-full blur-md animate-pulse"></div>
      </div>
      
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="h-8"
      >
        <p className="text-lg font-mono text-amber-400 tracking-wider">
          {steps[currentStep]}
        </p>
      </motion.div>
      
      <div className="mt-4 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
            className="h-full bg-gradient-to-r from-amber-400 to-violet-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

export default ProcessingState;