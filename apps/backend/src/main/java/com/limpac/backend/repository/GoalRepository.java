package com.limpac.backend.repository;

import com.limpac.backend.entity.Goal;
import com.limpac.backend.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GoalRepository extends JpaRepository<Goal, UUID> {
    Optional<Goal> findByOrganization(Organization organization);
}
