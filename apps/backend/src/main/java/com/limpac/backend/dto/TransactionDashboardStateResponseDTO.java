package com.limpac.backend.dto;

public record TransactionDashboardStateResponseDTO(
        TransactionGoalResponseDTO goal,
        TransactionCalculationResponseDTO latestCalculation,
        TransactionMetricsDTO metrics,
        boolean hasHistory,
        double progressPct
) {
}
