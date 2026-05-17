package com.limpac.backend.repository;

import com.limpac.backend.entity.Calculation;
import com.limpac.backend.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CalculationRepository extends JpaRepository<Calculation, UUID> {
    List<Calculation> findAllByOrganizationOrderByCreatedAtAsc(Organization organization);
    Optional<Calculation> findTopByOrganizationOrderByCreatedAtDesc(Organization organization);
    List<Calculation> findAllByOrganizationOwnerId(UUID ownerId);
}
