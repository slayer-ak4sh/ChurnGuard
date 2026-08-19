#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   ChurnGuard AI — Start All Services (Local Dev Mode)
#   Stack: PostgreSQL (Docker) + Spring Boot + FastAPI x2 + React
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set -e
cd "$(dirname "$0")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  ChurnGuard AI — Starting All Services${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── 1. Kill anything on our ports ─────────────────────────────────────────────
for PORT in 8000 8001 8002 3000; do
  PID=$(lsof -ti :$PORT 2>/dev/null) && kill $PID 2>/dev/null && echo -e "  Cleared port $PORT" || true
done
sleep 1

# ── 2. Check PostgreSQL is running ───────────────────────────────────────────
echo -e "\n${YELLOW}▶ Checking PostgreSQL (churnguard container)...${NC}"
if docker ps --format '{{.Names}}' | grep -q "^churnguard$"; then
  echo -e "  ${GREEN}✅ PostgreSQL running (churnguard container)${NC}"
else
  echo -e "  ${RED}❌ PostgreSQL container 'churnguard' is not running!${NC}"
  echo -e "  Start it with: docker start churnguard"
  exit 1
fi

# ── 3. Train model if missing ─────────────────────────────────────────────────
if [ ! -f "churn_model.pkl" ]; then
  echo -e "\n${YELLOW}▶ Training ML model (first time only)...${NC}"
  python3 train_model.py
  echo -e "  ${GREEN}Model trained and saved${NC}"
fi

# ── 4. Install Python deps if needed ─────────────────────────────────────────
if ! python3 -c "import fastapi" 2>/dev/null; then
  echo -e "\n${YELLOW}▶ Installing Python dependencies...${NC}"
  pip install -q -r requirements.txt
fi

# ── 5. Start ML Service :8001 ─────────────────────────────────────────────────
echo -e "\n${YELLOW}▶ ML Service        → http://localhost:8001${NC}"
nohup python3 -m uvicorn ml_service.main:app --host 0.0.0.0 --port 8001 > /tmp/churn_ml.log 2>&1 &
sleep 2

# ── 6. Start Agent Service :8002 ─────────────────────────────────────────────
echo -e "${YELLOW}▶ Agent Service     → http://localhost:8002${NC}"
nohup python3 -m uvicorn agent_service.main:app --host 0.0.0.0 --port 8002 > /tmp/churn_agent.log 2>&1 &
sleep 2

# ── 7. Build & Start Spring Boot Orchestrator :8000 ──────────────────────────
echo -e "${YELLOW}▶ Building Spring Boot Orchestrator...${NC}"
cd orchestrator
if [ ! -f "target/orchestrator-1.0.0.jar" ]; then
  mvn package -DskipTests -q
fi

export POSTGRES_URL="jdbc:postgresql://localhost:5432/churnguard_db"
export POSTGRES_USER="postgres"
export POSTGRES_PASSWORD="010200"
export ML_SERVICE_URL="http://localhost:8001"
export AGENT_SERVICE_URL="http://localhost:8002"

nohup java -jar target/orchestrator-1.0.0.jar > /tmp/churn_orchestrator.log 2>&1 &
cd ..
echo -e "  ${GREEN}Orchestrator starting...${NC}"
sleep 5

# ── 8. Health checks ──────────────────────────────────────────────────────────
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Health Checks:"
curl -sf http://localhost:8001/health > /dev/null \
  && echo -e "  ${GREEN}✅ ML Service       OK${NC}" \
  || echo -e "  ${RED}❌ ML Service       FAILED  → tail /tmp/churn_ml.log${NC}"

curl -sf http://localhost:8002/health > /dev/null \
  && echo -e "  ${GREEN}✅ Agent Service    OK${NC}" \
  || echo -e "  ${RED}❌ Agent Service    FAILED  → tail /tmp/churn_agent.log${NC}"

curl -sf http://localhost:8000/health > /dev/null \
  && echo -e "  ${GREEN}✅ Orchestrator     OK${NC}" \
  || echo -e "  ${RED}❌ Orchestrator     FAILED  → tail /tmp/churn_orchestrator.log${NC}"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}Frontend → http://localhost:3000${NC}"
echo -e "  ${GREEN}API      → http://localhost:8000${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# ── 9. Start React Frontend (foreground) ─────────────────────────────────────
cd frontend
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}▶ Installing frontend dependencies...${NC}"
  npm install -q
fi
BROWSER=none npm start
