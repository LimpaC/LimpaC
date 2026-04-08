package com.limpac.backend.controller;

import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.service.CalculationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<CalculationResponseDTO>> findAll() {
        List<CalculationResponseDTO> response = service.findAll();

        if (response.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }
}
