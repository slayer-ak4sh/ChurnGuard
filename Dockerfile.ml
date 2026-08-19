FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir fastapi uvicorn pandas numpy scikit-learn xgboost lightgbm joblib python-dotenv
COPY churn_model.pkl feature_columns.pkl ./
COPY ml_service/ ./ml_service/
EXPOSE 8001
CMD ["uvicorn", "ml_service.main:app", "--host", "0.0.0.0", "--port", "8001"]
