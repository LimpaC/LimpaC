package com.limpac.backend.dto;

public record CalculationMetricsDTO(
        double co2PerCard,
        double plasticPerCard,
        double treesPerCard,
        double waterPerCard,
        double energyPerCard,
        double moneySavedPerCardBrl,
        double materialCostPerCardBrl,
        double manufacturingCostPerCardBrl,
        double shippingCostPerCardBrl
) {
}
