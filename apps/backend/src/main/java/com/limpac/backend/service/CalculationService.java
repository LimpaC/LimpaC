package com.limpac.backend.service;

import com.limpac.backend.config.CalculationMetricsProperties;
import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.dto.CalculationIncrementRequestDTO;
import com.limpac.backend.dto.CalculationDecrementRequestDTO;
import com.limpac.backend.dto.CalculationMetricsDTO;
import com.limpac.backend.dto.DashboardStateResponseDTO;
import com.limpac.backend.dto.OrganizationOverviewDTO;
import com.limpac.backend.dto.OverallDashboardResponseDTO;
import com.limpac.backend.entity.Calculation;
import com.limpac.backend.entity.Goal;
import com.limpac.backend.entity.Organization;
import com.limpac.backend.repository.CalculationRepository;
import com.limpac.backend.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CalculationService {

    private final CalculationRepository repository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationService organizationService;
    private final GoalService goalService;
    private final CalculationMetricsProperties metrics;

    public CalculationService(CalculationRepository repository, OrganizationRepository organizationRepository, OrganizationService organizationService, GoalService goalService, CalculationMetricsProperties metrics) {
        this.repository = repository;
        this.organizationRepository = organizationRepository;
        this.organizationService = organizationService;
        this.goalService = goalService;
        this.metrics = metrics;
    }

    @Transactional
    public CalculationResponseDTO save(CalculationRequestDTO dto, UUID ownerId) {
        Organization organization = organizationService.getOwnedOrganization(dto.organizationId(), ownerId);
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
        entity.setOrganization(organization);

        Calculation saved = repository.save(entity);
        return convertToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<CalculationResponseDTO> findAll(UUID organizationId, UUID ownerId) {
        Organization organization = organizationService.getOwnedOrganization(organizationId, ownerId);

        return repository.findAllByOrganizationOrderByCreatedAtAsc(organization).stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public DashboardStateResponseDTO state(UUID organizationId, UUID ownerId) {
        Organization organization = organizationService.getOwnedOrganization(organizationId, ownerId);
        Goal goal = goalService.getOrCreateByOrganization(organization);
        Calculation latest = repository.findTopByOrganizationOrderByCreatedAtDesc(organization).orElse(null);
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
    public CalculationResponseDTO increment(CalculationIncrementRequestDTO dto, UUID ownerId) {
        Organization organization = organizationService.getOwnedOrganization(dto.organizationId(), ownerId);
        Calculation latest = repository.findTopByOrganizationOrderByCreatedAtDesc(organization)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Nenhum histórico de cálculo foi encontrado para incrementar."));

        CalculationRequestDTO request = new CalculationRequestDTO(latest.getCards() + dto.addCards(), dto.organizationId());
        return save(request, ownerId);
    }

    @Transactional
    public CalculationResponseDTO decrement(CalculationDecrementRequestDTO dto, UUID ownerId) {
        Organization organization = organizationService.getOwnedOrganization(dto.organizationId(), ownerId);
        Calculation latest = repository.findTopByOrganizationOrderByCreatedAtDesc(organization)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Nenhum histórico de cálculo foi encontrado para remover."));

        double nextCards = latest.getCards() - dto.removeCards();
        if (nextCards < 1) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "A quantidade final de cartões não pode ser menor que 1.");
        }

        CalculationRequestDTO request = new CalculationRequestDTO(nextCards, dto.organizationId());
        return save(request, ownerId);
    }

    @Transactional
    public OverallDashboardResponseDTO overall(UUID ownerId) {
        List<Organization> organizations = organizationRepository.findAllByOwnerIdOrderByCreatedAtAsc(ownerId);
        List<Calculation> latestCalculations = organizations.stream()
                .map(organization -> repository.findTopByOrganizationOrderByCreatedAtDesc(organization).orElse(null))
                .filter(calculation -> calculation != null)
                .toList();
        List<OrganizationOverviewDTO> organizationSummaries = organizations.stream()
                .map(organization -> {
                    Goal goal = goalService.getOrCreateByOrganization(organization);
                    Calculation latest = repository.findTopByOrganizationOrderByCreatedAtDesc(organization).orElse(null);
                    return new OrganizationOverviewDTO(
                            organization.getId(),
                            organization.getName(),
                            latest == null ? null : convertToDTO(latest),
                            calculateProgress(latest, goal)
                    );
                })
                .toList();

        double totalCards = latestCalculations.stream().mapToDouble(Calculation::getCards).sum();
        double totalCo2 = latestCalculations.stream().mapToDouble(Calculation::getCo2Impact).sum();
        double totalWater = latestCalculations.stream().mapToDouble(Calculation::getWaterSaved).sum();
        double totalEnergy = latestCalculations.stream().mapToDouble(Calculation::getEnergySaved).sum();
        double totalMoney = latestCalculations.stream().mapToDouble(Calculation::getMoneySaved).sum();

        return new OverallDashboardResponseDTO(totalCards, totalCo2, totalWater, totalEnergy, totalMoney, organizationSummaries);
    }

    private double calculateProgress(Calculation latest, Goal goal) {
        if (latest == null) {
            return 0;
        }

        double target = goal.getTargetCards();
        double progress = (latest.getCards() / target) * 100;
        return Math.max(0, Math.min(100, progress));
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
