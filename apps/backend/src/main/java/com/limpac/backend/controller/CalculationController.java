package com.limpac.backend.controller;

import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.dto.CalculationIncrementRequestDTO;
import com.limpac.backend.dto.CalculationDecrementRequestDTO;
import com.limpac.backend.dto.DashboardStateResponseDTO;
import com.limpac.backend.security.AuthenticatedUser;
import com.limpac.backend.service.CalculationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/calculation")
public class CalculationController {

    private final CalculationService service;

    public CalculationController(CalculationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CalculationResponseDTO> createSimulation(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody @Valid CalculationRequestDTO request) {
        CalculationResponseDTO response = service.save(request, user.id());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/history")
    public ResponseEntity<List<CalculationResponseDTO>> findAll(@AuthenticationPrincipal AuthenticatedUser user, @RequestParam UUID organizationId) {
        List<CalculationResponseDTO> response = service.findAll(organizationId, user.id());

        if (response.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/increment")
    public ResponseEntity<CalculationResponseDTO> increment(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody @Valid CalculationIncrementRequestDTO request) {
        CalculationResponseDTO response = service.increment(request, user.id());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/decrement")
    public ResponseEntity<CalculationResponseDTO> decrement(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody @Valid CalculationDecrementRequestDTO request) {
        CalculationResponseDTO response = service.decrement(request, user.id());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/state")
    public ResponseEntity<DashboardStateResponseDTO> state(@AuthenticationPrincipal AuthenticatedUser user, @RequestParam UUID organizationId) {
        DashboardStateResponseDTO response = service.state(organizationId, user.id());
        return ResponseEntity.ok(response);
    }
}
