package com.churnguard.orchestrator.dto;

public class DashboardStats {
    private long totalCustomers;
    private long highRisk;
    private long mediumRisk;
    private long lowRisk;
    private double avgChurnProbability;

    public DashboardStats(long totalCustomers, long highRisk, long mediumRisk, long lowRisk, double avgChurnProbability) {
        this.totalCustomers = totalCustomers;
        this.highRisk = highRisk;
        this.mediumRisk = mediumRisk;
        this.lowRisk = lowRisk;
        this.avgChurnProbability = avgChurnProbability;
    }

    public long getTotalCustomers() { return totalCustomers; }
    public long getHighRisk() { return highRisk; }
    public long getMediumRisk() { return mediumRisk; }
    public long getLowRisk() { return lowRisk; }
    public double getAvgChurnProbability() { return avgChurnProbability; }
}
