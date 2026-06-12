package com.limpac.backend.domain.transaction;

public record TransactionVolume(double total, double digitalPct) {

    public double digitalCount() {
        return total * (digitalPct / 100.0);
    }

    public double physicalCount() {
        return total - digitalCount();
    }
}
