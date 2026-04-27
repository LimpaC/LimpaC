package com.limpac.backend.service;

import com.limpac.backend.dto.GoalRequestDTO;
import com.limpac.backend.dto.GoalResponseDTO;
import com.limpac.backend.entity.Goal;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.GoalRepository;
import com.limpac.backend.repository.UserRepository;
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
    private final UserRepository userRepository;

    public GoalService(GoalRepository goalRepository, UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public GoalResponseDTO upsert(GoalRequestDTO dto) {
        if (dto.targetCards() <= 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "A meta deve ser maior que zero.");
        }

        User manager = validateUserToken(dto.token());
        Goal goal = goalRepository.findByManager(manager).orElseGet(() -> {
            Goal created = new Goal();
            created.setManager(manager);
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
    public Goal getOrCreateByToken(UUID token) {
        User manager = validateUserToken(token);
        Goal goal = goalRepository.findByManager(manager).orElseGet(() -> {
            Goal created = new Goal();
            created.setManager(manager);
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

    private User validateUserToken(UUID token) {
        if (token == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O token do usuário é obrigatório.");
        }

        return userRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de usuário inválido."));
    }
}
