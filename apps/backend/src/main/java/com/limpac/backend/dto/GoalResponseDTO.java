package com.limpac.backend.dto;

import java.time.LocalDateTime;

public record GoalResponseDTO(
        Integer targetCards,
        LocalDateTime updatedAt
) {
}
