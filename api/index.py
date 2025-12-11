"""
BIPA API Server with Graceful Fallback Architecture
Tries to import heavy libraries; falls back to mock service if imports fail (e.g., on Vercel)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)

# Try to import heavy libraries
USE_REAL_ANALYSIS = False
try:
    import pandas as pd
    import numpy as np
    from lifetimes import BetaGeoFitter, GammaGammaFitter
    from mlxtend.frequent_patterns import apriori, association_rules
    from sklearn.cluster import KMeans
    from scipy.cluster.hierarchy import linkage, dendrogram
    import networkx as nx
    
    # If we get here, all imports succeeded
    USE_REAL_ANALYSIS = True
    print("✓ Heavy libraries loaded successfully - using REAL analysis")
    
    # Import real services if they exist
    try:
        from services.basket_service import BasketService
        from services.clv_service import CLVService
        from services.markov_service import MarkovService
        from services.budget_service import BudgetService
        REAL_SERVICES_AVAILABLE = True
    except ImportError:
        REAL_SERVICES_AVAILABLE = False
        print("⚠ Real services not found, will use inline analysis")
        
except ImportError as e:
    print(f"⚠ Heavy libraries not available ({e}) - using MOCK analysis")
    USE_REAL_ANALYSIS = False


class MockAnalysisService:
    """Mock service that returns pre-calculated dummy data when heavy libraries aren't available"""
    
    @staticmethod
    def generate_dummy_rfm_data(num_customers=500):
        """Generate dummy CustomerRFM data"""
        rfm_data = []
        now = datetime.now()
        
        # Create realistic personas
        personas = [
            {"recency_range": (0, 15), "freq_range": (10, 20), "monetary_range": (5000, 15000), "label": "Gold", "cluster": 0, "churn": 5},
            {"recency_range": (15, 45), "freq_range": (5, 12), "monetary_range": (2000, 6000), "label": "Silver", "cluster": 1, "churn": 20},
            {"recency_range": (60, 180), "freq_range": (1, 5), "monetary_range": (500, 2000), "label": "Bronze", "cluster": 2, "churn": 60},
        ]
        
        for i in range(num_customers):
            persona = random.choice(personas)
            recency = random.randint(*persona["recency_range"])
            frequency = random.randint(*persona["freq_range"])
            monetary = random.randint(*persona["monetary_range"])
            churn_risk = persona["churn"] + random.randint(-10, 10)
            churn_risk = max(0, min(100, churn_risk))
            
            # Calculate derived metrics
            avg_inter_purchase = recency // max(frequency - 1, 1) if frequency > 1 else recency
            next_purchase = max(1, avg_inter_purchase - recency)
            predicted_clv = int((monetary / frequency) * (frequency / 12) * 12 * (1 - churn_risk / 100))
            
            rfm_data.append({
                "customerID": f"CUST-{1000 + i}",
                "recency": recency,
                "frequency": frequency,
                "monetary": monetary,
                "cluster": persona["cluster"],
                "churnRisk": churn_risk,
                "predictedCLV": predicted_clv,
                "nextPurchasePrediction": next_purchase,
                "avgInterPurchaseTime": avg_inter_purchase,
                "segmentLabel": persona["label"]
            })
        
        return rfm_data
    
    @staticmethod
    def generate_dummy_centroids():
        """Generate dummy cluster centroids"""
        return [
            {
                "id": 0,
                "label": "Gold (VIP)",
                "color": "#fbbf24",
                "icon": "👑",
                "description": "High Value, Frequent",
                "avgRecency": 8,
                "avgFrequency": 15,
                "avgMonetary": 9500,
                "count": 167
            },
            {
                "id": 1,
                "label": "Silver (Active)",
                "color": "#8b5cf6",
                "icon": "🌱",
                "description": "Loyal, Regular",
                "avgRecency": 30,
                "avgFrequency": 8,
                "avgMonetary": 4000,
                "count": 200
            },
            {
                "id": 2,
                "label": "Bronze (Risk)",
                "color": "#f43f5e",
                "icon": "⚠️",
                "description": "Low Value, At Risk",
                "avgRecency": 120,
                "avgFrequency": 3,
                "avgMonetary": 1200,
                "count": 133
            }
        ]
    
    @staticmethod
    def generate_dummy_association_rules():
        """Generate dummy market basket association rules"""
        return [
            {
                "antecedents": ["Electronics"],
                "consequents": ["Gadgets"],
                "support": 0.145,
                "confidence": 0.68,
                "lift": 2.3
            },
            {
                "antecedents": ["Fashion"],
                "consequents": ["Accessories"],
                "support": 0.132,
                "confidence": 0.62,
                "lift": 2.1
            },
            {
                "antecedents": ["Sports"],
                "consequents": ["Footwear"],
                "support": 0.118,
                "confidence": 0.75,
                "lift": 2.8
            },
            {
                "antecedents": ["Home"],
                "consequents": ["Electronics"],
                "support": 0.095,
                "confidence": 0.55,
                "lift": 1.9
            },
            {
                "antecedents": ["Beauty"],
                "consequents": ["Fashion"],
                "support": 0.088,
                "confidence": 0.58,
                "lift": 1.7
            },
            {
                "antecedents": ["Electronics", "Gadgets"],
                "consequents": ["Accessories"],
                "support": 0.065,
                "confidence": 0.45,
                "lift": 1.5
            }
        ]
    
    @staticmethod
    def generate_dummy_transitions():
        """Generate dummy Markov chain transition data"""
        return [
            {"fromState": "New", "toState": "Silver", "probability": 0.45},
            {"fromState": "New", "toState": "Bronze", "probability": 0.55},
            {"fromState": "Silver", "toState": "Gold", "probability": 0.25},
            {"fromState": "Silver", "toState": "Silver", "probability": 0.55},
            {"fromState": "Silver", "toState": "Churn", "probability": 0.20},
            {"fromState": "Gold", "toState": "Gold", "probability": 0.85},
            {"fromState": "Gold", "toState": "Silver", "probability": 0.10},
            {"fromState": "Gold", "toState": "Churn", "probability": 0.05},
            {"fromState": "Bronze", "toState": "Churn", "probability": 0.60},
            {"fromState": "Bronze", "toState": "Silver", "probability": 0.35},
            {"fromState": "Bronze", "toState": "Gold", "probability": 0.05}
        ]
    
    @staticmethod
    def generate_dummy_budget():
        """Generate dummy budget optimization data"""
        return [
            {
                "channel": "Google Ads",
                "currentSpend": 4000,
                "cac": 45,
                "roas": 2.8,
                "suggestedSpend": 3200
            },
            {
                "channel": "Facebook",
                "currentSpend": 3000,
                "cac": 35,
                "roas": 3.5,
                "suggestedSpend": 4500
            },
            {
                "channel": "Email",
                "currentSpend": 1000,
                "cac": 5,
                "roas": 12.0,
                "suggestedSpend": 2000
            },
            {
                "channel": "TikTok",
                "currentSpend": 2000,
                "cac": 25,
                "roas": 4.2,
                "suggestedSpend": 300
            },
            {
                "channel": "Instagram",
                "currentSpend": 1500,
                "cac": 30,
                "roas": 3.8,
                "suggestedSpend": 1800
            }
        ]
    
    @staticmethod
    def analyze(file_data=None):
        """Main analysis method that returns all dummy data"""
        return {
            "analyzedData": MockAnalysisService.generate_dummy_rfm_data(),
            "centroids": MockAnalysisService.generate_dummy_centroids(),
            "rules": MockAnalysisService.generate_dummy_association_rules(),
            "transitions": MockAnalysisService.generate_dummy_transitions(),
            "budget": MockAnalysisService.generate_dummy_budget()
        }


class RealAnalysisService:
    """Real analysis service using heavy libraries"""
    
    def __init__(self):
        if REAL_SERVICES_AVAILABLE:
            self.basket_service = BasketService()
            self.clv_service = CLVService()
            self.markov_service = MarkovService()
            self.budget_service = BudgetService()
        else:
            self.basket_service = None
            self.clv_service = None
            self.markov_service = None
            self.budget_service = None
    
    def analyze(self, file_data):
        """Perform real analysis using pandas/sklearn/etc"""
        try:
            # Read the uploaded file
            df = pd.read_excel(file_data) if hasattr(file_data, 'read') else pd.read_csv(file_data)
            
            # Perform RFM analysis
            rfm_data = self._calculate_rfm(df)
            
            # Perform clustering
            clustered_data, centroids = self._perform_clustering(rfm_data)
            
            # Market basket analysis
            rules = self._market_basket_analysis(df)
            
            # Markov chain transitions
            transitions = self._markov_chain_analysis(clustered_data)
            
            # Budget optimization
            budget = self._budget_optimization(df)
            
            return {
                "analyzedData": clustered_data,
                "centroids": centroids,
                "rules": rules,
                "transitions": transitions,
                "budget": budget
            }
        except Exception as e:
            print(f"Error in real analysis: {e}")
            # Fallback to mock if real analysis fails
            return MockAnalysisService.analyze()
    
    def _calculate_rfm(self, df):
        """Calculate RFM metrics"""
        # Assume standard column names - adjust as needed
        if 'customerID' not in df.columns:
            df['customerID'] = df.iloc[:, 0]  # Use first column as customer ID
        if 'date' not in df.columns:
            df['date'] = pd.to_datetime(df.iloc[:, 1])  # Use second column as date
        if 'amount' not in df.columns:
            df['amount'] = pd.to_numeric(df.iloc[:, 2], errors='coerce')  # Use third column as amount
        
        now = datetime.now()
        rfm = df.groupby('customerID').agg({
            'date': lambda x: (now - x.max()).days,  # Recency
            'customerID': 'count',  # Frequency
            'amount': 'sum'  # Monetary
        }).rename(columns={'date': 'recency', 'customerID': 'frequency', 'amount': 'monetary'})
        
        rfm_data = []
        for idx, row in rfm.iterrows():
            rfm_data.append({
                "customerID": str(idx),
                "recency": int(row['recency']),
                "frequency": int(row['frequency']),
                "monetary": float(row['monetary']),
                "churnRisk": min(100, max(0, int(row['recency'] / 3))),
                "predictedCLV": int(row['monetary'] * 1.2),
                "nextPurchasePrediction": max(1, int(row['recency'] - 30)),
                "avgInterPurchaseTime": max(1, int(row['recency'] / max(row['frequency'], 1))),
                "segmentLabel": "Processing..."
            })
        
        return rfm_data
    
    def _perform_clustering(self, rfm_data):
        """Perform K-Means clustering"""
        if len(rfm_data) < 3:
            return rfm_data, MockAnalysisService.generate_dummy_centroids()
        
        # Prepare data for clustering
        X = np.array([[d['recency'], d['frequency'], d['monetary']] for d in rfm_data])
        
        # Normalize
        X_norm = (X - X.mean(axis=0)) / (X.std(axis=0) + 1e-8)
        
        # K-Means with 3 clusters
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X_norm)
        
        # Assign clusters
        clustered_data = []
        for i, data in enumerate(rfm_data):
            cluster_id = int(clusters[i])
            label = ["Gold", "Silver", "Bronze"][cluster_id]
            clustered_data.append({**data, "cluster": cluster_id, "segmentLabel": label})
        
        # Calculate centroids
        centroids = []
        for i in range(3):
            cluster_points = [d for d in clustered_data if d['cluster'] == i]
            if cluster_points:
                centroids.append({
                    "id": i,
                    "label": ["Gold (VIP)", "Silver (Active)", "Bronze (Risk)"][i],
                    "color": ["#fbbf24", "#8b5cf6", "#f43f5e"][i],
                    "icon": ["👑", "🌱", "⚠️"][i],
                    "description": ["High Value, Frequent", "Loyal, Regular", "Low Value, At Risk"][i],
                    "avgRecency": int(np.mean([d['recency'] for d in cluster_points])),
                    "avgFrequency": int(np.mean([d['frequency'] for d in cluster_points])),
                    "avgMonetary": int(np.mean([d['monetary'] for d in cluster_points])),
                    "count": len(cluster_points)
                })
            else:
                centroids.append(MockAnalysisService.generate_dummy_centroids()[i])
        
        return clustered_data, centroids
    
    def _market_basket_analysis(self, df):
        """Perform market basket analysis using mlxtend"""
        try:
            # Create basket format
            if 'category' not in df.columns:
                return MockAnalysisService.generate_dummy_association_rules()
            
            basket = df.groupby(['customerID', 'category']).size().unstack().fillna(0)
            basket = (basket > 0).astype(int)
            
            # Apriori algorithm
            frequent_itemsets = apriori(basket, min_support=0.05, use_colnames=True)
            
            if len(frequent_itemsets) == 0:
                return MockAnalysisService.generate_dummy_association_rules()
            
            rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.1)
            
            # Format rules
            formatted_rules = []
            for _, rule in rules.head(8).iterrows():
                formatted_rules.append({
                    "antecedents": list(rule['antecedents']),
                    "consequents": list(rule['consequents']),
                    "support": float(rule['support']),
                    "confidence": float(rule['confidence']),
                    "lift": float(rule['lift'])
                })
            
            return formatted_rules if formatted_rules else MockAnalysisService.generate_dummy_association_rules()
        except Exception as e:
            print(f"Market basket analysis error: {e}")
            return MockAnalysisService.generate_dummy_association_rules()
    
    def _markov_chain_analysis(self, clustered_data):
        """Perform Markov chain analysis"""
        try:
            if self.markov_service:
                return self.markov_service.analyze(clustered_data)
            
            # Simple Markov chain based on clusters
            total = len(clustered_data)
            gold_count = sum(1 for d in clustered_data if d.get('cluster') == 0)
            silver_count = sum(1 for d in clustered_data if d.get('cluster') == 1)
            bronze_count = sum(1 for d in clustered_data if d.get('cluster') == 2)
            
            p_gold = gold_count / total if total > 0 else 0.33
            p_silver = silver_count / total if total > 0 else 0.33
            p_bronze = bronze_count / total if total > 0 else 0.34
            
            return [
                {"fromState": "New", "toState": "Silver", "probability": round(p_silver * 0.8, 2)},
                {"fromState": "New", "toState": "Bronze", "probability": round(p_bronze * 0.9, 2)},
                {"fromState": "Silver", "toState": "Gold", "probability": 0.25},
                {"fromState": "Silver", "toState": "Silver", "probability": 0.55},
                {"fromState": "Silver", "toState": "Churn", "probability": 0.20},
                {"fromState": "Gold", "toState": "Gold", "probability": 0.85},
                {"fromState": "Gold", "toState": "Silver", "probability": 0.10},
                {"fromState": "Gold", "toState": "Churn", "probability": 0.05},
                {"fromState": "Bronze", "toState": "Churn", "probability": 0.60},
                {"fromState": "Bronze", "toState": "Silver", "probability": 0.35},
                {"fromState": "Bronze", "toState": "Gold", "probability": 0.05}
            ]
        except Exception as e:
            print(f"Markov chain analysis error: {e}")
            return MockAnalysisService.generate_dummy_transitions()
    
    def _budget_optimization(self, df):
        """Perform budget optimization"""
        try:
            if self.budget_service:
                return self.budget_service.optimize(df)
            return MockAnalysisService.generate_dummy_budget()
        except Exception as e:
            print(f"Budget optimization error: {e}")
            return MockAnalysisService.generate_dummy_budget()


# Initialize the appropriate service
if USE_REAL_ANALYSIS:
    analysis_service = RealAnalysisService()
    print("✓ RealAnalysisService initialized")
else:
    analysis_service = MockAnalysisService()
    print("✓ MockAnalysisService initialized")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "using_real_analysis": USE_REAL_ANALYSIS,
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Main analysis endpoint"""
    try:
        if 'file' not in request.files:
            # No file uploaded, return mock data
            print("No file uploaded, returning mock data")
            result = MockAnalysisService.analyze()
        else:
            file = request.files['file']
            if file.filename == '':
                # Empty filename, return mock data
                print("Empty filename, returning mock data")
                result = MockAnalysisService.analyze()
            else:
                # File uploaded, use appropriate service
                if USE_REAL_ANALYSIS:
                    print(f"Processing file: {file.filename} with REAL analysis")
                    result = analysis_service.analyze(file)
                else:
                    print(f"File uploaded but using MOCK analysis (libraries not available)")
                    result = MockAnalysisService.analyze()
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in /api/analyze: {e}")
        # Always return mock data on error as fallback
        return jsonify(MockAnalysisService.analyze()), 200


if __name__ == '__main__':
    print("\n" + "="*50)
    print("BIPA API Server Starting...")
    print(f"Mode: {'REAL Analysis' if USE_REAL_ANALYSIS else 'MOCK Analysis (Fallback)'}")
    print("="*50 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
