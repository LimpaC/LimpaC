package com.limpac.backend.dto;

import java.time.LocalDateTime;

public record TransactionGoalResponseDTO(
        int targetDigitalPct,
        LocalDateTime updatedAt,
        boolean configured
) {
}
