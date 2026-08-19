"""
Agentic AI Service — LangChain + Groq LLM
POST /recommend → personalized retention offers via LLM agent
Falls back to rule-based if no API key configured
"""

import os, sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

load_dotenv()
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)

app = FastAPI(title="Telecom Retention Agent Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_raw_key = os.getenv("GROQ_API_KEY", "")
GROQ_API_KEY = _raw_key if (_raw_key and not _raw_key.startswith("your_")) else ""


# ── Pydantic schemas ──────────────────────────────────────────────────────────
class CustomerProfile(BaseModel):
    tenure: int
    MonthlyCharges: float
    Contract: str
    InternetService: str
    OnlineSecurity: bool
    TechSupport: bool
    PaymentMethod: str
    Partner: bool
    Dependents: bool
    churn_probability: float
    risk_level: str


class RetentionResponse(BaseModel):
    churn_drivers: List[str]
    recommendations: List[dict]
    retention_message: str
    estimated_cltv: float
    source: str  # "llm" or "rule_based"


# ── LangChain LLM Agent ───────────────────────────────────────────────────────
def get_llm_recommendations(profile: CustomerProfile) -> dict:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser

    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=GROQ_API_KEY, temperature=0.3)

    prompt = ChatPromptTemplate.from_template("""
You are an expert telecom customer retention AI agent.

Customer Profile:
- Tenure: {tenure} months
- Monthly Charges: ${monthly_charges}
- Contract: {contract}
- Internet Service: {internet_service}
- Online Security: {online_security}
- Tech Support: {tech_support}
- Payment Method: {payment_method}
- Has Partner: {partner}
- Has Dependents: {dependents}
- Churn Probability: {churn_prob}%
- Risk Level: {risk_level}

Analyze this customer and respond ONLY with valid JSON in this exact format:
{{
  "churn_drivers": ["reason1", "reason2", "reason3"],
  "recommendations": [
    {{
      "priority": "HIGH",
      "category": "Contract Upgrade",
      "action": "short action title",
      "description": "detailed description",
      "expected_impact": "expected churn reduction"
    }}
  ],
  "retention_message": "personalized message to the customer"
}}

Provide 3-4 recommendations sorted by priority (HIGH first). Be specific with dollar amounts and percentages.
""")

    chain = prompt | llm | JsonOutputParser()
    result = chain.invoke({
        "tenure": profile.tenure,
        "monthly_charges": profile.MonthlyCharges,
        "contract": profile.Contract,
        "internet_service": profile.InternetService,
        "online_security": profile.OnlineSecurity,
        "tech_support": profile.TechSupport,
        "payment_method": profile.PaymentMethod,
        "partner": profile.Partner,
        "dependents": profile.Dependents,
        "churn_prob": round(profile.churn_probability * 100, 1),
        "risk_level": profile.risk_level,
    })
    return result


# ── Rule-based fallback ───────────────────────────────────────────────────────
def get_rule_based_recommendations(profile: CustomerProfile) -> dict:
    from retention_agent import RetentionAgent
    agent = RetentionAgent()
    return agent.analyze({
        "tenure": profile.tenure,
        "MonthlyCharges": profile.MonthlyCharges,
        "Contract": profile.Contract,
        "InternetService": profile.InternetService,
        "OnlineSecurity": profile.OnlineSecurity,
        "TechSupport": profile.TechSupport,
        "PaymentMethod": profile.PaymentMethod,
        "Partner": profile.Partner,
        "Dependents": profile.Dependents,
    }, profile.churn_probability)


def estimate_cltv(profile: CustomerProfile) -> float:
    base = {"Month-to-month": 18, "One year": 36, "Two year": 60}
    months = base.get(profile.Contract, 18) + profile.tenure * 0.3
    return round(profile.MonthlyCharges * months, 2)


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "llm_configured": bool(GROQ_API_KEY), "mode": "llm" if GROQ_API_KEY else "rule_based"}


@app.post("/recommend", response_model=RetentionResponse)
def recommend(profile: CustomerProfile):
    try:
        if GROQ_API_KEY:
            try:
                result = get_llm_recommendations(profile)
                return RetentionResponse(
                    churn_drivers=result.get("churn_drivers", []),
                    recommendations=result.get("recommendations", []),
                    retention_message=result.get("retention_message", ""),
                    estimated_cltv=estimate_cltv(profile),
                    source="llm",
                )
            except Exception:
                pass  # fall through to rule-based
        result = get_rule_based_recommendations(profile)
        return RetentionResponse(
            churn_drivers=result["churn_drivers"],
            recommendations=result["recommendations"],
            retention_message=result["retention_message"],
            estimated_cltv=result["estimated_cltv"],
            source="rule_based",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
