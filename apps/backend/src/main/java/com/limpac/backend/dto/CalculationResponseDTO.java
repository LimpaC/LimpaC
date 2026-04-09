package com.limpac.backend.dto;

<<<<<<< HEAD
=======
import com.limpac.backend.entity.Calculation;

>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
import java.time.LocalDateTime;
import java.util.UUID;

public record CalculationResponseDTO(
        UUID id,
<<<<<<< HEAD
        Double cards,
        Double co2Impact,
        Double plasticSaved,
        Integer treesPreserved,
        Double waterSaved,
        Double energySaved,
        LocalDateTime createdAt
) {
}
=======
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

>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
