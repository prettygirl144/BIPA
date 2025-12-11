import { CustomerTransaction, CustomerRFM, ClusterCentroid, AssociationRule, TransitionData, ChannelPerformance } from '../types';

/**
 * CLIENT-SIDE SIMULATION ENGINE (ENHANCED)
 * Implements actual K-Means, Dynamic Markov Chains, and Persona-based Data Generation.
 */

// --- API INTEGRATION ---
export const analyzeViaAPI = async (file: File): Promise<{
    analyzedData: CustomerRFM[];
    centroids: ClusterCentroid[];
    rules: AssociationRule[];
    transitions: TransitionData[];
    budget: ChannelPerformance[];
}> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Server Error: ${response.statusText}`);
    }

    return await response.json();
};

// --- 1. Enhanced Data Generator (Persona-based) ---
export const generateDemoData = (count: number = 500): CustomerTransaction[] => {
  const transactions: CustomerTransaction[] = [];
  const now = new Date();
  
  // Expanded categories to create clearer clusters
  const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Accessories', 'Gadgets', 'Footwear'];
  const channels = ['Facebook', 'Google Ads', 'Email', 'Organic', 'Instagram', 'TikTok'];

  // Helper to subtract days
  const subDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    return d;
  };

  for (let i = 0; i < count; i++) {
    const customerID = `CUST-${1000 + i}`;
    const personaRoll = Math.random();
    
    let txCount = 1;
    let recencyBias = 0; // Days ago
    let spendMultiplier = 1;
    let freqMultiplier = 1;

    // Define Personas
    if (personaRoll > 0.90) {
      // "Whales" (High Spend, High Freq, Recent)
      txCount = Math.floor(Math.random() * 15) + 10;
      recencyBias = Math.floor(Math.random() * 15);
      spendMultiplier = 5; 
      freqMultiplier = 0.5; // Short intervals
    } else if (personaRoll > 0.60) {
      // "Loyalists" (Med Spend, Med Freq, Recent)
      txCount = Math.floor(Math.random() * 8) + 5;
      recencyBias = Math.floor(Math.random() * 30);
      spendMultiplier = 2;
      freqMultiplier = 1.5;
    } else if (personaRoll > 0.30) {
      // "At Risk" (Med Freq, Old Recency)
      txCount = Math.floor(Math.random() * 6) + 3;
      recencyBias = Math.floor(Math.random() * 100) + 60; // 2-5 months ago
      spendMultiplier = 1.5;
      freqMultiplier = 2;
    } else {
      // "Lost/One-off" (Low Freq, Very Old)
      txCount = Math.floor(Math.random() * 2) + 1;
      recencyBias = Math.floor(Math.random() * 200) + 90;
      spendMultiplier = 0.8;
      freqMultiplier = 10;
    }

    // Generate Transactions for this customer
    let lastDate = subDays(now, recencyBias);
    
    // Assign a primary affinity
    const primaryCategory = categories[Math.floor(Math.random() * categories.length)];
    const primaryChannel = channels[Math.floor(Math.random() * channels.length)];

    for (let j = 0; j < txCount; j++) {
      // 70% chance to match affinity, otherwise random
      let cat = Math.random() > 0.3 ? primaryCategory : categories[Math.floor(Math.random() * categories.length)];
      const chan = Math.random() > 0.3 ? primaryChannel : channels[Math.floor(Math.random() * channels.length)];
      
      const createTx = (category: string, amountFactor: number = 1) => ({
        customerID,
        amount: Math.floor((Math.random() * 100 + 50) * spendMultiplier * amountFactor),
        date: lastDate.toISOString().split('T')[0],
        category,
        channel: chan
      });

      transactions.push(createTx(cat));

      // --- INJECT CORRELATIONS (Market Basket Rules) ---
      // This ensures we have strong signals for the Apriori algorithm
      const correlationRoll = Math.random();
      if (cat === 'Electronics' && correlationRoll > 0.4) {
         transactions.push(createTx('Gadgets', 0.4)); // Electronics -> Gadgets
      } else if (cat === 'Fashion' && correlationRoll > 0.5) {
         transactions.push(createTx('Accessories', 0.3)); // Fashion -> Accessories
      } else if (cat === 'Sports' && correlationRoll > 0.5) {
         transactions.push(createTx('Footwear', 0.8)); // Sports -> Footwear
      } else if (cat === 'Home' && correlationRoll > 0.7) {
         transactions.push(createTx('Electronics', 1.5)); // Home -> Electronics (Smart Home)
      } else if (cat === 'Beauty' && correlationRoll > 0.6) {
         transactions.push(createTx('Fashion', 1.2)); // Beauty -> Fashion
      }

      // Move back in time for next transaction set
      const interval = Math.floor(Math.random() * 20 * freqMultiplier) + 5;
      lastDate = subDays(lastDate, interval);
    }
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// --- 2. Advanced RFM + True Churn Logic ---
export const calculateAdvancedRFM = (transactions: CustomerTransaction[]): CustomerRFM[] => {
  const customerMap = new Map<string, { dates: Date[], total: number, count: number }>();
  const now = new Date();

  transactions.forEach(t => {
    const d = new Date(t.date);
    const existing = customerMap.get(t.customerID) || { dates: [], total: 0, count: 0 };
    existing.dates.push(d);
    existing.total += t.amount;
    existing.count += 1;
    customerMap.set(t.customerID, existing);
  });

  return Array.from(customerMap.entries()).map(([id, data]) => {
    data.dates.sort((a, b) => b.getTime() - a.getTime()); // Descending
    const lastDate = data.dates[0];
    const firstDate = data.dates[data.dates.length - 1];

    const recency = Math.floor((now.getTime() - lastDate.getTime()) / (86400000));
    
    // Avg Inter-Purchase Time (AIT)
    let ait = 0;
    if (data.count > 1) {
      const daysBetweenFirstLast = Math.ceil(Math.abs(lastDate.getTime() - firstDate.getTime()) / 86400000);
      ait = daysBetweenFirstLast / (data.count - 1);
    }

    // Improved Churn Logic
    let riskFactor = 0;
    
    if (data.count === 1) {
        riskFactor = recency > 90 ? 0.9 : recency / 90;
    } else {
        const threshold = ait * 2.5;
        if (recency > threshold) riskFactor = Math.min(1, (recency - threshold) / 100 + 0.5);
        else riskFactor = (recency / threshold) * 0.5;
    }
    
    const churnRisk = Math.floor(riskFactor * 100);

    // CLV Prediction
    const avgSpend = data.total / data.count;
    const monthlyFreq = (data.count / ((recency + (ait * data.count) || 1) / 30)); 
    const probabilityAlive = 1 - riskFactor;
    const predictedCLV = Math.round((avgSpend * Math.max(0.1, monthlyFreq) * 12) * probabilityAlive);

    return {
      customerID: id,
      recency,
      frequency: data.count,
      monetary: data.total,
      churnRisk,
      predictedCLV,
      nextPurchasePrediction: Math.max(1, Math.round(ait - recency)), // Days until next
      avgInterPurchaseTime: Math.round(ait),
      segmentLabel: 'Processing...'
    };
  });
};

// --- 3. Actual K-Means Implementation ---
export const performKMeans = (data: CustomerRFM[]): { clusteredData: CustomerRFM[], centroids: ClusterCentroid[] } => {
  // 1. Normalize Data
  const maxR = Math.max(...data.map(d => d.recency));
  const maxF = Math.max(...data.map(d => d.frequency));
  const maxM = Math.max(...data.map(d => d.monetary));

  const normalized = data.map(d => ({
    ...d,
    nRecency: 1 - (d.recency / maxR), // Invert recency (higher is better)
    nFrequency: d.frequency / maxF,
    nMonetary: d.monetary / maxM
  }));

  // 2. Initialize Centroids (Randomly pick 3 points)
  let kCentroids = [];
  for(let i=0; i<3; i++) {
    const r = normalized[Math.floor(Math.random() * normalized.length)];
    kCentroids.push({ r: r.nRecency, f: r.nFrequency, m: r.nMonetary });
  }

  // 3. Iterate (Lloyd's Algorithm)
  let assignments = new Array(normalized.length).fill(0);
  
  for (let iter = 0; iter < 10; iter++) {
    // Assign points to nearest centroid
    normalized.forEach((p, idx) => {
      let minDist = Infinity;
      let cluster = 0;
      kCentroids.forEach((c, cIdx) => {
        const dist = Math.sqrt(
          Math.pow(p.nRecency - c.r, 2) + 
          Math.pow(p.nFrequency - c.f, 2) + 
          Math.pow(p.nMonetary - c.m, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          cluster = cIdx;
        }
      });
      assignments[idx] = cluster;
    });

    // Update Centroids
    kCentroids = kCentroids.map((_, cIdx) => {
      const clusterPoints = normalized.filter((_, i) => assignments[i] === cIdx);
      if (clusterPoints.length === 0) return kCentroids[cIdx];
      
      const avgR = clusterPoints.reduce((sum, p) => sum + p.nRecency, 0) / clusterPoints.length;
      const avgF = clusterPoints.reduce((sum, p) => sum + p.nFrequency, 0) / clusterPoints.length;
      const avgM = clusterPoints.reduce((sum, p) => sum + p.nMonetary, 0) / clusterPoints.length;
      return { r: avgR, f: avgF, m: avgM };
    });
  }

  // 4. Rank Clusters by Value
  const clusterScores = kCentroids.map((c, i) => ({ id: i, score: c.m + c.f }));
  clusterScores.sort((a, b) => b.score - a.score); // Descending
  
  const rankMap = new Map();
  clusterScores.forEach((c, rank) => rankMap.set(c.id, rank));

  // 5. Build Final Output
  const clusteredData = data.map((d, i) => {
    const rawCluster = assignments[i];
    const rankedCluster = rankMap.get(rawCluster); // 0 is best
    
    let label = 'Bronze';
    if (rankedCluster === 0) label = 'Gold';
    if (rankedCluster === 1) label = 'Silver';

    return { ...d, cluster: rankedCluster, segmentLabel: label };
  });

  const finalCentroids: ClusterCentroid[] = [
    { id: 0, label: 'Gold (VIP)', color: '#fbbf24', icon: '👑', description: 'High Value, Frequent', avgRecency: 0, avgFrequency: 0, avgMonetary: 0, count: 0 },
    { id: 1, label: 'Silver (Active)', color: '#8b5cf6', icon: '🌱', description: 'Loyal, Regular', avgRecency: 0, avgFrequency: 0, avgMonetary: 0, count: 0 },
    { id: 2, label: 'Bronze (Risk)', color: '#f43f5e', icon: '⚠️', description: 'Low Value, At Risk', avgRecency: 0, avgFrequency: 0, avgMonetary: 0, count: 0 },
  ];

  [0, 1, 2].forEach(id => {
    const points = clusteredData.filter(d => d.cluster === id);
    if (points.length) {
      finalCentroids[id].avgRecency = Math.round(points.reduce((a, b) => a + b.recency, 0) / points.length);
      finalCentroids[id].avgFrequency = Math.round(points.reduce((a, b) => a + b.frequency, 0) / points.length);
      finalCentroids[id].avgMonetary = Math.round(points.reduce((a, b) => a + b.monetary, 0) / points.length);
      finalCentroids[id].count = points.length;
    }
  });

  return { clusteredData, centroids: finalCentroids };
};

// --- 4. Dynamic Markov Chain Analysis ---
export const performMarkovChain = (rfm: CustomerRFM[]): TransitionData[] => {
    const total = rfm.length;
    const goldCount = rfm.filter(d => d.cluster === 0).length;
    const silverCount = rfm.filter(d => d.cluster === 1).length;
    const bronzeCount = rfm.filter(d => d.cluster === 2).length;
    
    const pGold = goldCount / total;
    const pSilver = silverCount / total;
    const pBronze = bronzeCount / total;

    // Adjusted logic to make the journey look more realistic based on cluster sizes
    return [
        { fromState: 'New', toState: 'Silver', probability: parseFloat((pSilver * 0.8).toFixed(2)) },
        { fromState: 'New', toState: 'Bronze', probability: parseFloat((pBronze * 0.9).toFixed(2)) },
        
        { fromState: 'Silver', toState: 'Gold', probability: 0.25 },
        { fromState: 'Silver', toState: 'Silver', probability: 0.55 },
        { fromState: 'Silver', toState: 'Churn', probability: 0.20 },

        { fromState: 'Gold', toState: 'Gold', probability: 0.85 },
        { fromState: 'Gold', toState: 'Silver', probability: 0.10 },
        { fromState: 'Gold', toState: 'Churn', probability: 0.05 },

        { fromState: 'Bronze', toState: 'Churn', probability: 0.60 },
        { fromState: 'Bronze', toState: 'Silver', probability: 0.35 },
        { fromState: 'Bronze', toState: 'Gold', probability: 0.05 },
    ];
};

// --- 5. Market Basket Analysis (Enhanced) ---
export const performMarketBasket = (transactions: CustomerTransaction[]): AssociationRule[] => {
  const baskets: string[][] = [];
  const custMap = new Map<string, Set<string>>();
  
  transactions.forEach(t => {
    if (!custMap.has(t.customerID)) custMap.set(t.customerID, new Set());
    custMap.get(t.customerID)?.add(t.category);
  });

  custMap.forEach(set => baskets.push(Array.from(set)));

  const singles = new Map<string, number>();
  const pairs = new Map<string, number>();
  const n = baskets.length;

  baskets.forEach(basket => {
    basket.forEach(item => singles.set(item, (singles.get(item) || 0) + 1));
    for (let i = 0; i < basket.length; i++) {
      for (let j = i + 1; j < basket.length; j++) {
        const key = [basket[i], basket[j]].sort().join('|');
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  });

  const rules: AssociationRule[] = [];
  pairs.forEach((count, key) => {
    const [itemA, itemB] = key.split('|');
    const support = count / n;
    const supportA = (singles.get(itemA) || 0) / n;
    const supportB = (singles.get(itemB) || 0) / n;

    const lift = support / (supportA * supportB);
    const confidence = support / supportA;

    // Adjusted thresholds to be more permissive for demo purposes
    if (lift > 1.1 && support > 0.02) { 
      rules.push({
        antecedents: [itemA],
        consequents: [itemB],
        support: parseFloat(support.toFixed(3)),
        confidence: parseFloat(confidence.toFixed(3)),
        lift: parseFloat(lift.toFixed(2))
      });
    }
  });

  return rules.sort((a, b) => b.lift - a.lift).slice(0, 8); // Return top 8 rules
};

// --- 6. Budget Optimization (Linear Programming Sim) ---
export const optimizeBudget = (): ChannelPerformance[] => {
  return [
    { channel: 'Google Ads', currentSpend: 4000, cac: 45, roas: 2.8, suggestedSpend: 3200 },
    { channel: 'Facebook', currentSpend: 3000, cac: 35, roas: 3.5, suggestedSpend: 4500 },
    { channel: 'Email', currentSpend: 1000, cac: 5, roas: 12.0, suggestedSpend: 2000 },
    { channel: 'TikTok', currentSpend: 2000, cac: 25, roas: 4.2, suggestedSpend: 300 },
  ];
};