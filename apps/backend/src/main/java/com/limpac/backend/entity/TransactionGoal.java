package com.limpac.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transaction_goal")
public class TransactionGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private Integer targetDigitalPct;
    private boolean configured;
    private LocalDateTime updatedAt;

    @OneToOne
    @JoinColumn(name = "organization_id")
    private Organization organization;

    public TransactionGoal() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Integer getTargetDigitalPct() {
        return targetDigitalPct;
    }

    public void setTargetDigitalPct(Integer targetDigitalPct) {
        this.targetDigitalPct = targetDigitalPct;
    }

    public boolean isConfigured() {
        return configured;
    }

    public void setConfigured(boolean configured) {
        this.configured = configured;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }
}
