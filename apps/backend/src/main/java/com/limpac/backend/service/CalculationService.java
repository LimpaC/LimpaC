package com.limpac.backend.service;

import com.limpac.backend.config.CalculationMetricsProperties;
import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.dto.CalculationIncrementRequestDTO;
import com.limpac.backend.dto.CalculationDecrementRequestDTO;
import com.limpac.backend.dto.CalculationMetricsDTO;
import com.limpac.backend.dto.DashboardStateResponseDTO;
import com.limpac.backend.entity.Calculation;
import com.limpac.backend.entity.Goal;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.CalculationRepository;
import com.limpac.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CalculationService {

    private final CalculationRepository repository;
    private final UserRepository userRepository;
    private final GoalService goalService;
    private final CalculationMetricsProperties metrics;

    public CalculationService(CalculationRepository repository, UserRepository userRepository, GoalService goalService, CalculationMetricsProperties metrics) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.goalService = goalService;
        this.metrics = metrics;
    }

    @Transactional
    public CalculationResponseDTO save(CalculationRequestDTO dto) {
        User manager = validateUserToken(dto.token());
        Calculation entity = new Calculation();
        double cards = dto.cards();

        entity.setCards(cards);
        entity.setCo2Impact(cards * metrics.getCo2PerCard());
        entity.setPlasticSaved(cards * metrics.getPlasticPerCard());
        entity.setTreesPreserved((int) Math.round(cards * metrics.getTreesPerCard()));
        entity.setWaterSaved(cards * metrics.getWaterPerCard());
        entity.setEnergySaved(cards * metrics.getEnergyPerCard());
        entity.setMoneySaved(cards * metrics.getMoneySavedPerCardBrl());
        entity.setCreatedAt(LocalDateTime.now());
        entity.setManager(manager);

        Calculation saved = repository.save(entity);
        return convertToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<CalculationResponseDTO> findAll(UUID token) {
        User manager = validateUserToken(token);

        return repository.findAllByManager(manager).stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public DashboardStateResponseDTO state(UUID token) {
        Goal goal = goalService.getOrCreateByToken(token);
        Calculation latest = repository.findTopByManagerOrderByCreatedAtDesc(goal.getManager()).orElse(null);
        double progress = calculateProgress(latest, goal);

        return new DashboardStateResponseDTO(
                goalService.toDTO(goal),
                latest == null ? null : convertToDTO(latest),
                metricsDTO(),
                latest != null,
                progress
        );
    }

    @Transactional
    public CalculationResponseDTO increment(CalculationIncrementRequestDTO dto) {
        User manager = lockUserByToken(dto.token());
        Calculation latest = repository.findTopByManagerOrderByCreatedAtDesc(manager)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Nenhum histórico de cálculo foi encontrado para incrementar."));

        CalculationRequestDTO request = new CalculationRequestDTO(latest.getCards() + dto.addCards(), dto.token());
        return save(request);
    }

    @Transactional
    public CalculationResponseDTO decrement(CalculationDecrementRequestDTO dto) {
        User manager = lockUserByToken(dto.token());
        Calculation latest = repository.findTopByManagerOrderByCreatedAtDesc(manager)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Nenhum histórico de cálculo foi encontrado para remover."));

        double nextCards = latest.getCards() - dto.removeCards();
        if (nextCards < 1) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "A quantidade final de cartões não pode ser menor que 1.");
        }

        CalculationRequestDTO request = new CalculationRequestDTO(nextCards, dto.token());
        return save(request);
    }

    private double calculateProgress(Calculation latest, Goal goal) {
        if (latest == null) {
            return 0;
        }

        double target = goal.getTargetCards();
        double progress = (latest.getCards() / target) * 100;
        return Math.max(0, Math.min(100, progress));
    }

    private User validateUserToken(UUID token) {
        if (token == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O token do usuário é obrigatório.");
        }

        return userRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de usuário inválido."));
    }

    private User lockUserByToken(UUID token) {
        if (token == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O token do usuário é obrigatório.");
        }

        return userRepository.findByTokenForUpdate(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de usuário inválido."));
    }

    public CalculationResponseDTO convertToDTO(Calculation entity) {
        return new CalculationResponseDTO(
                entity.getId(),
                entity.getCards(),
                entity.getCo2Impact(),
                entity.getPlasticSaved(),
                entity.getTreesPreserved(),
                entity.getWaterSaved(),
                entity.getEnergySaved(),
                entity.getMoneySaved(),
                entity.getCreatedAt()
        );
    }

    private CalculationMetricsDTO metricsDTO() {
        return new CalculationMetricsDTO(
                metrics.getCo2PerCard(),
                metrics.getPlasticPerCard(),
                metrics.getTreesPerCard(),
                metrics.getWaterPerCard(),
                metrics.getEnergyPerCard(),
                metrics.getMoneySavedPerCardBrl(),
                metrics.getMaterialCostPerCardBrl(),
                metrics.getManufacturingCostPerCardBrl(),
                metrics.getShippingCostPerCardBrl()
        );
    }
}
