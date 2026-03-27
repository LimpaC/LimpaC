package com.limpac.backend.repository;

import com.limpac.backend.entity.Calculation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CalculationRepository extends JpaRepository<Calculation, UUID> {

}
