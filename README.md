# RetainIQ — AI-Powered Churn Prediction & Retention Platform

> Predict which telecom customers are about to leave and automatically generate personalized retention offers using ML + LLM agents.

---

## Architecture

```
React Frontend (port 3000)
        │
        ▼
Spring Boot Orchestrator (port 8000)  ←→  PostgreSQL
        │
        ├──► FastAPI ML Service (port 8001)   — XGBoost + LightGBM ensemble
        └──► FastAPI Agent Service (port 8002) — LangChain + Groq LLM
```

| Layer | Technology |
|---|---|
| Frontend | React 19, Recharts, Axios |
| Orchestrator | Spring Boot 3.2, Spring Data JPA, WebFlux WebClient |
| ML Service | FastAPI, XGBoost, LightGBM, scikit-learn |
| Agent Service | FastAPI, LangChain, Groq LLM (llama-3.1-8b-instant) |
| Database | PostgreSQL 16 |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## Features

- **Churn Prediction** — XGBoost + LightGBM ensemble model trained on IBM Telco dataset (AUC ~0.87)
- **AI Retention Agent** — LangChain + Groq LLM generates personalized retention offers; falls back to rule-based if LLM unavailable
- **Customer 360** — Full customer profile with churn drivers, billing summary, services, retention offers
- **Risk Overview** — Dashboard with churn probability distribution and risk breakdown charts
- **Reports** — KPI cards, segment risk charts, CSV/JSON export
- **PostgreSQL persistence** — All customers, churn scores, retention offers stored with full history

---

## Quick Start

### Option 1 — Docker Compose (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/slayer-ak4sh/ChurnGuard.git
cd ChurnGuard

# 2. Set up environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY (free at https://console.groq.com)

# 3. Start everything
docker compose up --build
```

Open **http://localhost:3000**

---

### Option 2 — Local Dev

**Prerequisites:** Python 3.11+, Java 17+, Maven, Node 20+, Docker (for PostgreSQL)

```bash
# Clone
git clone https://github.com/slayer-ak4sh/ChurnGuard.git
cd ChurnGuard

# Copy env
cp .env.example .env
# Add GROQ_API_KEY to .env

# Start everything with one command
./start.sh
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Get free key from https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# PostgreSQL
POSTGRES_URL=jdbc:postgresql://localhost:5432/churnguard_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Service URLs (leave as-is for local dev)
ML_SERVICE_URL=http://localhost:8001
AGENT_SERVICE_URL=http://localhost:8002
```

> If `GROQ_API_KEY` is not set, the agent automatically falls back to rule-based recommendations — the app still works fully.

---

## Project Structure

```
ChurnGuard/
├── orchestrator/               # Spring Boot API gateway
│   ├── src/main/java/com/churnguard/orchestrator/
│   │   ├── controller/         # REST endpoints
│   │   ├── service/            # Business logic + WebClient calls
│   │   ├── entity/             # JPA entities (Customer, ChurnScore, RetentionOffer)
│   │   ├── repository/         # Spring Data JPA repos
│   │   ├── dto/                # Request/Response DTOs
│   │   └── config/             # WebClient beans, CORS config
│   └── src/main/resources/
│       └── application.properties
├── ml_service/                 # FastAPI churn prediction
│   └── main.py
├── agent_service/              # FastAPI LangChain retention agent
│   └── main.py
├── frontend/                   # React SPA
│   └── src/components/
│       ├── RiskOverview.js
│       ├── Customer360.js
│       ├── PredictPage.js
│       └── ReportsPage.js
├── train_model.py              # Model training script
├── retention_agent.py          # Rule-based fallback agent
├── docker-compose.yml
├── Dockerfile.orchestrator
├── Dockerfile.ml
├── Dockerfile.agent
├── Dockerfile.frontend
└── start.sh                    # Local dev startup script
```

---

## API Endpoints

All endpoints served by Spring Boot on port 8000:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health check |
| POST | `/api/analyze` | Predict churn + get retention recommendations |
| GET | `/api/customers` | List all customers |
| GET | `/api/customers/{id}` | Get customer detail with latest score and offers |
| GET | `/api/dashboard/stats` | Aggregated risk stats for dashboard |
| GET | `/api/scores` | All churn scores (latest 200) |

### Example — Analyze a customer

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-001",
    "customerName": "Rahul Verma",
    "tenure": 5,
    "MonthlyCharges": 85.0,
    "Contract": "Month-to-month",
    "InternetService": "Fiber optic",
    "TechSupport": "No",
    "PaymentMethod": "Electronic check"
  }'
```

---

## CI/CD Pipeline

GitHub Actions runs on every push to `main`:

1. **test-python** — installs deps, trains model, tests ML + Agent services
2. **test-java** — builds Spring Boot JAR with Maven
3. **test-frontend** — `npm ci && npm run build`
4. **docker-build** — builds and pushes all 4 Docker images to Docker Hub (on `main` only)

Required GitHub Secrets: `DOCKER_USERNAME`, `DOCKER_PASSWORD`

---

## Tech Decisions

**Why Spring Boot for orchestrator?**
The orchestrator is pure API gateway logic — routing requests, persisting to PostgreSQL, calling downstream services. Spring Boot + JPA is ideal for this. The ML model (Python/scikit-learn `.pkl`) and LangChain agent stay as Python microservices since they can't be ported to Java without losing the ecosystem.

**Why PostgreSQL over MongoDB?**
The data model is fully relational — customers, scores, and offers are flat structured records. PostgreSQL's `jsonb` type handles the `recommendations` array natively without needing a document store.

**Why Groq?**
Free tier, fastest inference for Llama 3.1, no GPU needed. Falls back to rule-based agent automatically if key is missing or API fails.
