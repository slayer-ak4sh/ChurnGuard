FROM python:3.11-slim

# Install libgomp (required by LightGBM) and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
RUN pip install --no-cache-dir \
    fastapi uvicorn \
    pandas numpy scikit-learn \
    xgboost lightgbm joblib \
    python-dotenv

# Copy training data and script first
COPY WA_Fn-UseC_-Telco-Customer-Churn.csv ./
COPY train_model.py ./

# Train model at build time → produces churn_model.pkl + feature_columns.pkl
RUN python train_model.py

# Copy ML service code
COPY ml_service/ ./ml_service/

EXPOSE 8001
CMD ["uvicorn", "ml_service.main:app", "--host", "0.0.0.0", "--port", "8001"]
