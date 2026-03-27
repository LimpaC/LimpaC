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

    private Double transactionVolume;
    private Double savedCo2;
    private Double savedPlastic;
    private Double savedPaper;
    private LocalDateTime dateCreate;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private  User manager;

    public Calculation(UUID id, Double transactionVolume, Double savedCo2, Double savedPlastic, Double savedPaper, LocalDateTime dateCreate, User manager) {
        this.id = id;
        this.transactionVolume = transactionVolume;
        this.savedCo2 = savedCo2;
        this.savedPlastic = savedPlastic;
        this.savedPaper = savedPaper;
        this.dateCreate = dateCreate;
        this.manager = manager;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Double getTransactionVolume() {
        return transactionVolume;
    }

    public void setTransactionVolume(Double transactionVolume) {
        this.transactionVolume = transactionVolume;
    }

    public Double getSavedCo2() {
        return savedCo2;
    }

    public void setSavedCo2(Double savedCo2) {
        this.savedCo2 = savedCo2;
    }

    public Double getSavedPlastic() {
        return savedPlastic;
    }

    public void setSavedPlastic(Double savedPlastic) {
        this.savedPlastic = savedPlastic;
    }

    public Double getSavedPaper() {
        return savedPaper;
    }

    public void setSavedPaper(Double savedPaper) {
        this.savedPaper = savedPaper;
    }

    public LocalDateTime getDateCreate() {
        return dateCreate;
    }

    public void setDateCreate(LocalDateTime dateCreate) {
        this.dateCreate = dateCreate;
    }

    public User getManager() {
        return manager;
    }

    public void setManager(User manager) {
        this.manager = manager;
    }
}
