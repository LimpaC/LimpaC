package com.limpac.backend.dto;

import java.util.List;
import java.util.UUID;

public record AdminOrganizationDashboardDTO(
        UUID id,
        String name,
        UUID ownerId,
        String ownerName,
        String ownerEmail,
        GoalResponseDTO goal,
        double goalProgressPct,
        CalculationResponseDTO latestCalculation,
        List<CalculationResponseDTO> history,
        TransactionCalculationResponseDTO latestTransactionCalculation,
        List<TransactionCalculationResponseDTO> transactionHistory
) {
}
