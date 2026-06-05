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
        List<AdminOrganizationDashboardDTO> organizations
) {
}
