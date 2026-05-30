package com.limpac.backend.domain.calculation;

public record ImpactMetrics(
        double cards,
        double co2Impact,
        double plasticSaved,
        int treesPreserved,
        double waterSaved,
        double energySaved,
        double moneySaved
) {
}
