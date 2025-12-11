import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssociationRule } from '../types';

interface MarketBasketProps {
  rules: AssociationRule[];
}

const MarketBasket: React.FC<MarketBasketProps> = ({ rules }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 1. Extract unique nodes from rules
  const nodes = useMemo(() => {
    const unique = new Set<string>();
    rules.forEach(r => {
      r.antecedents.forEach(a => unique.add(a));
      r.consequents.forEach(c => unique.add(c));
    });
    return Array.from(unique).sort();
  }, [rules]);

  // 2. Calculate Circular Layout
  const layout = useMemo(() => {
    const radius = 130;
    const centerX = 200;
    const centerY = 200;
    return nodes.map((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
      return {
        id: node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        angle
      };
    });
  }, [nodes]);

  const getPos = (id: string) => layout.find(n => n.id === id) || { x: 200, y: 200 };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Market Basket Analysis</h2>
          <p className="text-slate-400">Apriori Algorithm Results • Network Graph</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Dynamic Graph Visualization */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-sm relative flex items-center justify-center min-h-[400px]">
          {nodes.length === 0 ? (
            <div className="text-slate-500 font-mono text-sm">No significant associations found.</div>
          ) : (
            <svg viewBox="0 0 400 400" className="w-full h-full max-w-[500px] select-none">
              <defs>
                <marker 
                  id="arrowhead" 
                  markerWidth="10" 
                  markerHeight="7" 
                  refX="26" 
                  refY="3.5" 
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
                </marker>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Connections (Rules) */}
              <AnimatePresence>
                {rules.map((rule, i) => {
                  const source = getPos(rule.antecedents[0]);
                  const target = getPos(rule.consequents[0]);
                  const isRelated = hoveredNode ? (rule.antecedents[0] === hoveredNode || rule.consequents[0] === hoveredNode) : true;
                  
                  // Control point for curve
                  const cx = 200;
                  const cy = 200;

                  return (
                    <motion.path
                      key={`link-${i}`}
                      d={`M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth={isRelated ? Math.max(1.5, rule.lift * 0.8) : 1}
                      strokeOpacity={isRelated ? 0.6 : 0.1}
                      markerEnd="url(#arrowhead)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: isRelated ? 1 : 0.1 }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Nodes */}
              {layout.map((node, i) => {
                 const isHovered = hoveredNode === node.id;
                 const isDimmed = hoveredNode && hoveredNode !== node.id;
                 
                 return (
                   <g 
                    key={node.id} 
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: 'pointer' }}
                    className="transition-opacity duration-300"
                    opacity={isDimmed ? 0.3 : 1}
                   >
                      {/* Glow Effect */}
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r={isHovered ? 30 : 24}
                        fill={isHovered ? "rgba(251, 191, 36, 0.1)" : "transparent"}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                      
                      {/* Core Node */}
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r={20}
                        fill="#0f172a"
                        stroke={isHovered ? "#fbbf24" : "#cbd5e1"}
                        strokeWidth={isHovered ? 3 : 2}
                        filter={isHovered ? "url(#glow)" : undefined}
                        whileHover={{ scale: 1.1 }}
                      />
                      
                      {/* Label Background */}
                      <rect 
                        x={node.x - 30} 
                        y={node.y + 24} 
                        width="60" 
                        height="16" 
                        rx="4"
                        fill="#0f172a" 
                        opacity="0.8" 
                      />
                      
                      {/* Label */}
                      <text
                        x={node.x}
                        y={node.y}
                        dy={4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="9"
                        fontWeight="bold"
                        className="pointer-events-none uppercase font-mono"
                      >
                        {node.id.substring(0, 3)}
                      </text>
                      
                      <text
                        x={node.x}
                        y={node.y + 35}
                        textAnchor="middle"
                        fill={isHovered ? "#fbbf24" : "#94a3b8"}
                        fontSize="10"
                        className="pointer-events-none font-medium"
                      >
                        {node.id}
                      </text>
                   </g>
                 );
              })}
            </svg>
          )}
        </div>

        {/* Rules List */}
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
           {rules.map((rule, idx) => (
             <motion.div
               key={idx}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.1 }}
               onMouseEnter={() => setHoveredNode(rule.antecedents[0])}
               onMouseLeave={() => setHoveredNode(null)}
               className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:border-amber-500/30 transition-colors cursor-pointer group"
             >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-mono text-slate-300 border border-slate-700 group-hover:border-amber-500/50 transition-colors">
                        {rule.antecedents[0]}
                    </span>
                    <div className="h-4 w-[1px] bg-slate-700 group-hover:bg-amber-500/50"></div>
                    <span className="px-3 py-1 bg-violet-900/30 rounded-lg text-xs font-mono text-violet-300 border border-violet-500/30">
                        {rule.consequents[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-slate-200 text-sm font-bold group-hover:text-amber-400 transition-colors">
                        {rule.antecedents[0]} ➔ {rule.consequents[0]}
                    </h4>
                    <p className="text-slate-500 text-xs mt-1">
                       Lift: <span className="text-white font-mono font-bold">{(rule.lift).toFixed(2)}x</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <span className="block text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
                        {Math.round(rule.confidence * 100)}%
                   </span>
                   <span className="text-[10px] text-slate-500 uppercase tracking-wider">Confidence</span>
                </div>
             </motion.div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default MarketBasket;