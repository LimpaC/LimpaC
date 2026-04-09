package com.limpac.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.metrics")
public class CalculationMetricsProperties {

    private double co2PerCard = 0.044;
    private double plasticPerCard = 0.00714;
    private double treesPerCard = 0.0342;
    private double waterPerCard = 12.857;
    private double energyPerCard = 0.514;
    private double materialCostPerCardBrl = 0.56;
    private double manufacturingCostPerCardBrl = 4.34;
    private double shippingCostPerCardBrl = 3.70;

    public double getCo2PerCard() {
        return co2PerCard;
    }

    public void setCo2PerCard(double co2PerCard) {
        this.co2PerCard = co2PerCard;
    }

    public double getPlasticPerCard() {
        return plasticPerCard;
    }

    public void setPlasticPerCard(double plasticPerCard) {
        this.plasticPerCard = plasticPerCard;
    }

    public double getTreesPerCard() {
        return treesPerCard;
    }

    public void setTreesPerCard(double treesPerCard) {
        this.treesPerCard = treesPerCard;
    }

    public double getWaterPerCard() {
        return waterPerCard;
    }

    public void setWaterPerCard(double waterPerCard) {
        this.waterPerCard = waterPerCard;
    }

    public double getEnergyPerCard() {
        return energyPerCard;
    }

    public void setEnergyPerCard(double energyPerCard) {
        this.energyPerCard = energyPerCard;
    }

    public double getMaterialCostPerCardBrl() {
        return materialCostPerCardBrl;
    }

    public void setMaterialCostPerCardBrl(double materialCostPerCardBrl) {
        this.materialCostPerCardBrl = materialCostPerCardBrl;
    }

    public double getManufacturingCostPerCardBrl() {
        return manufacturingCostPerCardBrl;
    }

    public void setManufacturingCostPerCardBrl(double manufacturingCostPerCardBrl) {
        this.manufacturingCostPerCardBrl = manufacturingCostPerCardBrl;
    }

    public double getShippingCostPerCardBrl() {
        return shippingCostPerCardBrl;
    }

    public void setShippingCostPerCardBrl(double shippingCostPerCardBrl) {
        this.shippingCostPerCardBrl = shippingCostPerCardBrl;
    }

    public double getMoneySavedPerCardBrl() {
        return materialCostPerCardBrl + manufacturingCostPerCardBrl + shippingCostPerCardBrl;
    }
}
