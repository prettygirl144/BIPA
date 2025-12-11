import React from 'react';
import { motion } from 'framer-motion';
import { ChannelPerformance } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface WarRoomProps {
  channels: ChannelPerformance[];
}

const WarRoom: React.FC<WarRoomProps> = ({ channels }) => {
  const data = channels.map(c => ({ name: c.channel, value: c.suggestedSpend }));
  const COLORS = ['#fbbf24', '#8b5cf6', '#f43f5e', '#3b82f6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">The War Room</h2>
          <p className="text-slate-400">AI Budget Allocation • Linear Programming Optimization</p>
        </div>
        <div className="text-right">
           <p className="text-xs text-slate-500 uppercase tracking-wider">Total Budget</p>
           <p className="text-2xl font-mono text-white">$10,000</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Allocation Chart */}
         <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm h-[300px]">
             <h3 className="text-slate-300 font-mono text-sm uppercase mb-4">Optimized Mix</h3>
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
             </ResponsiveContainer>
         </div>

         {/* Channel Details */}
         <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
             {channels.map((c, i) => (
                 <motion.div
                    key={c.channel}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-slate-900/60 border border-white/10 rounded-xl p-5"
                 >
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-white">{c.channel}</h4>
                        <span className={`text-xs px-2 py-1 rounded font-mono ${c.suggestedSpend > c.currentSpend ? 'bg-green-900/30 text-green-400' : 'bg-rose-900/30 text-rose-400'}`}>
                           {c.suggestedSpend > c.currentSpend ? 'INCREASE' : 'DECREASE'}
                        </span>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Current Spend</span>
                            <span className="text-slate-400 font-mono">${c.currentSpend}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">AI Recommendation</span>
                            <span className="text-white font-mono font-bold">${c.suggestedSpend}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">ROAS</span>
                            <span className="text-amber-400 font-mono">{c.roas}x</span>
                        </div>
                    </div>
                 </motion.div>
             ))}
         </div>
      </div>
    </div>
  );
};

export default WarRoom;