package com.limpac.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "calculation")
public class Calculation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private Double cards;
    private Double co2Impact;
    private Double plasticSaved;
    private Integer treesPreserved;
    private Double waterSaved;
    private Double energySaved;
    private Double moneySaved;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User manager;

    public Calculation(UUID id, Double cards, Double co2Impact, Double plasticSaved, Integer treesPreserved, Double waterSaved, Double energySaved, Double moneySaved, LocalDateTime createdAt, User manager) {
        this.id = id;
        this.cards = cards;
        this.co2Impact = co2Impact;
        this.plasticSaved = plasticSaved;
        this.treesPreserved = treesPreserved;
        this.waterSaved = waterSaved;
        this.energySaved = energySaved;
        this.moneySaved = moneySaved;
        this.createdAt = createdAt;
        this.manager = manager;
    }

    public Calculation() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public User getManager() {
        return manager;
    }

    public void setManager(User manager) {
        this.manager = manager;
    }
}
