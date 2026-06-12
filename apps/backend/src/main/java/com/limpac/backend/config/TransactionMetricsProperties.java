package com.limpac.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.transaction-metrics")
public class TransactionMetricsProperties {

    private double co2PerTransaction = 0.007;
    private double paperPerTransaction = 0.0023;
    private double waterPerTransaction = 0.133;
    private double treesPerTransaction = 0.0000117;
    private double paperCostPerTransactionBrl = 0.06;
    private double cashHandlingCostPerTransactionBrl = 0.28;

    public double getCo2PerTransaction() {
        return co2PerTransaction;
    }

    public void setCo2PerTransaction(double co2PerTransaction) {
        this.co2PerTransaction = co2PerTransaction;
    }

    public double getPaperPerTransaction() {
        return paperPerTransaction;
    }

    public void setPaperPerTransaction(double paperPerTransaction) {
        this.paperPerTransaction = paperPerTransaction;
    }

    public double getWaterPerTransaction() {
        return waterPerTransaction;
    }

    public void setWaterPerTransaction(double waterPerTransaction) {
        this.waterPerTransaction = waterPerTransaction;
    }

    public double getTreesPerTransaction() {
        return treesPerTransaction;
    }

    public void setTreesPerTransaction(double treesPerTransaction) {
        this.treesPerTransaction = treesPerTransaction;
    }

    public double getPaperCostPerTransactionBrl() {
        return paperCostPerTransactionBrl;
    }

    public void setPaperCostPerTransactionBrl(double paperCostPerTransactionBrl) {
        this.paperCostPerTransactionBrl = paperCostPerTransactionBrl;
    }

    public double getCashHandlingCostPerTransactionBrl() {
        return cashHandlingCostPerTransactionBrl;
    }

    public void setCashHandlingCostPerTransactionBrl(double cashHandlingCostPerTransactionBrl) {
        this.cashHandlingCostPerTransactionBrl = cashHandlingCostPerTransactionBrl;
    }

    public double getMoneySavedPerTransactionBrl() {
        return paperCostPerTransactionBrl + cashHandlingCostPerTransactionBrl;
    }
}
