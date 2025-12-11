import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CustomerRFM, ClusterCentroid } from '../types';

interface GalaxyMapProps {
  data: CustomerRFM[];
  centroids: ClusterCentroid[];
}

const GalaxyMap: React.FC<GalaxyMapProps> = ({ data, centroids }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-slate-300 font-mono text-sm tracking-wider uppercase">Cluster Map (Recency vs Monetary)</h3>
        <div className="flex gap-4">
          {centroids.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}` }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] bg-slate-900/30 rounded-xl border border-white/5 p-4 backdrop-blur-sm">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              type="number" 
              dataKey="recency" 
              name="Recency" 
              unit=" days" 
              stroke="#475569" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              type="number" 
              dataKey="monetary" 
              name="Monetary" 
              unit=" $" 
              stroke="#475569" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3', stroke: '#ffffff20' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as CustomerRFM;
                  const cluster = centroids.find(c => c.id === d.cluster);
                  
                  return (
                    <div className="bg-slate-950/90 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-xl min-w-[200px]">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-white font-mono text-xs font-bold">{d.customerID}</p>
                        {cluster && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-black" style={{ backgroundColor: cluster.color }}>
                                {cluster.label}
                            </span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                             <span className="text-slate-500">Spend:</span>
                             <span className="text-amber-400 font-mono">${d.monetary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                             <span className="text-slate-500">Recency:</span>
                             <span className="text-violet-400 font-mono">{d.recency} days ago</span>
                        </div>
                        <div className="flex justify-between text-xs">
                             <span className="text-slate-500">Freq:</span>
                             <span className="text-slate-300 font-mono">{d.frequency} orders</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Customers" data={data} fill="#8884d8">
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={centroids[entry.cluster || 0]?.color || '#fff'} 
                  fillOpacity={0.8}
                  strokeWidth={0}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GalaxyMap;