package com.limpac.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TransactionCalculationResponseDTO(
        UUID id,
        Double totalTransactions,
        Double digitalPct,
        Double digitalTransactions,
        Double physicalTransactions,
        Double co2Avoided,
        Double paperSaved,
        Double waterSaved,
        Double treesPreserved,
        Double moneySaved,
        LocalDateTime createdAt
) {
}
