package com.churnguard.orchestrator.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class AnalyzeRequest {

    @NotBlank
    private String customerId;
    private String customerName = "";
    private String city = "";
    private Integer gender = 0;

    @JsonProperty("SeniorCitizen")
    private Integer seniorCitizen = 0;

    @JsonProperty("Partner")
    private Integer partner = 0;

    @JsonProperty("Dependents")
    private Integer dependents = 0;

    @Min(0)
    private Integer tenure;

    @JsonProperty("PhoneService")
    private Integer phoneService = 1;

    @JsonProperty("PaperlessBilling")
    private Integer paperlessBilling = 0;

    @Positive
    @JsonProperty("MonthlyCharges")
    private Double monthlyCharges;

    @JsonProperty("MultipleLines")
    private String multipleLines = "No";

    @JsonProperty("InternetService")
    private String internetService = "DSL";

    @JsonProperty("OnlineSecurity")
    private String onlineSecurity = "No";

    @JsonProperty("OnlineBackup")
    private String onlineBackup = "No";

    @JsonProperty("DeviceProtection")
    private String deviceProtection = "No";

    @JsonProperty("TechSupport")
    private String techSupport = "No";

    @JsonProperty("StreamingTV")
    private String streamingTV = "No";

    @JsonProperty("StreamingMovies")
    private String streamingMovies = "No";

    @JsonProperty("Contract")
    private String contract = "Month-to-month";

    @JsonProperty("PaymentMethod")
    private String paymentMethod = "Electronic check";

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public Integer getGender() { return gender; }
    public void setGender(Integer gender) { this.gender = gender; }
    public Integer getSeniorCitizen() { return seniorCitizen; }
    public void setSeniorCitizen(Integer seniorCitizen) { this.seniorCitizen = seniorCitizen; }
    public Integer getPartner() { return partner; }
    public void setPartner(Integer partner) { this.partner = partner; }
    public Integer getDependents() { return dependents; }
    public void setDependents(Integer dependents) { this.dependents = dependents; }
    public Integer getTenure() { return tenure; }
    public void setTenure(Integer tenure) { this.tenure = tenure; }
    public Integer getPhoneService() { return phoneService; }
    public void setPhoneService(Integer phoneService) { this.phoneService = phoneService; }
    public Integer getPaperlessBilling() { return paperlessBilling; }
    public void setPaperlessBilling(Integer paperlessBilling) { this.paperlessBilling = paperlessBilling; }
    public Double getMonthlyCharges() { return monthlyCharges; }
    public void setMonthlyCharges(Double monthlyCharges) { this.monthlyCharges = monthlyCharges; }
    public String getMultipleLines() { return multipleLines; }
    public void setMultipleLines(String multipleLines) { this.multipleLines = multipleLines; }
    public String getInternetService() { return internetService; }
    public void setInternetService(String internetService) { this.internetService = internetService; }
    public String getOnlineSecurity() { return onlineSecurity; }
    public void setOnlineSecurity(String onlineSecurity) { this.onlineSecurity = onlineSecurity; }
    public String getOnlineBackup() { return onlineBackup; }
    public void setOnlineBackup(String onlineBackup) { this.onlineBackup = onlineBackup; }
    public String getDeviceProtection() { return deviceProtection; }
    public void setDeviceProtection(String deviceProtection) { this.deviceProtection = deviceProtection; }
    public String getTechSupport() { return techSupport; }
    public void setTechSupport(String techSupport) { this.techSupport = techSupport; }
    public String getStreamingTV() { return streamingTV; }
    public void setStreamingTV(String streamingTV) { this.streamingTV = streamingTV; }
    public String getStreamingMovies() { return streamingMovies; }
    public void setStreamingMovies(String streamingMovies) { this.streamingMovies = streamingMovies; }
    public String getContract() { return contract; }
    public void setContract(String contract) { this.contract = contract; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
