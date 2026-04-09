package com.limpac.backend.entity;

import jakarta.persistence.*;
<<<<<<< HEAD

import java.time.LocalDateTime;
import java.util.UUID;

=======
import java.time.LocalDateTime;
import java.util.UUID;

//Variaveis ambientais
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
@Entity
@Table(name = "calculation")
public class Calculation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

<<<<<<< HEAD
    private Double cards;
    private Double co2Impact;
    private Double plasticSaved;
    private Integer treesPreserved;
    private Double waterSaved;
    private Double energySaved;
=======
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
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User manager;

<<<<<<< HEAD
    public Calculation(UUID id, Double cards, Double co2Impact, Double plasticSaved, Integer treesPreserved, Double waterSaved, Double energySaved, LocalDateTime createdAt, User manager) {
        this.id = id;
        this.cards = cards;
        this.co2Impact = co2Impact;
        this.plasticSaved = plasticSaved;
        this.treesPreserved = treesPreserved;
        this.waterSaved = waterSaved;
        this.energySaved = energySaved;
        this.createdAt = createdAt;
        this.manager = manager;
=======
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
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
    }

    public Calculation() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

<<<<<<< HEAD
    public Double getCards() {
        return cards;
    }

    public void setCards(Double cards) {
        this.cards = cards;
    }

    public Double getCo2Impact() {
        return co2Impact;
    }

    public void setCo2Impact(Double co2Impact) {
        this.co2Impact = co2Impact;
    }

    public Double getPlasticSaved() {
        return plasticSaved;
    }

    public void setPlasticSaved(Double plasticSaved) {
        this.plasticSaved = plasticSaved;
    }

    public Integer getTreesPreserved() {
        return treesPreserved;
    }

    public void setTreesPreserved(Integer treesPreserved) {
        this.treesPreserved = treesPreserved;
    }

    public Double getWaterSaved() {
        return waterSaved;
    }

    public void setWaterSaved(Double waterSaved) {
        this.waterSaved = waterSaved;
    }

    public Double getEnergySaved() {
        return energySaved;
    }

    public void setEnergySaved(Double energySaved) {
        this.energySaved = energySaved;
=======
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
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
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
<<<<<<< HEAD
}
=======
}
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
