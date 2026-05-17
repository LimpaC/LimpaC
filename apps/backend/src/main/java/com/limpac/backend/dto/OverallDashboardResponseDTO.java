package com.limpac.backend.dto;

import java.util.List;

public record OverallDashboardResponseDTO(
        double totalCards,
        double totalCo2Impact,
        double totalWaterSaved,
        double totalEnergySaved,
        double totalMoneySaved,
        List<OrganizationOverviewDTO> organizations
) {
}
