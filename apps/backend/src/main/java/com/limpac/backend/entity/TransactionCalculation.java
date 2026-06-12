package com.limpac.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transaction_calculation")
public class TransactionCalculation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private Double totalTransactions;
    private Double digitalPct;
    private Double digitalTransactions;
    private Double physicalTransactions;
    private Double co2Avoided;
    private Double paperSaved;
    private Double waterSaved;
    private Double treesPreserved;
    private Double moneySaved;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "organization_id")
    private Organization organization;

    public TransactionCalculation() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Double getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(Double totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public Double getDigitalPct() {
        return digitalPct;
    }

    public void setDigitalPct(Double digitalPct) {
        this.digitalPct = digitalPct;
    }

    public Double getDigitalTransactions() {
        return digitalTransactions;
    }

    public void setDigitalTransactions(Double digitalTransactions) {
        this.digitalTransactions = digitalTransactions;
    }

    public Double getPhysicalTransactions() {
        return physicalTransactions;
    }

    public void setPhysicalTransactions(Double physicalTransactions) {
        this.physicalTransactions = physicalTransactions;
    }

    public Double getCo2Avoided() {
        return co2Avoided;
    }

    public void setCo2Avoided(Double co2Avoided) {
        this.co2Avoided = co2Avoided;
    }

    public Double getPaperSaved() {
        return paperSaved;
    }

    public void setPaperSaved(Double paperSaved) {
        this.paperSaved = paperSaved;
    }

    public Double getWaterSaved() {
        return waterSaved;
    }

    public void setWaterSaved(Double waterSaved) {
        this.waterSaved = waterSaved;
    }

    public Double getTreesPreserved() {
        return treesPreserved;
    }

    public void setTreesPreserved(Double treesPreserved) {
        this.treesPreserved = treesPreserved;
    }

    public Double getMoneySaved() {
        return moneySaved;
    }

    public void setMoneySaved(Double moneySaved) {
        this.moneySaved = moneySaved;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }
}
