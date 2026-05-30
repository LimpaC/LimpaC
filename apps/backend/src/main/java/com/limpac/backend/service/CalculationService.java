package com.limpac.backend.service;

import com.limpac.backend.config.CalculationMetricsProperties;
import com.limpac.backend.domain.calculation.CardQuantity;
import com.limpac.backend.domain.calculation.ImpactCalculator;
import com.limpac.backend.domain.calculation.ImpactFactors;
import com.limpac.backend.domain.calculation.ImpactMetrics;
import com.limpac.backend.domain.goal.GoalProgressCalculator;
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
import com.limpac.backend.mapper.CalculationMapper;
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
    private final CalculationMapper calculationMapper = new CalculationMapper();
    private final GoalProgressCalculator progressCalculator = new GoalProgressCalculator();

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
        ImpactMetrics impact = new ImpactCalculator(impactFactors()).calculate(new CardQuantity(dto.cards()));

        calculationMapper.applyMetrics(entity, impact);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setOrganization(organization);

        Calculation saved = repository.save(entity);
        return calculationMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CalculationResponseDTO> findAll(UUID organizationId, UUID ownerId) {
        Organization organization = organizationService.getOwnedOrganization(organizationId, ownerId);

        return repository.findAllByOrganizationOrderByCreatedAtAsc(organization).stream()
                .map(calculationMapper::toResponse)
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
                latest == null ? null : calculationMapper.toResponse(latest),
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
        List<OrganizationSnapshot> snapshots = organizations.stream()
                .map(this::snapshot)
                .toList();
        List<Calculation> latestCalculations = snapshots.stream()
                .map(OrganizationSnapshot::latest)
                .filter(calculation -> calculation != null)
                .toList();
        List<OrganizationOverviewDTO> organizationSummaries = snapshots.stream()
                .map(this::overview)
                .toList();

        double totalCards = latestCalculations.stream().mapToDouble(Calculation::getCards).sum();
        double totalCo2 = latestCalculations.stream().mapToDouble(Calculation::getCo2Impact).sum();
        double totalWater = latestCalculations.stream().mapToDouble(Calculation::getWaterSaved).sum();
        double totalEnergy = latestCalculations.stream().mapToDouble(Calculation::getEnergySaved).sum();
        double totalMoney = latestCalculations.stream().mapToDouble(Calculation::getMoneySaved).sum();

        return new OverallDashboardResponseDTO(totalCards, totalCo2, totalWater, totalEnergy, totalMoney, organizationSummaries);
    }

    private OrganizationSnapshot snapshot(Organization organization) {
        Goal goal = goalService.getOrCreateByOrganization(organization);
        Calculation latest = repository.findTopByOrganizationOrderByCreatedAtDesc(organization).orElse(null);
        return new OrganizationSnapshot(organization, goal, latest);
    }

    private OrganizationOverviewDTO overview(OrganizationSnapshot snapshot) {
        Organization organization = snapshot.organization();
        Calculation latest = snapshot.latest();
        return new OrganizationOverviewDTO(
                organization.getId(),
                organization.getName(),
                latest == null ? null : calculationMapper.toResponse(latest),
                calculateProgress(latest, snapshot.goal())
        );
    }

    private double calculateProgress(Calculation latest, Goal goal) {
        return progressCalculator.calculate(latest == null ? null : latest.getCards(), goal.getTargetCards());
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

    private ImpactFactors impactFactors() {
        return new ImpactFactors(
                metrics.getCo2PerCard(),
                metrics.getPlasticPerCard(),
                metrics.getTreesPerCard(),
                metrics.getWaterPerCard(),
                metrics.getEnergyPerCard(),
                metrics.getMoneySavedPerCardBrl()
        );
    }

    private record OrganizationSnapshot(Organization organization, Goal goal, Calculation latest) {
    }
}
