package com.limpac.backend.domain.calculation;

public record ImpactFactors(
        double co2PerCard,
        double plasticPerCard,
        double treesPerCard,
        double waterPerCard,
        double energyPerCard,
        double moneySavedPerCardBrl
) {
}
