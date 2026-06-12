package com.limpac.backend.repository;

import com.limpac.backend.entity.Organization;
import com.limpac.backend.entity.TransactionCalculation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionCalculationRepository extends JpaRepository<TransactionCalculation, UUID> {
    List<TransactionCalculation> findAllByOrganizationOrderByCreatedAtAsc(Organization organization);
    Optional<TransactionCalculation> findTopByOrganizationOrderByCreatedAtDesc(Organization organization);
}
