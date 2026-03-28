package com.limpac.backend.dto;

import com.limpac.backend.entity.Calculation;

import java.time.LocalDateTime;
import java.util.UUID;

public record CalculationResponseDTO(
        UUID id,
        Double transactionVolume,
        Double savedCo2,
        Double savedPlastic,
        Double savedPaper,
        LocalDateTime dateCreate,
        Integer equivalentTrees,
        LocalDateTime DateCreate
       // String ManagerName
) {

    public CalculationResponseDTO(UUID id, Double transactionVolume, Double savedCo2, Double savedPlastic, Double savedPaper, Integer equivalentTrees, LocalDateTime dateCreate) {
        this(id, transactionVolume, savedCo2, savedPlastic, savedPaper, dateCreate, equivalentTrees, dateCreate);
    }
}
