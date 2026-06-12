package com.limpac.backend.service;

import com.limpac.backend.config.TransactionMetricsProperties;
import com.limpac.backend.domain.transaction.TransactionImpactCalculator;
import com.limpac.backend.domain.transaction.TransactionImpactFactors;
import com.limpac.backend.domain.transaction.TransactionImpactMetrics;
import com.limpac.backend.domain.transaction.TransactionVolume;
import com.limpac.backend.dto.TransactionCalculationRequestDTO;
import com.limpac.backend.dto.TransactionCalculationResponseDTO;
import com.limpac.backend.dto.TransactionDashboardStateResponseDTO;
import com.limpac.backend.dto.TransactionGoalRequestDTO;
import com.limpac.backend.dto.TransactionGoalResponseDTO;
import com.limpac.backend.dto.TransactionMetricsDTO;
import com.limpac.backend.entity.Organization;
import com.limpac.backend.entity.TransactionCalculation;
import com.limpac.backend.entity.TransactionGoal;
import com.limpac.backend.mapper.TransactionCalculationMapper;
import com.limpac.backend.repository.TransactionCalculationRepository;
import com.limpac.backend.repository.TransactionGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionCalculationService {

    private final TransactionCalculationRepository repository;
    private final TransactionGoalRepository goalRepository;
    private final OrganizationService organizationService;
    private final TransactionMetricsProperties metrics;
    private final TransactionCalculationMapper mapper = new TransactionCalculationMapper();

    public TransactionCalculationService(TransactionCalculationRepository repository, TransactionGoalRepository goalRepository, OrganizationService organizationService, TransactionMetricsProperties metrics) {
        this.repository = repository;
        this.goalRepository = goalRepository;
        this.organizationService = organizationService;
        this.metrics = metrics;
    }

    @Transactional
    public TransactionCalculationResponseDTO save(TransactionCalculationRequestDTO dto, UUID ownerId) {
        Organization organization = organizationService.getOwnedOrganization(dto.organizationId(), ownerId);
        TransactionCalculation entity = new TransactionCalculation();
        TransactionImpactMetrics impact = new TransactionImpactCalculator(impactFactors())
                .calculate(new TransactionVolume(dto.totalTransactions(), dto.digitalPct()));

        mapper.applyMetrics(entity, impact);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setOrganization(organization);

        TransactionCalculation saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TransactionCalculationResponseDTO> findAll(UUID organizationId, UUID ownerId) {
        Organization organization = organizationService.getOwnedOrganization(organizationId, ownerId);

        return repository.findAllByOrganizationOrderByCreatedAtAsc(organization).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public TransactionDashboardStateResponseDTO state(UUID organizationId, UUID ownerId) {
        Organization organization = organizationService.getOwnedOrganization(organizationId, ownerId);
        TransactionCalculation latest = repository.findTopByOrganizationOrderByCreatedAtDesc(organization).orElse(null);
        TransactionGoal goal = getOrCreateGoal(organization);

        return new TransactionDashboardStateResponseDTO(
                toGoalResponse(goal),
                latest == null ? null : mapper.toResponse(latest),
                metricsDTO(),
                latest != null,
                calculateProgress(latest, goal)
        );
    }

    @Transactional
    public TransactionGoalResponseDTO updateGoal(TransactionGoalRequestDTO dto, UUID ownerId) {
        Organization organization = organizationService.getOwnedOrganization(dto.organizationId(), ownerId);
        TransactionGoal goal = getOrCreateGoal(organization);

        goal.setTargetDigitalPct(dto.targetDigitalPct());
        goal.setConfigured(true);
        goal.setUpdatedAt(LocalDateTime.now());

        return toGoalResponse(goalRepository.save(goal));
    }

    private TransactionGoal getOrCreateGoal(Organization organization) {
        return goalRepository.findByOrganization(organization).orElseGet(() -> {
            TransactionGoal goal = new TransactionGoal();
            goal.setTargetDigitalPct(100);
            goal.setConfigured(false);
            goal.setUpdatedAt(LocalDateTime.now());
            goal.setOrganization(organization);
            return goalRepository.save(goal);
        });
    }

    private double calculateProgress(TransactionCalculation latest, TransactionGoal goal) {
        if (latest == null || goal.getTargetDigitalPct() == null || goal.getTargetDigitalPct() <= 0) {
            return 0;
        }
        return Math.min(100, (latest.getDigitalPct() / goal.getTargetDigitalPct()) * 100);
    }

    private TransactionGoalResponseDTO toGoalResponse(TransactionGoal goal) {
        return new TransactionGoalResponseDTO(goal.getTargetDigitalPct(), goal.getUpdatedAt(), goal.isConfigured());
    }

    private TransactionMetricsDTO metricsDTO() {
        return new TransactionMetricsDTO(
                metrics.getCo2PerTransaction(),
                metrics.getPaperPerTransaction(),
                metrics.getWaterPerTransaction(),
                metrics.getTreesPerTransaction(),
                metrics.getPaperCostPerTransactionBrl(),
                metrics.getCashHandlingCostPerTransactionBrl(),
                metrics.getMoneySavedPerTransactionBrl()
        );
    }

    private TransactionImpactFactors impactFactors() {
        return new TransactionImpactFactors(
                metrics.getCo2PerTransaction(),
                metrics.getPaperPerTransaction(),
                metrics.getWaterPerTransaction(),
                metrics.getTreesPerTransaction(),
                metrics.getMoneySavedPerTransactionBrl()
        );
    }
}
