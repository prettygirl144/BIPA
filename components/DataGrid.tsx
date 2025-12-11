import React from 'react';
import { CustomerRFM, ClusterCentroid } from '../types';

interface DataGridProps {
  data: CustomerRFM[];
  centroids: ClusterCentroid[];
}

const DataGrid: React.FC<DataGridProps> = ({ data, centroids }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-slate-300 font-mono text-sm tracking-wider uppercase">High Value Targets</h3>
        <span className="text-xs text-slate-500 font-mono">{data.length} records</span>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-sm">
        <div className="overflow-auto h-full max-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 text-xs font-medium text-slate-400 font-mono uppercase tracking-wider">ID</th>
                <th className="p-4 text-xs font-medium text-slate-400 font-mono uppercase tracking-wider">Segment</th>
                <th className="p-4 text-xs font-medium text-slate-400 font-mono uppercase tracking-wider text-right">Pred. CLV</th>
                <th className="p-4 text-xs font-medium text-slate-400 font-mono uppercase tracking-wider text-right">Churn Risk</th>
                <th className="p-4 text-xs font-medium text-slate-400 font-mono uppercase tracking-wider text-right">Next Buy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.map((row) => {
                 const cluster = centroids[row.cluster || 0];
                 const isHighRisk = row.churnRisk > 70;
                 return (
                  <tr key={row.customerID} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-xs font-mono text-slate-300">{row.customerID}</td>
                    <td className="p-4">
                      <span 
                        className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider"
                        style={{ 
                          backgroundColor: `${cluster.color}15`, 
                          color: cluster.color 
                        }}
                      >
                        {cluster.label.split(' ')[0]}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-200 text-right font-bold">
                        ${row.predictedCLV.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                       <span className={`text-xs font-mono px-2 py-0.5 rounded ${isHighRisk ? 'text-rose-400 bg-rose-900/20' : 'text-slate-400'}`}>
                         {row.churnRisk}%
                       </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-400 text-right">
                        {row.nextPurchasePrediction} days
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataGrid;