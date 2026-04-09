package com.limpac.backend.controller;

import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.dto.CalculationIncrementRequestDTO;
import com.limpac.backend.dto.CalculationDecrementRequestDTO;
import com.limpac.backend.dto.DashboardStateResponseDTO;
import com.limpac.backend.service.CalculationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<CalculationResponseDTO> createSimulation(@RequestBody @Valid CalculationRequestDTO request) {
        CalculationResponseDTO response = service.save(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/history")
    public ResponseEntity<List<CalculationResponseDTO>> findAll(@RequestParam UUID token) {
        List<CalculationResponseDTO> response = service.findAll(token);

        if (response.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/increment")
    public ResponseEntity<CalculationResponseDTO> increment(@RequestBody @Valid CalculationIncrementRequestDTO request) {
        CalculationResponseDTO response = service.increment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/decrement")
    public ResponseEntity<CalculationResponseDTO> decrement(@RequestBody @Valid CalculationDecrementRequestDTO request) {
        CalculationResponseDTO response = service.decrement(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/state")
    public ResponseEntity<DashboardStateResponseDTO> state(@RequestParam UUID token) {
        DashboardStateResponseDTO response = service.state(token);
        return ResponseEntity.ok(response);
    }
}
