package com.limpac.backend.repository;

import com.limpac.backend.entity.Organization;
import com.limpac.backend.entity.TransactionGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionGoalRepository extends JpaRepository<TransactionGoal, UUID> {
    Optional<TransactionGoal> findByOrganization(Organization organization);
}
