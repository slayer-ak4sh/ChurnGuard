"""
Telecom Churn Prediction - Model Training
Trains XGBoost + LightGBM ensemble and saves artifacts
Dataset: IBM Telco Customer Churn (auto-downloaded or generated)
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, roc_auc_score
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.ensemble import VotingClassifier

# ── 1. Load or generate dataset ──────────────────────────────────────────────
DATA_PATH = "WA_Fn-UseC_-Telco-Customer-Churn.csv"

def load_data():
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        print(f"Loaded dataset: {df.shape}")
    else:
        print("Dataset not found. Generating synthetic data...")
        np.random.seed(42)
        n = 7043
        df = pd.DataFrame({
            "customerID": [f"CUST-{i}" for i in range(n)],
            "gender": np.random.choice(["Male", "Female"], n),
            "SeniorCitizen": np.random.choice([0, 1], n, p=[0.84, 0.16]),
            "Partner": np.random.choice(["Yes", "No"], n),
            "Dependents": np.random.choice(["Yes", "No"], n, p=[0.3, 0.7]),
            "tenure": np.random.randint(0, 72, n),
            "PhoneService": np.random.choice(["Yes", "No"], n, p=[0.9, 0.1]),
            "MultipleLines": np.random.choice(["Yes", "No", "No phone service"], n),
            "InternetService": np.random.choice(["DSL", "Fiber optic", "No"], n, p=[0.34, 0.44, 0.22]),
            "OnlineSecurity": np.random.choice(["Yes", "No", "No internet service"], n),
            "OnlineBackup": np.random.choice(["Yes", "No", "No internet service"], n),
            "DeviceProtection": np.random.choice(["Yes", "No", "No internet service"], n),
            "TechSupport": np.random.choice(["Yes", "No", "No internet service"], n),
            "StreamingTV": np.random.choice(["Yes", "No", "No internet service"], n),
            "StreamingMovies": np.random.choice(["Yes", "No", "No internet service"], n),
            "Contract": np.random.choice(["Month-to-month", "One year", "Two year"], n, p=[0.55, 0.21, 0.24]),
            "PaperlessBilling": np.random.choice(["Yes", "No"], n),
            "PaymentMethod": np.random.choice(
                ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"], n
            ),
            "MonthlyCharges": np.round(np.random.uniform(18, 118, n), 2),
            "TotalCharges": np.round(np.random.uniform(18, 8500, n), 2),
        })
        # Churn: higher for month-to-month, fiber optic, high charges, low tenure
        churn_prob = (
            0.1
            + 0.25 * (df["Contract"] == "Month-to-month")
            + 0.15 * (df["InternetService"] == "Fiber optic")
            + 0.1 * (df["tenure"] < 12)
            + 0.05 * (df["MonthlyCharges"] > 80)
            - 0.1 * (df["tenure"] > 48)
        ).clip(0.05, 0.85)
        df["Churn"] = np.where(np.random.rand(n) < churn_prob, "Yes", "No")
        df.to_csv(DATA_PATH, index=False)
        print(f"Synthetic dataset saved: {df.shape}")
    return df


# ── 2. Preprocess ─────────────────────────────────────────────────────────────
def preprocess(df):
    df = df.copy()
    df.drop(columns=["customerID"], errors="ignore", inplace=True)
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["TotalCharges"] = df["TotalCharges"].fillna(df["TotalCharges"].median())

    binary_map = {"Yes": 1, "No": 0, "Male": 1, "Female": 0}
    for col in ["gender", "Partner", "Dependents", "PhoneService", "PaperlessBilling"]:
        df[col] = df[col].map(binary_map)

    # Encode multi-class categoricals
    cat_cols = ["MultipleLines", "InternetService", "OnlineSecurity", "OnlineBackup",
                "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies",
                "Contract", "PaymentMethod"]
    df = pd.get_dummies(df, columns=cat_cols, drop_first=False)

    df["Churn"] = df["Churn"].map({"Yes": 1, "No": 0})
    return df


# ── 3. Train ──────────────────────────────────────────────────────────────────
def train():
    df_raw = load_data()
    df = preprocess(df_raw)

    X = df.drop(columns=["Churn"])
    y = df["Churn"]

    # Save feature columns for inference
    joblib.dump(list(X.columns), "feature_columns.pkl")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    xgb = XGBClassifier(n_estimators=300, max_depth=5, learning_rate=0.05,
                         eval_metric="logloss", scale_pos_weight=2,
                         random_state=42, verbosity=0)

    lgbm = LGBMClassifier(n_estimators=300, max_depth=5, learning_rate=0.05,
                           random_state=42, verbose=-1)

    ensemble = VotingClassifier(estimators=[("xgb", xgb), ("lgbm", lgbm)], voting="soft")
    ensemble.fit(X_train, y_train)

    y_pred = ensemble.predict(X_test)
    y_prob = ensemble.predict_proba(X_test)[:, 1]

    print("\n── Model Performance ──────────────────────────")
    print(classification_report(y_test, y_pred))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")

    joblib.dump(ensemble, "churn_model.pkl")
    print("\nModel saved → churn_model.pkl")
    print("Features saved → feature_columns.pkl")


if __name__ == "__main__":
    train()
