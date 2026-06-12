package com.limpac.backend.dto;

import java.util.List;

public record AdminDashboardResponseDTO(
        double totalCards,
        double totalCo2Impact,
        double totalPlasticSaved,
        int totalTreesPreserved,
        double totalWaterSaved,
        double totalEnergySaved,
        double totalMoneySaved,
        int totalGoalCards,
        double totalGoalProgressPct,
        double totalTransactions,
        double totalDigitalTransactions,
        double totalTransactionMoneySaved,
        double totalTransactionCo2Avoided,
        double totalTransactionPaperSaved,
        List<AdminOrganizationDashboardDTO> organizations
) {
}
