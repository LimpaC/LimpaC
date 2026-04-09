package com.limpac.backend.repository;

import com.limpac.backend.entity.Goal;
import com.limpac.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GoalRepository extends JpaRepository<Goal, UUID> {
    Optional<Goal> findByManager(User manager);
}
