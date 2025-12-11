import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import AgglomerativeClustering
from scipy.cluster.hierarchy import linkage
import statsmodels.api as sm
from scipy.optimize import minimize

# ==============================================================================
# PART A: CLUSTERING ANALYSIS (ALIGNED WITH TEACHING NOTE)
# ==============================================================================

# Load and Clean Clustering Data
try:
    # Load data, skipping initial rows to get to the correct headers/data
    df_raw = pd.read_excel('Clustering_Raw_data.xlsx', header=None)
    
    # Manually assign column names based on the file's structure
    data = df_raw.iloc[4:].copy()
    data.columns = [
        'Store_Id', 'Store_Area', 'Zone',
        'Sales_Total', 'Sales_Crescent', 'Sales_Mix', 'Sales_Poise', 'Sales_Set', 'Sales_Blink', 
        'Disc_Total', 'Disc_Crescent', 'Disc_Mix', 'Disc_Poise', 'Disc_Set', 'Disc_Blink', 
        'COGS_Total', 'COGS_Crescent', 'COGS_Mix', 'COGS_Poise', 'COGS_Set', 'COGS_Blink' 
    ]
    
    # Convert relevant columns to numeric, coercing errors
    cols_to_numeric = data.columns.drop(['Zone', 'Store_Id'])
    for col in cols_to_numeric:
        data[col] = pd.to_numeric(data[col], errors='coerce').fillna(0)

    # --- Q1: Derive Metrics as per Teaching Note ---
    
    # Metric 1: Markdown Sensitivity (add 1 to denominator to avoid division by zero)
    data['Markdown_Sensitivity'] = data['Sales_Total'] / (data['Disc_Total'] + 1)
    
    # Metric 2: Net Profit per Square Foot
    data['Net_Profit'] = data['Sales_Total'] - data['COGS_Total']
    data['NP_Per_SqFt'] = data['Net_Profit'] / data['Store_Area']
    
    # Select the final data for modeling
    data_model = data[['Markdown_Sensitivity', 'NP_Per_SqFt', 'Zone']].copy()
    data_model.replace([np.inf, -np.inf], np.nan, inplace=True)
    data_model.dropna(inplace=True)

    # --- Q2: Treat Outliers ---
    # We cap outliers at the 99th percentile as a robust method
    def treat_outliers(series):
        q99 = series.quantile(0.99)
        return np.where(series > q99, q99, series)
    
    data_model['Markdown_Sensitivity'] = treat_outliers(data_model['Markdown_Sensitivity'])
    data_model['NP_Per_SqFt'] = treat_outliers(data_model['NP_Per_SqFt'])

    # --- Q3 & Q4: Prepare Data for Clustering ---
    
    # Scale numeric features
    scaler = StandardScaler()
    numeric_scaled = scaler.fit_transform(data_model[['Markdown_Sensitivity', 'NP_Per_SqFt']])
    
    # One-Hot Encode the 'Zone' categorical feature
    zone_dummies = pd.get_dummies(data_model['Zone'], prefix='Zone').values
    
    # Combine numeric and categorical features for clustering
    # Note: Gower's distance is ideal, but this is a common proxy with Euclidean distance
    X_cluster = np.hstack([numeric_scaled, zone_dummies])

    # --- Q5: Develop Hierarchical Clustering Model ---
    # Using Ward's method, which minimizes variance within clusters
    Z = linkage(X_cluster, method='ward')
    
    print("--- PART A: CLUSTERING COMPLETE ---")
    print(f"Clustering prepared for {X_cluster.shape[0]} stores using {X_cluster.shape[1]} features.")
    print("Derived metrics (head):")
    print(data_model.head())


except FileNotFoundError:
    print("Clustering_Raw_data.xlsx not found.")

# ==============================================================================
# PART B: TIME SERIES FORECASTING (ALIGNED WITH TEACHING NOTE)
# ==============================================================================

try:
    df_ts = pd.read_csv('2.BLINK.HAREMS.csv')
    df_ts_sorted = df_ts.sort_values(['year_no', 'week_no']).reset_index(drop=True)

    # --- Q10: Feature Engineering for Log-Log Model ---
    
    # Log-transform variables as specified in the teaching note for elasticity modeling
    # Add a small constant to avoid log(0)
    epsilon = 1e-9
    df_ts_sorted['log_sales'] = np.log(df_ts_sorted['sales_units'] + epsilon)
    df_ts_sorted['log_lag_sales'] = np.log(df_ts_sorted['sales_units'].shift(1) + epsilon)
    df_ts_sorted['log_disc'] = np.log(df_ts_sorted['discount_per'] + epsilon)
    df_ts_sorted['log_lag_disc'] = np.log(df_ts_sorted['discount_per'].shift(1) + epsilon)
    df_ts_sorted['promo_flag'] = df_ts_sorted['promo_week_flg']
    
    # --- Q9: Partition Data ---
    train_mask = (df_ts_sorted['year_no'] < 2014) | ((df_ts_sorted['year_no'] == 2014) & (df_ts_sorted['week_no'] <= 51))
    train_data = df_ts_sorted[train_mask].dropna(subset=['log_lag_sales', 'log_lag_disc'])
    
    # --- Q10: Develop Regression Model ---
    X_cols = ['log_lag_sales', 'log_disc', 'log_lag_disc', 'promo_flag', 'age']
    y_col = 'log_sales'
    
    X = sm.add_constant(train_data[X_cols])
    y = train_data[y_col]
    model_log = sm.OLS(y, X).fit()
    
    print("\n--- PART B: FORECASTING COMPLETE ---")
    print("Log-Log Regression Model Summary:")
    # print(model_log.summary()) # Uncomment for full stats summary
    print("\nModel Coefficients:")
    print(model_log.params)
    
except FileNotFoundError:
    print("2.BLINK.HAREMS.csv not found.")
except Exception as e:
    print(f"An error occurred in Part B: {e}")

# ==============================================================================
# PART C: OPTIMIZATION
# ==============================================================================

# --- Q15: Formulate and Solve Optimization Model ---
try:
    # Inputs from the case
    inv_start = 2476
    age_start = 96
    prev_disc = 0.579
    prev_sale = 48
    mrp = 606
    
    # Coefficients from our regression model
    coef = model_log.params
    
    # Objective function to MINIMIZE NEGATIVE REVENUE (which is maximizing revenue)
    def objective_function(discounts):
        # discounts is a list/array of 4 discount values for the EOSS weeks
        total_revenue = 0
        current_inventory = inv_start
        
        # Initialize state from the week prior to EOSS
        log_lag_sales = np.log(prev_sale)
        log_lag_discount = np.log(prev_disc)
        
        for i in range(4): # Loop through the 4 weeks of EOSS
            discount_current_week = discounts[i]
            age_current_week = age_start + i + 1
            is_promo_week = 1 # EOSS weeks are promo weeks
            
            # Predict sales using the log-log model equation
            pred_log_sales = (coef['const'] + 
                              coef['log_lag_sales'] * log_lag_sales +
                              coef['log_disc'] * np.log(discount_current_week) +
                              coef['log_lag_disc'] * log_lag_discount +
                              coef['promo_flag'] * is_promo_week +
                              coef['age'] * age_current_week)
            
            predicted_sales = np.exp(pred_log_sales)
            
            # Sales can't exceed inventory
            actual_sales = min(predicted_sales, current_inventory)
            
            # Calculate revenue for the week
            weekly_revenue = actual_sales * mrp * (1 - discount_current_week)
            total_revenue += weekly_revenue
            
            # Update inventory and lag variables for the next week
            current_inventory -= actual_sales
            log_lag_sales = np.log(actual_sales + epsilon)
            log_lag_discount = np.log(discount_current_week)
            
        # Add revenue from liquidating leftover inventory at a flat 60% discount
        residual_revenue = current_inventory * mrp * (1 - 0.60)
        total_revenue += residual_revenue
        
        return -total_revenue # Return negative because we are using a minimizer
    
    # Define bounds and constraints
    # Bounds: Discount for each week must be between 10% and 60%
    bounds = [(0.10, 0.60) for _ in range(4)]
    
    # Constraints: Discount must be non-decreasing (d2>=d1, d3>=d2, etc.)
    constraints = [
        {'type': 'ineq', 'fun': lambda d: d[1] - d[0]}, # d2 - d1 >= 0
        {'type': 'ineq', 'fun': lambda d: d[2] - d[1]}, # d3 - d2 >= 0
        {'type': 'ineq', 'fun': lambda d: d[3] - d[2]}  # d4 - d3 >= 0
    ]
    
    # Initial guess for the optimizer
    initial_guess = [0.1, 0.2, 0.3, 0.4]
    
    # Run the optimization
    solution = minimize(objective_function, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
    
    print("\n--- PART C: OPTIMIZATION COMPLETE ---")
    if solution.success:
        optimal_discounts = solution.x
        max_revenue = -solution.fun
        print(f"Optimization Successful.")
        print(f"Optimal Discounts: {[f'{d:.2%}' for d in optimal_discounts]}")
        print(f"Maximum Predicted Revenue: INR {max_revenue:,.2f}")
    else:
        print("Optimization failed to find a solution.")

except NameError:
    print("\nPart C skipped because the forecasting model from Part B could not be built.")
except Exception as e:
    print(f"An error occurred in Part C: {e}")

