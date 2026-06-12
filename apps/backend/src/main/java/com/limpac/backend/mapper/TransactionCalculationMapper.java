package com.limpac.backend.mapper;

import com.limpac.backend.domain.transaction.TransactionImpactMetrics;
import com.limpac.backend.dto.TransactionCalculationResponseDTO;
import com.limpac.backend.entity.TransactionCalculation;

public final class TransactionCalculationMapper {

    public TransactionCalculationResponseDTO toResponse(TransactionCalculation entity) {
        return new TransactionCalculationResponseDTO(
                entity.getId(),
                entity.getTotalTransactions(),
                entity.getDigitalPct(),
                entity.getDigitalTransactions(),
                entity.getPhysicalTransactions(),
                entity.getCo2Avoided(),
                entity.getPaperSaved(),
                entity.getWaterSaved(),
                entity.getTreesPreserved(),
                entity.getMoneySaved(),
                entity.getCreatedAt()
        );
    }

    public void applyMetrics(TransactionCalculation entity, TransactionImpactMetrics metrics) {
        entity.setTotalTransactions(metrics.totalTransactions());
        entity.setDigitalPct(metrics.digitalPct());
        entity.setDigitalTransactions(metrics.digitalTransactions());
        entity.setPhysicalTransactions(metrics.physicalTransactions());
        entity.setCo2Avoided(metrics.co2Avoided());
        entity.setPaperSaved(metrics.paperSaved());
        entity.setWaterSaved(metrics.waterSaved());
        entity.setTreesPreserved(metrics.treesPreserved());
        entity.setMoneySaved(metrics.moneySaved());
    }
}
