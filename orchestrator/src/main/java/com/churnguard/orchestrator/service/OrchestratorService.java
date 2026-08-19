package com.churnguard.orchestrator.service;

import com.churnguard.orchestrator.dto.AnalyzeRequest;
import com.churnguard.orchestrator.dto.DashboardStats;
import com.churnguard.orchestrator.entity.ChurnScore;
import com.churnguard.orchestrator.entity.Customer;
import com.churnguard.orchestrator.entity.RetentionOffer;
import com.churnguard.orchestrator.repository.ChurnScoreRepository;
import com.churnguard.orchestrator.repository.CustomerRepository;
import com.churnguard.orchestrator.repository.RetentionOfferRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class OrchestratorService {

    private final CustomerRepository customerRepo;
    private final ChurnScoreRepository scoreRepo;
    private final RetentionOfferRepository offerRepo;
    private final WebClient mlClient;
    private final WebClient agentClient;

    public OrchestratorService(CustomerRepository customerRepo,
                                ChurnScoreRepository scoreRepo,
                                RetentionOfferRepository offerRepo,
                                @Qualifier("mlWebClient") WebClient mlClient,
                                @Qualifier("agentWebClient") WebClient agentClient) {
        this.customerRepo = customerRepo;
        this.scoreRepo = scoreRepo;
        this.offerRepo = offerRepo;
        this.mlClient = mlClient;
        this.agentClient = agentClient;
    }

    public Map<String, Object> analyze(AnalyzeRequest req) {
        // 1. Upsert customer
        Customer customer = customerRepo.findById(req.getCustomerId()).orElse(new Customer());
        mapRequestToCustomer(req, customer);
        customerRepo.save(customer);

        // 2. Call ML service
        Map<String, Object> mlPayload = buildMlPayload(req);
        Map mlResult = mlClient.post().uri("/predict")
                .bodyValue(mlPayload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        // 3. Save churn score
        ChurnScore score = new ChurnScore();
        score.setCustomerId(req.getCustomerId());
        score.setChurnProbability(((Number) mlResult.get("churn_probability")).doubleValue());
        score.setRiskLevel((String) mlResult.get("risk_level"));
        score.setChurnPrediction(((Number) mlResult.get("churn_prediction")).intValue());
        scoreRepo.save(score);

        // Update customer latest score
        customer.setLatestChurnScore(score.getChurnProbability());
        customer.setRiskLevel(score.getRiskLevel());
        customerRepo.save(customer);

        // 4. Call Agent service
        Map<String, Object> agentPayload = buildAgentPayload(req, mlResult);
        Map agentResult = agentClient.post().uri("/recommend")
                .bodyValue(agentPayload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        // 5. Save retention offer
        RetentionOffer offer = new RetentionOffer();
        offer.setCustomerId(req.getCustomerId());
        offer.setRecommendations((List<Map<String, Object>>) agentResult.get("recommendations"));
        offer.setRetentionMessage((String) agentResult.get("retention_message"));
        offer.setChurnDrivers((List<String>) agentResult.get("churn_drivers"));
        offer.setEstimatedCltv(((Number) agentResult.get("estimated_cltv")).doubleValue());
        offer.setSource((String) agentResult.get("source"));
        offerRepo.save(offer);

        Map<String, Object> response = new HashMap<>();
        response.put("customerId", req.getCustomerId());
        response.putAll(mlResult);
        response.putAll(agentResult);
        return response;
    }

    public List<Map<String, Object>> listCustomers() {
        return customerRepo.findTop100ByOrderByUpdatedAtDesc()
                .stream()
                .map(this::buildCustomerMap)
                .collect(java.util.stream.Collectors.toList());
    }

    public Map<String, Object> getCustomer(String customerId) {
        Customer customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Optional<ChurnScore> latestScore = scoreRepo.findTopByCustomerIdOrderByCreatedAtDesc(customerId);
        Optional<RetentionOffer> latestOffer = offerRepo.findTopByCustomerIdOrderByCreatedAtDesc(customerId);

        Map<String, Object> result = new HashMap<>();
        result.put("customer", buildCustomerMap(customer));
        result.put("latestScore", latestScore.orElse(null));
        result.put("latestOffers", latestOffer.orElse(null));
        return result;
    }

    // Serialize Customer to a map with the exact field names the frontend expects
    private Map<String, Object> buildCustomerMap(Customer c) {
        Map<String, Object> m = new HashMap<>();
        m.put("customerId", c.getCustomerId());
        m.put("customerName", c.getCustomerName());
        m.put("city", c.getCity());
        m.put("gender", c.getGender());
        m.put("SeniorCitizen", c.getSeniorCitizen());
        m.put("Partner", c.getPartner());
        m.put("Dependents", c.getDependents());
        m.put("tenure", c.getTenure());
        m.put("PhoneService", c.getPhoneService());
        m.put("PaperlessBilling", c.getPaperlessBilling());
        m.put("MonthlyCharges", c.getMonthlyCharges());
        m.put("MultipleLines", c.getMultipleLines());
        m.put("InternetService", c.getInternetService());
        m.put("OnlineSecurity", c.getOnlineSecurity());
        m.put("OnlineBackup", c.getOnlineBackup());
        m.put("DeviceProtection", c.getDeviceProtection());
        m.put("TechSupport", c.getTechSupport());
        m.put("StreamingTV", c.getStreamingTv());
        m.put("StreamingMovies", c.getStreamingMovies());
        m.put("Contract", c.getContract());
        m.put("PaymentMethod", c.getPaymentMethod());
        m.put("latestChurnScore", c.getLatestChurnScore());
        m.put("riskLevel", c.getRiskLevel());
        m.put("createdAt", c.getCreatedAt());
        m.put("updatedAt", c.getUpdatedAt());
        return m;
    }

    public DashboardStats getDashboardStats() {
        long total = customerRepo.count();
        long high = customerRepo.countByRiskLevel("HIGH");
        long medium = customerRepo.countByRiskLevel("MEDIUM");
        long low = customerRepo.countByRiskLevel("LOW");
        Double avg = customerRepo.avgChurnScore();
        double avgChurn = avg != null ? Math.round(avg * 1000.0) / 10.0 : 0.0;
        return new DashboardStats(total, high, medium, low, avgChurn);
    }

    public List<ChurnScore> getAllScores() {
        return scoreRepo.findTop200ByOrderByCreatedAtDesc();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void mapRequestToCustomer(AnalyzeRequest req, Customer c) {
        c.setCustomerId(req.getCustomerId());
        c.setCustomerName(req.getCustomerName());
        c.setCity(req.getCity());
        c.setGender(req.getGender());
        c.setSeniorCitizen(req.getSeniorCitizen());
        c.setPartner(req.getPartner());
        c.setDependents(req.getDependents());
        c.setTenure(req.getTenure());
        c.setPhoneService(req.getPhoneService());
        c.setPaperlessBilling(req.getPaperlessBilling());
        c.setMonthlyCharges(req.getMonthlyCharges());
        c.setMultipleLines(req.getMultipleLines());
        c.setInternetService(req.getInternetService());
        c.setOnlineSecurity(req.getOnlineSecurity());
        c.setOnlineBackup(req.getOnlineBackup());
        c.setDeviceProtection(req.getDeviceProtection());
        c.setTechSupport(req.getTechSupport());
        c.setStreamingTv(req.getStreamingTV());
        c.setStreamingMovies(req.getStreamingMovies());
        c.setContract(req.getContract());
        c.setPaymentMethod(req.getPaymentMethod());
    }

    private Map<String, Object> buildMlPayload(AnalyzeRequest req) {
        Map<String, Object> p = new HashMap<>();
        p.put("gender", req.getGender());
        p.put("SeniorCitizen", req.getSeniorCitizen());
        p.put("Partner", req.getPartner());
        p.put("Dependents", req.getDependents());
        p.put("tenure", req.getTenure());
        p.put("PhoneService", req.getPhoneService());
        p.put("PaperlessBilling", req.getPaperlessBilling());
        p.put("MonthlyCharges", req.getMonthlyCharges());
        p.put("MultipleLines", req.getMultipleLines());
        p.put("InternetService", req.getInternetService());
        p.put("OnlineSecurity", req.getOnlineSecurity());
        p.put("OnlineBackup", req.getOnlineBackup());
        p.put("DeviceProtection", req.getDeviceProtection());
        p.put("TechSupport", req.getTechSupport());
        p.put("StreamingTV", req.getStreamingTV());
        p.put("StreamingMovies", req.getStreamingMovies());
        p.put("Contract", req.getContract());
        p.put("PaymentMethod", req.getPaymentMethod());
        return p;
    }

    private Map<String, Object> buildAgentPayload(AnalyzeRequest req, Map mlResult) {
        Map<String, Object> p = new HashMap<>();
        p.put("tenure", req.getTenure());
        p.put("MonthlyCharges", req.getMonthlyCharges());
        p.put("Contract", req.getContract());
        p.put("InternetService", req.getInternetService());
        p.put("OnlineSecurity", "Yes".equals(req.getOnlineSecurity()));
        p.put("TechSupport", "Yes".equals(req.getTechSupport()));
        p.put("PaymentMethod", req.getPaymentMethod());
        p.put("Partner", req.getPartner() == 1);
        p.put("Dependents", req.getDependents() == 1);
        p.put("churn_probability", mlResult.get("churn_probability"));
        p.put("risk_level", mlResult.get("risk_level"));
        return p;
    }
}
