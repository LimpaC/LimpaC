package com.limpac.backend.repository;

import com.limpac.backend.entity.CalculationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CalculationResultRepository extends JpaRepository<CalculationResult, UUID> {

}

