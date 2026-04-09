package com.limpac.backend.repository;

import com.limpac.backend.entity.Calculation;
import com.limpac.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CalculationRepository extends JpaRepository<Calculation, UUID> {
    List<Calculation> findAllByManager(User manager);
}
