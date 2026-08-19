package com.churnguard.orchestrator.repository;

import com.churnguard.orchestrator.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, String> {

    List<Customer> findTop100ByOrderByUpdatedAtDesc();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.riskLevel = :level")
    long countByRiskLevel(String level);

    @Query("SELECT AVG(c.latestChurnScore) FROM Customer c WHERE c.latestChurnScore IS NOT NULL")
    Double avgChurnScore();
}
