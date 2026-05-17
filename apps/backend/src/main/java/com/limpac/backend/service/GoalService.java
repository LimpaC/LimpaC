package com.limpac.backend.service;

import com.limpac.backend.dto.GoalRequestDTO;
import com.limpac.backend.dto.GoalResponseDTO;
import com.limpac.backend.entity.Goal;
import com.limpac.backend.entity.Organization;
import com.limpac.backend.repository.GoalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class GoalService {

    public static final int DEFAULT_TARGET_CARDS = 350;

    private final GoalRepository goalRepository;
    private final OrganizationService organizationService;

    public GoalService(GoalRepository goalRepository, OrganizationService organizationService) {
        this.goalRepository = goalRepository;
        this.organizationService = organizationService;
    }

    @Transactional
    public GoalResponseDTO upsert(GoalRequestDTO dto, UUID ownerId) {
        if (dto.targetCards() <= 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "A meta deve ser maior que zero.");
        }

        Organization organization = organizationService.getOwnedOrganization(dto.organizationId(), ownerId);
        Goal goal = goalRepository.findByOrganization(organization).orElseGet(() -> {
            Goal created = new Goal();
            created.setOrganization(organization);
            created.setConfigured(false);
            return created;
        });

        goal.setTargetCards(dto.targetCards());
        goal.setUpdatedAt(LocalDateTime.now());
        goal.setConfigured(true);

        Goal saved = goalRepository.save(goal);
        return toDTO(saved);
    }

    @Transactional
    public Goal getOrCreateByOrganization(Organization organization) {
        Goal goal = goalRepository.findByOrganization(organization).orElseGet(() -> {
            Goal created = new Goal();
            created.setOrganization(organization);
            created.setTargetCards(DEFAULT_TARGET_CARDS);
            created.setUpdatedAt(LocalDateTime.now());
            created.setConfigured(false);
            return goalRepository.save(created);
        });

        if (goal.getTargetCards() == null || goal.getTargetCards() <= 0) {
            goal.setTargetCards(DEFAULT_TARGET_CARDS);
            goal.setUpdatedAt(LocalDateTime.now());
            goal.setConfigured(false);
            goal = goalRepository.save(goal);
        }

        return goal;
    }

    public GoalResponseDTO toDTO(Goal goal) {
        return new GoalResponseDTO(goal.getTargetCards(), goal.getUpdatedAt(), goal.isConfigured());
    }
}
