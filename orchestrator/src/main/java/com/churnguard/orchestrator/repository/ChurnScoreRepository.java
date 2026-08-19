package com.churnguard.orchestrator.repository;

import com.churnguard.orchestrator.entity.ChurnScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChurnScoreRepository extends JpaRepository<ChurnScore, Long> {

    Optional<ChurnScore> findTopByCustomerIdOrderByCreatedAtDesc(String customerId);

    List<ChurnScore> findTop200ByOrderByCreatedAtDesc();
}
