import React from 'react';
import { motion } from 'framer-motion';
import { ClusterCentroid } from '../types';

interface DNACardsProps {
  centroids: ClusterCentroid[];
}

const DNACards: React.FC<DNACardsProps> = ({ centroids }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {centroids.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 + 0.5 }}
          className="relative group"
        >
          {/* Neon Glow */}
          <div 
            className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-transparent to-transparent opacity-20 group-hover:opacity-60 blur transition duration-500 rounded-2xl"
            style={{ 
               backgroundImage: `linear-gradient(to right, ${c.color}, transparent)` 
            }}
          />
          
          <div className="relative h-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/5"
                style={{ backgroundColor: `${c.color}20`, color: c.color }}
              >
                {c.icon}
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-white/5 text-slate-400">
                {c.count} users
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{c.label}</h3>
            <p className="text-slate-400 text-sm mb-4 min-h-[40px]">{c.description}</p>
            
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Avg Spend</span>
                <span className="text-slate-200">${Math.round(c.avgMonetary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Frequency</span>
                <span className="text-slate-200">{Math.round(c.avgFrequency)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recency</span>
                <span className="text-slate-200">{Math.round(c.avgRecency)} days</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DNACards;