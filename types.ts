export interface CustomerTransaction {
  customerID: string;
  amount: number;
  date: string;
  category: string;
  channel: string;
}

export interface CustomerRFM {
  customerID: string;
  recency: number;
  frequency: number;
  monetary: number;
  cluster?: number;
  score?: number;
  // Advanced Metrics
  churnRisk: number; // 0-100%
  predictedCLV: number;
  nextPurchasePrediction: number; // Days
  avgInterPurchaseTime: number;
  segmentLabel?: string; // Gold/Silver/Bronze
}

export interface ClusterCentroid {
  id: number;
  label: string;
  color: string;
  icon: string;
  description: string;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
  count: number;
}

// Market Basket Analysis
export interface AssociationRule {
  antecedents: string[];
  consequents: string[];
  support: number;
  confidence: number;
  lift: number;
}

// Markov Chain
export interface TransitionData {
  fromState: string;
  toState: string;
  probability: number;
}

// Budget Optimization
export interface ChannelPerformance {
  channel: string;
  currentSpend: number;
  cac: number; // Customer Acquisition Cost
  roas: number; // Return on Ad Spend
  suggestedSpend: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  BASKET = 'BASKET',
  JOURNEY = 'JOURNEY',
  WAR_ROOM = 'WAR_ROOM'
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  PROCESSING = 'PROCESSING',
  DASHBOARD = 'DASHBOARD'
}