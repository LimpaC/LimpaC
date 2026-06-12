package com.limpac.backend.dto;

public record TransactionMetricsDTO(
        double co2PerTransaction,
        double paperPerTransaction,
        double waterPerTransaction,
        double treesPerTransaction,
        double paperCostPerTransactionBrl,
        double cashHandlingCostPerTransactionBrl,
        double moneySavedPerTransactionBrl
) {
}
