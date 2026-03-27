package com.limpac.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

//Variaveis ambientais
@Entity
@Table(name = "calculation")
public class Calculation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    //Totais de cartões fisicos
    @Column(name = "total_physical_cards", nullable = false)
    private Integer totalPhysicalCards;

    //Transações mensais
    @Column(name = "monthly_transactions", nullable = false)
    private Integer monthlyTransactions;

    //Periodo de meses (ex: 12 meses)
    @Column(name = "period_months", nullable = false)
    private Integer periodMonths;

    //Percentual de energia renovável
    @Column(name = "renewable_energy_percent", nullable = false)
    private Integer renewableEnergyPercent;

    //Distancia de entrega em KM
    @Column(name = "avg_delivery_distance_km")
    private Double avgDeliveryDistanceKm;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    //Resultados
    @OneToOne(mappedBy = "calculation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private CalculationResult result;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Calculation() {}

    public Calculation(Integer totalPhysicalCards, Integer monthlyTransactions,
                       Integer periodMonths, Integer renewableEnergyPercent,
                       Double avgDeliveryDistanceKm) {
        this.totalPhysicalCards = totalPhysicalCards;
        this.monthlyTransactions = monthlyTransactions;
        this.periodMonths = periodMonths;
        this.renewableEnergyPercent = renewableEnergyPercent;
        this.avgDeliveryDistanceKm = avgDeliveryDistanceKm;
    }

    public UUID getId() { return id; }

    public Integer getTotalPhysicalCards() { return totalPhysicalCards; }
    public void setTotalPhysicalCards(Integer v) { this.totalPhysicalCards = v; }

    public Integer getMonthlyTransactions() { return monthlyTransactions; }
    public void setMonthlyTransactions(Integer v) { this.monthlyTransactions = v; }

    public Integer getPeriodMonths() { return periodMonths; }
    public void setPeriodMonths(Integer v) { this.periodMonths = v; }

    public Integer getRenewableEnergyPercent() { return renewableEnergyPercent; }
    public void setRenewableEnergyPercent(Integer v) { this.renewableEnergyPercent = v; }

    public Double getAvgDeliveryDistanceKm() { return avgDeliveryDistanceKm; }
    public void setAvgDeliveryDistanceKm(Double v) { this.avgDeliveryDistanceKm = v; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public CalculationResult getResult() { return result; }
    public void setResult(CalculationResult result) { this.result = result; }
}
