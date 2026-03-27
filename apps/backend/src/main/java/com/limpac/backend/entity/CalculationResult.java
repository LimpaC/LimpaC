package com.limpac.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
//Resultado dos Calculos das variaveis ambientais
@Entity
@Table(name = "calculation_result")
public class CalculationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calculation_id", nullable = false, unique = true)
    private Calculation calculation;

    // ... Cenário físico ...

    //Fabricação de CO2 em KG
    @Column(name = "manufacturing_co2_kg", nullable = false)
    private Double manufacturingCo2Kg;

    //Plastico em KG
    @Column(name = "plastic_weight_kg", nullable = false)
    private Double plasticWeightKg;

    //Logistica de CO2
    @Column(name = "logistics_co2_kg", nullable = false)
    private Double logisticsCo2Kg;


    @Column(name = "welcome_kit_paper_kg", nullable = false)
    private Double welcomeKitPaperKg;


    @Column(name = "welcome_kit_co2_kg", nullable = false)
    private Double welcomeKitCo2Kg;

    //Descarte de CO2
    @Column(name = "disposal_co2_kg", nullable = false)
    private Double disposalCo2Kg;


    @Column(name = "physical_transaction_energy_co2_kg", nullable = false)
    private Double physicalTransactionEnergyCo2Kg;

    //Quantidade de água consumida
    @Column(name = "water_consumption_liters", nullable = false)
    private Double waterConsumptionLiters;

    //Co2 total
    @Column(name = "total_physical_co2_kg", nullable = false)
    private Double totalPhysicalCo2Kg;

    // ... Cenário Digital ...

    //Energia de transação CO2
    @Column(name = "digital_transaction_energy_co2_kg", nullable = false)
    private Double digitalTransactionEnergyCo2Kg;

    //CO2 do datacenter
    @Column(name = "datacenter_co2_kg", nullable = false)
    private Double datacenterCo2Kg;

    //Total de CO2 digital
    @Column(name = "total_digital_co2_kg", nullable = false)
    private Double totalDigitalCo2Kg;

    // ... salvo ...
    @Column(name = "co2_saved_kg", nullable = false)
    private Double co2SavedKg;

    @Column(name = "plastic_saved_kg", nullable = false)
    private Double plasticSavedKg;

    @Column(name = "paper_saved_kg", nullable = false)
    private Double paperSavedKg;

    //Redução do percentual do CO2
    @Column(name = "co2_reduction_percent", nullable = false)
    private Double co2ReductionPercent;

    // ... Equivalencia ambiental ...

    //Árvores salvas
    @Column(name = "trees_saved_per_year", nullable = false)
    private Double treesSavedPerYear;

    //Garrafas pet
    @Column(name = "plastic_bottles_equivalent", nullable = false)
    private Double plasticBottlesEquivalent;

    //Km de transporte poupado
    @Column(name = "car_km_equivalent", nullable = false)
    private Double carKmEquivalent;

    //Água salva
    @Column(name = "water_saved_liters", nullable = false)
    private Double waterSavedLiters;

    // ... Metadados ...

    //Fator emissão efetiva
    @Column(name = "effective_emission_factor", nullable = false)
    private Double effectiveEmissionFactor;

    //Data de geração
    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @PrePersist
    public void prePersist() {
        this.generatedAt = LocalDateTime.now();
    }

    public CalculationResult() {}

    public UUID getId() { return id; }

    public Calculation getCalculation() { return calculation; }
    public void setCalculation(Calculation calculation) { this.calculation = calculation; }

    public Double getManufacturingCo2Kg() { return manufacturingCo2Kg; }
    public void setManufacturingCo2Kg(Double v) { this.manufacturingCo2Kg = v; }

    public Double getPlasticWeightKg() { return plasticWeightKg; }
    public void setPlasticWeightKg(Double v) { this.plasticWeightKg = v; }

    public Double getLogisticsCo2Kg() { return logisticsCo2Kg; }
    public void setLogisticsCo2Kg(Double v) { this.logisticsCo2Kg = v; }

    public Double getWelcomeKitPaperKg() { return welcomeKitPaperKg; }
    public void setWelcomeKitPaperKg(Double v) { this.welcomeKitPaperKg = v; }

    public Double getWelcomeKitCo2Kg() { return welcomeKitCo2Kg; }
    public void setWelcomeKitCo2Kg(Double v) { this.welcomeKitCo2Kg = v; }

    public Double getDisposalCo2Kg() { return disposalCo2Kg; }
    public void setDisposalCo2Kg(Double v) { this.disposalCo2Kg = v; }

    public Double getPhysicalTransactionEnergyCo2Kg() { return physicalTransactionEnergyCo2Kg; }
    public void setPhysicalTransactionEnergyCo2Kg(Double v) { this.physicalTransactionEnergyCo2Kg = v; }

    public Double getWaterConsumptionLiters() { return waterConsumptionLiters; }
    public void setWaterConsumptionLiters(Double v) { this.waterConsumptionLiters = v; }

    public Double getTotalPhysicalCo2Kg() { return totalPhysicalCo2Kg; }
    public void setTotalPhysicalCo2Kg(Double v) { this.totalPhysicalCo2Kg = v; }

    public Double getDigitalTransactionEnergyCo2Kg() { return digitalTransactionEnergyCo2Kg; }
    public void setDigitalTransactionEnergyCo2Kg(Double v) { this.digitalTransactionEnergyCo2Kg = v; }

    public Double getDatacenterCo2Kg() { return datacenterCo2Kg; }
    public void setDatacenterCo2Kg(Double v) { this.datacenterCo2Kg = v; }

    public Double getTotalDigitalCo2Kg() { return totalDigitalCo2Kg; }
    public void setTotalDigitalCo2Kg(Double v) { this.totalDigitalCo2Kg = v; }

    public Double getCo2SavedKg() { return co2SavedKg; }
    public void setCo2SavedKg(Double v) { this.co2SavedKg = v; }

    public Double getPlasticSavedKg() { return plasticSavedKg; }
    public void setPlasticSavedKg(Double v) { this.plasticSavedKg = v; }

    public Double getPaperSavedKg() { return paperSavedKg; }
    public void setPaperSavedKg(Double v) { this.paperSavedKg = v; }

    public Double getCo2ReductionPercent() { return co2ReductionPercent; }
    public void setCo2ReductionPercent(Double v) { this.co2ReductionPercent = v; }

    public Double getTreesSavedPerYear() { return treesSavedPerYear; }
    public void setTreesSavedPerYear(Double v) { this.treesSavedPerYear = v; }

    public Double getPlasticBottlesEquivalent() { return plasticBottlesEquivalent; }
    public void setPlasticBottlesEquivalent(Double v) { this.plasticBottlesEquivalent = v; }

    public Double getCarKmEquivalent() { return carKmEquivalent; }
    public void setCarKmEquivalent(Double v) { this.carKmEquivalent = v; }

    public Double getWaterSavedLiters() { return waterSavedLiters; }
    public void setWaterSavedLiters(Double v) { this.waterSavedLiters = v; }

    public Double getEffectiveEmissionFactor() { return effectiveEmissionFactor; }
    public void setEffectiveEmissionFactor(Double v) { this.effectiveEmissionFactor = v; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
}