package com.limpac.backend.controller;

import com.limpac.backend.dto.TransactionCalculationRequestDTO;
import com.limpac.backend.dto.TransactionCalculationResponseDTO;
import com.limpac.backend.dto.TransactionDashboardStateResponseDTO;
import com.limpac.backend.dto.TransactionGoalRequestDTO;
import com.limpac.backend.dto.TransactionGoalResponseDTO;
import com.limpac.backend.security.AuthenticatedUser;
import com.limpac.backend.service.TransactionCalculationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/transaction")
public class TransactionCalculationController {

    private final TransactionCalculationService service;

    public TransactionCalculationController(TransactionCalculationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TransactionCalculationResponseDTO> create(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody @Valid TransactionCalculationRequestDTO request) {
        TransactionCalculationResponseDTO response = service.save(request, user.id());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/history")
    public ResponseEntity<List<TransactionCalculationResponseDTO>> findAll(@AuthenticationPrincipal AuthenticatedUser user, @RequestParam UUID organizationId) {
        List<TransactionCalculationResponseDTO> response = service.findAll(organizationId, user.id());

        if (response.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/goal")
    public ResponseEntity<TransactionGoalResponseDTO> updateGoal(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody @Valid TransactionGoalRequestDTO request) {
        TransactionGoalResponseDTO response = service.updateGoal(request, user.id());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/state")
    public ResponseEntity<TransactionDashboardStateResponseDTO> state(@AuthenticationPrincipal AuthenticatedUser user, @RequestParam UUID organizationId) {
        TransactionDashboardStateResponseDTO response = service.state(organizationId, user.id());
        return ResponseEntity.ok(response);
    }
}
