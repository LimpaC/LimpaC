package com.limpac.backend.domain.transaction;

public final class TransactionImpactCalculator {

    private final TransactionImpactFactors factors;

    public TransactionImpactCalculator(TransactionImpactFactors factors) {
        this.factors = factors;
    }

    public TransactionImpactMetrics calculate(TransactionVolume volume) {
        double digital = volume.digitalCount();
        return new TransactionImpactMetrics(
                volume.total(),
                volume.digitalPct(),
                digital,
                volume.physicalCount(),
                digital * factors.co2PerTransaction(),
                digital * factors.paperPerTransaction(),
                digital * factors.waterPerTransaction(),
                digital * factors.treesPerTransaction(),
                digital * factors.moneySavedPerTransactionBrl()
        );
    }
}
