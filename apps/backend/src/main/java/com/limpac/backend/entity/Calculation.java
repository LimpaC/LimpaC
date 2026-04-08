package com.limpac.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

//Variaveis ambientais
@Entity
@Table(name = "calculation")
public class Calculation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    // CO2
    private Double cardVolume;
    private Double physicalCo2Generated;
    private Double digitalCo2Generated;
    private Double co2Saved;

    // Material Metrics
    private Double physicalPlasticGenerated;
    private Double digitalPlasticGenerated;
    private Double physicalPaperGenerated;
    private Double digitalPaperGenerated;

    // Visual Metric
    private Integer treeEquivalents;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User manager;

    public Calculation(UUID id, Double cardVolume, Double physicalCo2Generated, Double digitalCo2Generated, Double co2Saved, Double physicalPlasticGenerated, Double digitalPlasticGenerated, Double physicalPaperGenerated, Double digitalPaperGenerated, Integer treeEquivalents, LocalDateTime createdAt) {
        this.id = id;
        this.cardVolume = cardVolume;
        this.physicalCo2Generated = physicalCo2Generated;
        this.digitalCo2Generated = digitalCo2Generated;
        this.co2Saved = co2Saved;
        this.physicalPlasticGenerated = physicalPlasticGenerated;
        this.digitalPlasticGenerated = digitalPlasticGenerated;
        this.physicalPaperGenerated = physicalPaperGenerated;
        this.digitalPaperGenerated = digitalPaperGenerated;
        this.treeEquivalents = treeEquivalents;
        this.createdAt = createdAt;
        //this.manager = manager;
    }

    public Calculation() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Double getCardVolume() {
        return cardVolume;
    }

    public void setCardVolume(Double cardVolume) {
        this.cardVolume = cardVolume;
    }

    public Double getPhysicalCo2Generated() {
        return physicalCo2Generated;
    }

    public void setPhysicalCo2Generated(Double physicalCo2Generated) {
        this.physicalCo2Generated = physicalCo2Generated;
    }

    public Double getDigitalCo2Generated() {
        return digitalCo2Generated;
    }

    public void setDigitalCo2Generated(Double digitalCo2Generated) {
        this.digitalCo2Generated = digitalCo2Generated;
    }

    public Double getCo2Saved() {
        return co2Saved;
    }

    public void setCo2Saved(Double co2Saved) {
        this.co2Saved = co2Saved;
    }

    public Double getPhysicalPlasticGenerated() {
        return physicalPlasticGenerated;
    }

    public void setPhysicalPlasticGenerated(Double physicalPlasticGenerated) {
        this.physicalPlasticGenerated = physicalPlasticGenerated;
    }

    public Double getDigitalPlasticGenerated() {
        return digitalPlasticGenerated;
    }

    public void setDigitalPlasticGenerated(Double digitalPlasticGenerated) {
        this.digitalPlasticGenerated = digitalPlasticGenerated;
    }

    public Double getPhysicalPaperGenerated() {
        return physicalPaperGenerated;
    }

    public void setPhysicalPaperGenerated(Double physicalPaperGenerated) {
        this.physicalPaperGenerated = physicalPaperGenerated;
    }

    public Double getDigitalPaperGenerated() {
        return digitalPaperGenerated;
    }

    public void setDigitalPaperGenerated(Double digitalPaperGenerated) {
        this.digitalPaperGenerated = digitalPaperGenerated;
    }

    public Integer getTreeEquivalents() {
        return treeEquivalents;
    }

    public void setTreeEquivalents(Integer treeEquivalents) {
        this.treeEquivalents = treeEquivalents;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public User getManager() {
        return manager;
    }

    public void setManager(User manager) {
        this.manager = manager;
    }
}