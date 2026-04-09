package com.limpac.backend.dto;

public record DashboardStateResponseDTO(
        GoalResponseDTO goal,
        CalculationResponseDTO latestCalculation,
        CalculationMetricsDTO metrics,
        boolean hasHistory,
        double progressPct
) {
}
