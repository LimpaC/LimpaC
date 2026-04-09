package com.limpac.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CalculationResponseDTO(
        UUID id,
        Double cards,
        Double co2Impact,
        Double plasticSaved,
        Integer treesPreserved,
        Double waterSaved,
        Double energySaved,
        Double moneySaved,
        LocalDateTime createdAt
) {
}
