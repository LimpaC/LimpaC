package com.limpac.backend.domain.transaction;

public record TransactionImpactMetrics(
        double totalTransactions,
        double digitalPct,
        double digitalTransactions,
        double physicalTransactions,
        double co2Avoided,
        double paperSaved,
        double waterSaved,
        double treesPreserved,
        double moneySaved
) {
}
