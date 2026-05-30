package com.limpac.backend.domain.calculation;

public final class ImpactCalculator {

    private final ImpactFactors factors;

    public ImpactCalculator(ImpactFactors factors) {
        this.factors = factors;
    }

    public ImpactMetrics calculate(CardQuantity cards) {
        double value = cards.value();
        return new ImpactMetrics(
                value,
                value * factors.co2PerCard(),
                value * factors.plasticPerCard(),
                (int) Math.round(value * factors.treesPerCard()),
                value * factors.waterPerCard(),
                value * factors.energyPerCard(),
                value * factors.moneySavedPerCardBrl()
        );
    }
}
