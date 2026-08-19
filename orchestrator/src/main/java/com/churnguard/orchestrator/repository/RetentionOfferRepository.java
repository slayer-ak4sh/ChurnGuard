package com.churnguard.orchestrator.repository;

import com.churnguard.orchestrator.entity.RetentionOffer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RetentionOfferRepository extends JpaRepository<RetentionOffer, Long> {

    Optional<RetentionOffer> findTopByCustomerIdOrderByCreatedAtDesc(String customerId);
}
