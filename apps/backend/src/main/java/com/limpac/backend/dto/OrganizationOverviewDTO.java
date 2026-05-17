package com.limpac.backend.dto;

import java.util.UUID;

public record OrganizationOverviewDTO(
        UUID id,
        String name,
        CalculationResponseDTO latestCalculation,
        double progressPct
) {
}
