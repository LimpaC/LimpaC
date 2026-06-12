package com.limpac.backend.domain.transaction;

public record TransactionImpactFactors(
        double co2PerTransaction,
        double paperPerTransaction,
        double waterPerTransaction,
        double treesPerTransaction,
        double moneySavedPerTransactionBrl
) {
}
