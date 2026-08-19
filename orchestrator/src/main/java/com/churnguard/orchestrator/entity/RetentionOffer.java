package com.churnguard.orchestrator.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "retention_offers")
public class RetentionOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerId;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> recommendations;

    @JsonProperty("retention_message")
    @Column(columnDefinition = "TEXT")
    private String retentionMessage;

    @JsonProperty("churn_drivers")
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> churnDrivers;

    @JsonProperty("estimated_cltv")
    private Double estimatedCltv;
    private String source;
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public Long getId() { return id; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public List<Map<String, Object>> getRecommendations() { return recommendations; }
    public void setRecommendations(List<Map<String, Object>> recommendations) { this.recommendations = recommendations; }
    public String getRetentionMessage() { return retentionMessage; }
    public void setRetentionMessage(String retentionMessage) { this.retentionMessage = retentionMessage; }
    public List<String> getChurnDrivers() { return churnDrivers; }
    public void setChurnDrivers(List<String> churnDrivers) { this.churnDrivers = churnDrivers; }
    public Double getEstimatedCltv() { return estimatedCltv; }
    public void setEstimatedCltv(Double estimatedCltv) { this.estimatedCltv = estimatedCltv; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
