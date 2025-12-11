import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TransitionData } from '../types';

interface CustomerJourneyProps {
  transitions: TransitionData[];
}

const CustomerJourney: React.FC<CustomerJourneyProps> = ({ transitions }) => {
  
  const getProbability = (from: string, to: string) => {
    const transition = transitions.find(t => t.fromState === from && t.toState === to);
    return transition ? transition.probability : 0;
  };

  const silverChurnProb = getProbability('Silver', 'Churn');
  const silverUpgradeProb = getProbability('Silver', 'Gold');
  const newToSilverProb = getProbability('New', 'Silver');
  
  // Dynamic Stroke Widths
  const strokeWidths = {
    newSilver: Math.max(2, newToSilverProb * 10),
    silverGold: Math.max(2, silverUpgradeProb * 20), // Emphasize upgrade path
    silverChurn: Math.max(1, silverChurnProb * 10)
  };

  return (
    <div className="space-y-6">
       <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">The Journey</h2>
          <p className="text-slate-400">Markov Chain Analysis (Probability Matrix)</p>
       </div>

       <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 backdrop-blur-sm min-h-[500px] flex items-center justify-between relative overflow-hidden">
          
          {/* Nodes */}
          {['New', 'Silver', 'Gold', 'Churn'].map((state, i) => (
             <div key={state} className="relative z-10 flex flex-col items-center gap-4">
                <div className={`w-24 h-24 rounded-2xl border flex items-center justify-center shadow-2xl transition-all duration-500
                   ${state === 'Gold' ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.2)]' : 
                     state === 'Churn' ? 'bg-rose-500/10 border-rose-500 text-rose-400' :
                     'bg-slate-800/50 border-slate-600 text-slate-300'
                   }
                `}>
                   <span className="font-bold text-lg">{state}</span>
                </div>
                <div className="text-xs font-mono text-slate-500">State {i + 1}</div>
             </div>
          ))}

          {/* Dynamic Flow Visualization */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
             <defs>
               <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
                 <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
               </marker>
             </defs>

             {/* New to Silver */}
             <motion.path 
                d="M 150 250 C 300 250, 300 250, 450 250" 
                stroke="#8b5cf6" 
                strokeWidth={strokeWidths.newSilver} 
                fill="none" 
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5 }}
             />
             
             {/* Silver to Gold */}
             <motion.path 
                d="M 550 250 C 700 250, 700 250, 850 250" 
                stroke="#fbbf24" 
                strokeWidth={strokeWidths.silverGold} 
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
             />
             
             {/* Silver to Churn (Curved down) */}
             <motion.path 
                d="M 550 280 C 700 400, 900 400, 1150 280" 
                stroke="#f43f5e" 
                strokeWidth={strokeWidths.silverChurn} 
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.8 }}
             />
          </svg>
       </div>

       {/* Dynamic Insights Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="p-4 bg-slate-900/60 rounded-xl border border-rose-500/20"
          >
             <h4 className="text-rose-400 font-bold mb-1">Retention Alert</h4>
             <p className="text-sm text-slate-300">
                Markov model predicts <span className="font-bold text-white">{(silverChurnProb * 100).toFixed(0)}%</span> of Silver users will churn next month.
             </p>
          </motion.div>

          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 1.1 }}
             className="p-4 bg-slate-900/60 rounded-xl border border-amber-500/20"
          >
             <h4 className="text-amber-400 font-bold mb-1">Upgrade Path</h4>
             <p className="text-sm text-slate-300">
                <span className="font-bold text-white">{(silverUpgradeProb * 100).toFixed(0)}%</span> organic upgrade rate from Silver to Gold.
             </p>
          </motion.div>

          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 1.2 }}
             className="p-4 bg-slate-900/60 rounded-xl border border-violet-500/20"
          >
             <h4 className="text-violet-400 font-bold mb-1">Acquisition Velocity</h4>
             <p className="text-sm text-slate-300">
                Strong adoption with <span className="font-bold text-white">{(newToSilverProb * 100).toFixed(0)}%</span> of new users maturing directly to Silver tier.
             </p>
          </motion.div>
       </div>
    </div>
  );
};

export default CustomerJourney;