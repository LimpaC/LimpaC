package com.limpac.backend.repository;

import com.limpac.backend.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    List<Organization> findAllByOwnerIdOrderByCreatedAtAsc(UUID ownerId);
    Optional<Organization> findByIdAndOwnerId(UUID id, UUID ownerId);
}
