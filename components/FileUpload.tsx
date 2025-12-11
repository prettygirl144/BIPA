import React, { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, FileSpreadsheet, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFileUpload: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // 1. Check Extension
      const allowedExtensions = ['csv', 'xlsx'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (!ext || !allowedExtensions.includes(ext)) {
        setError(`Invalid file type: .${ext}. Please upload a .csv or .xlsx file.`);
        resolve(false);
        return;
      }

      // 2. Client-side Header Check (CSV Only for this demo)
      if (ext === 'csv') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const firstLine = text.split('\n')[0].toLowerCase();
          
          // Check for required columns
          const required = ['customerid', 'amount', 'date', 'category', 'channel'];
          const missing = required.filter(col => !firstLine.includes(col));

          if (missing.length > 0) {
             setError(`Missing required columns: ${missing.join(', ')}.`);
             resolve(false);
          } else {
             setError(null);
             resolve(true);
          }
        };
        reader.onerror = () => {
            setError("Error reading file.");
            resolve(false);
        }
        reader.readAsText(file.slice(0, 500)); 
      } else {
        setError(null);
        resolve(true);
      }
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const isValid = await validateFile(file);
      if (isValid) {
        startScan(file);
      }
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        const isValid = await validateFile(file);
        if (isValid) {
            startScan(file);
        }
    }
  };

  const startScan = (file: File | null) => {
    setIsScanning(true);
    // Simulate scan delay
    setTimeout(() => {
        onFileUpload(file);
    }, 2000);
  };

  const downloadTemplate = () => {
    const headers = ['customerID,amount,date,category,channel'];
    const rows = [
        'CUST-1001,150,2023-10-01,Electronics,Google Ads',
        'CUST-1001,50,2023-10-15,Electronics,Email',
        'CUST-1002,200,2023-09-05,Fashion,Instagram',
        'CUST-1003,80,2023-11-20,Home,Organic'
    ];
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "nebula_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-200 to-violet-500 font-sans tracking-tight">
          Nebula Intelligence
        </h1>
        <p className="text-slate-400 text-lg font-light max-w-xl mx-auto">
          Upload your raw customer transaction data to unlock predictive cohorts using local-first AI.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Upload Zone */}
        <div className="md:col-span-2">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full h-80 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden cursor-pointer
                ${isDragging 
                    ? 'border-amber-400 bg-amber-900/10 shadow-[0_0_30px_rgba(251,191,36,0.3)]' 
                    : error 
                        ? 'border-rose-500/50 bg-rose-950/10' 
                        : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
                }
                `}
                onClick={() => document.getElementById('fileInput')?.click()}
            >
                <input 
                    type="file" 
                    id="fileInput" 
                    className="hidden" 
                    accept=".csv,.xlsx" 
                    onChange={handleFileSelect} 
                />

                {/* Scanning Effect Overlay */}
                <AnimatePresence>
                {isScanning && (
                    <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-amber-500/5 z-10 pointer-events-none"
                    >
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-400 shadow-[0_0_20px_#fbbf24] animate-scan opacity-70" />
                    </motion.div>
                )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                {!isScanning ? (
                    <motion.div 
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center z-20 pointer-events-none px-6 text-center"
                    >
                    <div className={`p-6 rounded-full mb-4 backdrop-blur-md border border-white/5 transition-colors ${error ? 'bg-rose-900/20' : 'bg-slate-800/50'}`}>
                        {error ? <AlertCircle className="w-10 h-10 text-rose-500" /> : <Upload className="w-10 h-10 text-amber-400" />}
                    </div>
                    {error ? (
                        <div className="text-rose-400 max-w-sm">
                            <p className="font-bold mb-1">Upload Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xl font-medium text-slate-200">
                                Drop CSV or XLSX here
                            </p>
                            <p className="text-sm text-slate-500 mt-2 font-mono">
                                Click to browse files
                            </p>
                        </>
                    )}
                    </motion.div>
                ) : (
                    <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center z-20"
                    >
                    <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
                    <p className="text-amber-400 font-mono text-lg animate-pulse">
                        VALIDATING DATA INTEGRITY...
                    </p>
                    </motion.div>
                )}
                </AnimatePresence>
                
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                    style={{ 
                    backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                    }} 
                />
            </div>
        </div>

        {/* Requirements Card */}
        <div className="md:col-span-1 h-80 rounded-3xl border border-white/5 bg-slate-900/60 p-6 flex flex-col justify-between backdrop-blur-sm">
            <div>
                <div className="flex items-center gap-2 mb-4 text-amber-400">
                    <FileSpreadsheet className="w-5 h-5" />
                    <span className="font-mono text-sm tracking-wider uppercase font-bold">Requirements</span>
                </div>
                <ul className="space-y-4">
                    <li className="flex gap-3 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                        <span>Format must be <span className="font-mono text-slate-400">.csv</span> or <span className="font-mono text-slate-400">.xlsx</span></span>
                    </li>
                    <li className="flex gap-3 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                        <div>
                            <span>Required columns:</span>
                            <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
                                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">CustomerID</span>
                                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Amount</span>
                                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Date</span>
                                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Category</span>
                                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Channel</span>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
            
            <div className="flex flex-col gap-2">
                <button 
                    onClick={downloadTemplate}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium transition-all border border-slate-700 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                >
                    <Download className="w-3 h-3" />
                    Download Template
                </button>
                <button 
                    onClick={() => startScan(null)}
                    className="w-full py-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 hover:text-white font-medium transition-all border border-violet-500/30 hover:border-violet-400/50 text-xs uppercase tracking-widest"
                >
                    Load Demo Data
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;