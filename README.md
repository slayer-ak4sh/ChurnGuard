# RetainIQ — Telecom Churn Prediction & Retention AI

> Cognizant Hackathon 2025 — AI-driven churn prediction and personalized retention recommendation system

![ChurnGuard](https://img.shields.io/badge/AI-Churn%20Prediction-00c9a7?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20MongoDB-blue?style=flat-square)

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  React Frontend │────▶│  Orchestrator    │────▶│  ML Service         │
│  :3000          │     │  FastAPI :8000   │     │  FastAPI :8001      │
│  Plus Jakarta   │     │  MongoDB Atlas   │     │  XGBoost + LightGBM │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │  Agent Service   │
                        │  FastAPI :8002   │
                        │  LangChain+Groq  │
                        └──────────────────┘
```

## Features

- **Churn Prediction** — XGBoost + LightGBM ensemble (ROC-AUC ~0.87)
- **Customer 360** — Full customer profile with risk score, services, billing, support history
- **AI Retention Agent** — LangChain + Groq LLM generates personalized retention offers
- **Reports Dashboard** — Risk mix by segment, portfolio split, scheduled exports
- **MongoDB Atlas** — Persistent storage for customers, scores, and offers

## Quick Start

### 1. Install dependencies
```bash
pip3 install -r requirements.txt
cd frontend && npm install && cd ..
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — add your GROQ_API_KEY and MONGO_URI
```

### 3. Train the model
```bash
python3 train_model.py
```

### 4. Start all services
```bash
chmod +x start.sh && ./start.sh
```

Open **http://localhost:3000**

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML Model | XGBoost + LightGBM (VotingClassifier) |
| ML Serving | FastAPI microservice |
| Agentic AI | LangChain + Groq (Llama3) |
| Orchestrator | FastAPI + Motor (async MongoDB) |
| Database | MongoDB Atlas |
| Frontend | React.js + Recharts |
| Font | Plus Jakarta Sans |

## API Docs

- Orchestrator: http://localhost:8000/docs
- ML Service: http://localhost:8001/docs
- Agent Service: http://localhost:8002/docs
