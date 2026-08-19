"""
Telecom Churn Prediction & Retention Recommendation System
Flask API + Web Dashboard
"""

import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, render_template
from retention_agent import RetentionAgent

app = Flask(__name__)

# ── Load model artifacts ──────────────────────────────────────────────────────
MODEL_PATH = "churn_model.pkl"
FEATURES_PATH = "feature_columns.pkl"

model = None
feature_columns = None
agent = RetentionAgent()


def load_artifacts():
    global model, feature_columns
    if os.path.exists(MODEL_PATH) and os.path.exists(FEATURES_PATH):
        model = joblib.load(MODEL_PATH)
        feature_columns = joblib.load(FEATURES_PATH)
        print("✅ Model artifacts loaded.")
    else:
        print("⚠️  Model not found. Run train_model.py first.")


# ── Feature engineering (mirrors training preprocessing) ─────────────────────
def build_feature_vector(form: dict) -> np.ndarray:
    c = {
        "gender":           int(form.get("gender", 0)),
        "SeniorCitizen":    int(form.get("SeniorCitizen", 0)),
        "Partner":          int(form.get("Partner", 0)),
        "Dependents":       int(form.get("Dependents", 0)),
        "tenure":           int(form.get("tenure", 0)),
        "PhoneService":     int(form.get("PhoneService", 0)),
        "PaperlessBilling": int(form.get("PaperlessBilling", 0)),
        "MonthlyCharges":   float(form.get("MonthlyCharges", 50)),
        "TotalCharges":     float(form.get("tenure", 1)) * float(form.get("MonthlyCharges", 50)),
        # MultipleLines
        "MultipleLines_No":                  0,
        "MultipleLines_No phone service":    0,
        "MultipleLines_Yes":                 0,
        # InternetService
        "InternetService_DSL":               0,
        "InternetService_Fiber optic":       0,
        "InternetService_No":                0,
        # OnlineSecurity
        "OnlineSecurity_No":                 0,
        "OnlineSecurity_No internet service":0,
        "OnlineSecurity_Yes":                0,
        # OnlineBackup
        "OnlineBackup_No":                   0,
        "OnlineBackup_No internet service":  0,
        "OnlineBackup_Yes":                  0,
        # DeviceProtection
        "DeviceProtection_No":               0,
        "DeviceProtection_No internet service": 0,
        "DeviceProtection_Yes":              0,
        # TechSupport
        "TechSupport_No":                    0,
        "TechSupport_No internet service":   0,
        "TechSupport_Yes":                   0,
        # StreamingTV
        "StreamingTV_No":                    0,
        "StreamingTV_No internet service":   0,
        "StreamingTV_Yes":                   0,
        # StreamingMovies
        "StreamingMovies_No":                0,
        "StreamingMovies_No internet service": 0,
        "StreamingMovies_Yes":               0,
        # Contract
        "Contract_Month-to-month":           0,
        "Contract_One year":                 0,
        "Contract_Two year":                 0,
        # PaymentMethod
        "PaymentMethod_Bank transfer (automatic)": 0,
        "PaymentMethod_Credit card (automatic)":   0,
        "PaymentMethod_Electronic check":          0,
        "PaymentMethod_Mailed check":              0,
    }

    # Set one-hot values
    ml_val = form.get("MultipleLines", "No")
    c[f"MultipleLines_{ml_val}"] = 1

    is_val = form.get("InternetService", "DSL")
    c[f"InternetService_{is_val}"] = 1

    for feat in ["OnlineSecurity", "OnlineBackup", "DeviceProtection",
                 "TechSupport", "StreamingTV", "StreamingMovies"]:
        val = form.get(feat, "No")
        key = f"{feat}_{val}"
        if key in c:
            c[key] = 1

    contract = form.get("Contract", "Month-to-month")
    c[f"Contract_{contract}"] = 1

    pm = form.get("PaymentMethod", "Electronic check")
    c[f"PaymentMethod_{pm}"] = 1

    # Align with training feature columns
    row = pd.DataFrame([c])
    for col in feature_columns:
        if col not in row.columns:
            row[col] = 0
    row = row[feature_columns]
    return row


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    try:
        form = request.form.to_dict()
        X = build_feature_vector(form)
        churn_prob = float(model.predict_proba(X)[0][1])

        # Build customer profile for agent
        customer_profile = {
            "tenure":          int(form.get("tenure", 0)),
            "MonthlyCharges":  float(form.get("MonthlyCharges", 50)),
            "Contract":        form.get("Contract", "Month-to-month"),
            "InternetService": form.get("InternetService", "DSL"),
            "OnlineSecurity":  form.get("OnlineSecurity") == "Yes",
            "TechSupport":     form.get("TechSupport") == "Yes",
            "PaymentMethod":   form.get("PaymentMethod", "Electronic check"),
            "Partner":         form.get("Partner") == "1",
            "Dependents":      form.get("Dependents") == "1",
        }

        agent_result = agent.analyze(customer_profile, churn_prob)
        return jsonify({"status": "success", **agent_result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


if __name__ == "__main__":
    load_artifacts()
    app.run(debug=True, port=5000)
