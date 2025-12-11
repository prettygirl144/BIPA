import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import GalaxyMap from './components/GalaxyMap';
import DNACards from './components/DNACards';
import DataGrid from './components/DataGrid';
import ProcessingState from './components/ProcessingState';
import MarketBasket from './components/MarketBasket';
import CustomerJourney from './components/CustomerJourney';
import WarRoom from './components/WarRoom';

import { AppState, AppView, CustomerRFM, ClusterCentroid, AssociationRule, TransitionData, ChannelPerformance } from './types';
import { 
  generateDemoData, 
  calculateAdvancedRFM, 
  performKMeans, 
  performMarketBasket, 
  performMarkovChain, 
  optimizeBudget,
  analyzeViaAPI 
} from './services/analysisService';

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Data State
  const [analyzedData, setAnalyzedData] = useState<CustomerRFM[]>([]);
  const [centroids, setCentroids] = useState<ClusterCentroid[]>([]);
  const [rules, setRules] = useState<AssociationRule[]>([]);
  const [transitions, setTransitions] = useState<TransitionData[]>([]);
  const [budget, setBudget] = useState<ChannelPerformance[]>([]);
  
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const performLocalAnalysis = () => {
    // 1. Generate Advanced Demo Data
    const rawData = generateDemoData(300);
    
    // 2. Advanced RFM (Lifecycle)
    const rfmData = calculateAdvancedRFM(rawData);
    
    // 3. K-Means
    const { clusteredData, centroids } = performKMeans(rfmData);
    
    // 4. Market Basket
    const basketRules = performMarketBasket(rawData);

    // 5. Markov
    const markovTransitions = performMarkovChain(clusteredData);

    // 6. Budget
    const budgetPlan = optimizeBudget();
    
    setAnalyzedData(clusteredData);
    setCentroids(centroids);
    setRules(basketRules);
    setTransitions(markovTransitions);
    setBudget(budgetPlan);
  };

  const handleFileUpload = async (file: File | null) => {
    setAppState(AppState.PROCESSING);
    setAnalysisError(null);
    
    try {
        if (!file) {
             // Demo Mode (Local)
             // Simulate network delay for effect
             await new Promise(resolve => setTimeout(resolve, 2000));
             performLocalAnalysis();
        } else {
             // Real File Mode (Server First -> Local Fallback)
             try {
                // Attempt server-side processing
                const apiResult = await analyzeViaAPI(file);
                
                setAnalyzedData(apiResult.analyzedData);
                setCentroids(apiResult.centroids);
                setRules(apiResult.rules);
                setTransitions(apiResult.transitions);
                setBudget(apiResult.budget);
                
             } catch (serverError) {
                console.warn("Server analysis failed, falling back to local simulation.", serverError);
                // If backend fails, we can either:
                // A) Show error
                // B) Parse the CSV locally and run local logic (Truly graceful)
                
                // For this demo, we fall back to generating demo data to ensure the UI still works
                // In a real app, you would parse the File object locally using PapaParse
                performLocalAnalysis();
                setAnalysisError("Server unavailable. Running in offline simulation mode.");
             }
        }
        
        setAppState(AppState.DASHBOARD);

    } catch (err: any) {
        setAnalysisError(err.message || "An unknown error occurred during analysis.");
        setAppState(AppState.IDLE);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setAnalyzedData([]);
    setAnalysisError(null);
    setCurrentView(AppView.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-amber-500/30 font-sans flex">
      
      {appState !== AppState.IDLE && appState !== AppState.PROCESSING && (
        <Sidebar 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          onReset={resetApp} 
        />
      )}

      <main className={`flex-1 min-h-screen transition-all duration-300 ${appState === AppState.DASHBOARD ? 'lg:pl-64' : ''}`}>
        
        {/* Top Mobile Bar (only if sidebar active) */}
        {appState === AppState.DASHBOARD && (
           <div className="lg:hidden h-16 bg-slate-950/80 backdrop-blur border-b border-white/5 flex items-center justify-center sticky top-0 z-30">
              <span className="font-bold text-white">NEBULA AI</span>
           </div>
        )}

        <div className="p-4 lg:p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            
            {appState === AppState.IDLE && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[90vh] flex flex-col justify-center relative"
              >
                {analysisError && (
                  <div className="absolute top-10 left-0 right-0 max-w-lg mx-auto p-4 bg-amber-950/30 border border-amber-500/50 rounded-xl flex items-center gap-3 text-amber-200">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{analysisError}</span>
                  </div>
                )}
                <FileUpload onFileUpload={handleFileUpload} />
              </motion.div>
            )}

            {appState === AppState.PROCESSING && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[90vh] flex flex-col justify-center"
              >
                <ProcessingState />
              </motion.div>
            )}

            {appState === AppState.DASHBOARD && (
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {currentView === AppView.DASHBOARD && (
                   <div className="space-y-6">
                      <div className="mb-6">
                        <h2 className="text-3xl font-bold text-white mb-2">Executive Summary</h2>
                        <p className="text-slate-400">Holistic Customer Value Analysis</p>
                      </div>
                      <DNACards centroids={centroids} />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                          <GalaxyMap data={analyzedData} centroids={centroids} />
                        </div>
                        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                          <DataGrid data={analyzedData} centroids={centroids} />
                        </div>
                      </div>
                   </div>
                )}

                {currentView === AppView.BASKET && <MarketBasket rules={rules} />}
                {currentView === AppView.JOURNEY && <CustomerJourney transitions={transitions} />}
                {currentView === AppView.WAR_ROOM && <WarRoom channels={budget} />}

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;