package com.limpac.backend.mapper;

import com.limpac.backend.domain.calculation.ImpactMetrics;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.entity.Calculation;

public final class CalculationMapper {

    public CalculationResponseDTO toResponse(Calculation entity) {
        return new CalculationResponseDTO(
                entity.getId(),
                entity.getCards(),
                entity.getCo2Impact(),
                entity.getPlasticSaved(),
                entity.getTreesPreserved(),
                entity.getWaterSaved(),
                entity.getEnergySaved(),
                entity.getMoneySaved(),
                entity.getCreatedAt()
        );
    }

    public void applyMetrics(Calculation entity, ImpactMetrics metrics) {
        entity.setCards(metrics.cards());
        entity.setCo2Impact(metrics.co2Impact());
        entity.setPlasticSaved(metrics.plasticSaved());
        entity.setTreesPreserved(metrics.treesPreserved());
        entity.setWaterSaved(metrics.waterSaved());
        entity.setEnergySaved(metrics.energySaved());
        entity.setMoneySaved(metrics.moneySaved());
    }
}
