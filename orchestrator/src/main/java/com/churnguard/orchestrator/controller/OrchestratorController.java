package com.churnguard.orchestrator.controller;

import com.churnguard.orchestrator.dto.AnalyzeRequest;
import com.churnguard.orchestrator.service.OrchestratorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Map;

@RestController
public class OrchestratorController {

    private final OrchestratorService service;

    public OrchestratorController(OrchestratorService service) {
        this.service = service;
    }

    @GetMapping("/")
    public RedirectView root() {
        return new RedirectView("/health");
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "storage", "postgresql", "message", "Orchestrator is running. Frontend is at http://localhost:3000"));
    }

    @PostMapping("/api/analyze")
    public ResponseEntity<Map<String, Object>> analyze(@Valid @RequestBody AnalyzeRequest req) {
        return ResponseEntity.ok(service.analyze(req));
    }

    @GetMapping("/api/customers")
    public ResponseEntity<?> listCustomers() {
        return ResponseEntity.ok(service.listCustomers());
    }

    @GetMapping("/api/customers/{customerId}")
    public ResponseEntity<?> getCustomer(@PathVariable String customerId) {
        return ResponseEntity.ok(service.getCustomer(customerId));
    }

    @GetMapping("/api/dashboard/stats")
    public ResponseEntity<?> dashboardStats() {
        return ResponseEntity.ok(service.getDashboardStats());
    }

    @GetMapping("/api/scores")
    public ResponseEntity<?> allScores() {
        return ResponseEntity.ok(service.getAllScores());
    }
}
