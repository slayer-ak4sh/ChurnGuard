"""
FastAPI ML Microservice — Churn Prediction
POST /predict → churn probability + risk level
"""

import os, sys, joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)

app = FastAPI(title="Telecom Churn ML Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

model = joblib.load(os.path.join(BASE, "churn_model.pkl"))
feature_columns = joblib.load(os.path.join(BASE, "feature_columns.pkl"))


class CustomerFeatures(BaseModel):
    gender: int = Field(0, ge=0, le=1)
    SeniorCitizen: int = Field(0, ge=0, le=1)
    Partner: int = Field(0, ge=0, le=1)
    Dependents: int = Field(0, ge=0, le=1)
    tenure: int = Field(..., ge=0, le=120)
    PhoneService: int = Field(1, ge=0, le=1)
    PaperlessBilling: int = Field(0, ge=0, le=1)
    MonthlyCharges: float = Field(..., gt=0)
    MultipleLines: str = "No"
    InternetService: str = "DSL"
    OnlineSecurity: str = "No"
    OnlineBackup: str = "No"
    DeviceProtection: str = "No"
    TechSupport: str = "No"
    StreamingTV: str = "No"
    StreamingMovies: str = "No"
    Contract: str = "Month-to-month"
    PaymentMethod: str = "Electronic check"


def build_features(c: CustomerFeatures) -> pd.DataFrame:
    row = {
        "gender": c.gender, "SeniorCitizen": c.SeniorCitizen,
        "Partner": c.Partner, "Dependents": c.Dependents,
        "tenure": c.tenure, "PhoneService": c.PhoneService,
        "PaperlessBilling": c.PaperlessBilling,
        "MonthlyCharges": c.MonthlyCharges,
        "TotalCharges": c.tenure * c.MonthlyCharges,
    }
    for col, val in [
        ("MultipleLines", c.MultipleLines), ("InternetService", c.InternetService),
        ("OnlineSecurity", c.OnlineSecurity), ("OnlineBackup", c.OnlineBackup),
        ("DeviceProtection", c.DeviceProtection), ("TechSupport", c.TechSupport),
        ("StreamingTV", c.StreamingTV), ("StreamingMovies", c.StreamingMovies),
        ("Contract", c.Contract), ("PaymentMethod", c.PaymentMethod),
    ]:
        row[f"{col}_{val}"] = 1

    df = pd.DataFrame([row])
    for feat in feature_columns:
        if feat not in df.columns:
            df[feat] = 0
    return df[feature_columns]


@app.get("/health")
def health():
    return {"status": "ok", "model": "XGBoost+LightGBM ensemble"}


@app.post("/predict")
def predict(customer: CustomerFeatures):
    try:
        X = build_features(customer)
        prob = float(model.predict_proba(X)[0][1])
        risk = "HIGH" if prob >= 0.7 else "MEDIUM" if prob >= 0.4 else "LOW"
        return {"churn_probability": round(prob, 4), "churn_prediction": int(prob >= 0.5), "risk_level": risk}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
