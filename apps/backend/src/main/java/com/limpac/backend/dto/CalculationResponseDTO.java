package com.limpac.backend.dto;

import com.limpac.backend.entity.Calculation;

import java.time.LocalDateTime;
import java.util.UUID;

public record CalculationResponseDTO(
        UUID id,
        Double cardVolume,
        Double co2Saved,
        Double plasticSaved,
        Double paperSaved,
        Double physicalCo2,
        Double digitalCo2,
        Integer treeEquivalents,
        LocalDateTime createdAt
        // String ManagerName
) {
    public CalculationResponseDTO(UUID id, Double cardVolume, Double co2Saved, Double plasticSaved, Double paperSaved, Double physicalCo2, Double digitalCo2, Integer treeEquivalents, LocalDateTime createdAt) {
        this.id = id;
        this.cardVolume = cardVolume;
        this.co2Saved = co2Saved;
        this.plasticSaved = plasticSaved;
        this.paperSaved = paperSaved;
        this.physicalCo2 = physicalCo2;
        this.digitalCo2 = digitalCo2;
        this.treeEquivalents = treeEquivalents;
        this.createdAt = createdAt;
    }
}

