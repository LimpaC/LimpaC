package com.limpac.backend.service;

import com.limpac.backend.dto.AdminDashboardResponseDTO;
import com.limpac.backend.dto.AdminOrganizationDashboardDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.dto.GoalResponseDTO;
import com.limpac.backend.entity.Goal;
import com.limpac.backend.entity.Organization;
import com.limpac.backend.mapper.CalculationMapper;
import com.limpac.backend.repository.CalculationRepository;
import com.limpac.backend.repository.GoalRepository;
import com.limpac.backend.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminDashboardService {

    private final OrganizationRepository organizationRepository;
    private final CalculationRepository calculationRepository;
    private final GoalRepository goalRepository;
    private final CalculationMapper calculationMapper = new CalculationMapper();

    public AdminDashboardService(
            OrganizationRepository organizationRepository,
            CalculationRepository calculationRepository,
            GoalRepository goalRepository
    ) {
        this.organizationRepository = organizationRepository;
        this.calculationRepository = calculationRepository;
        this.goalRepository = goalRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponseDTO dashboard() {
        List<Organization> organizations = organizationRepository.findAllByOrderByCreatedAtAsc();
        List<AdminOrganizationDashboardDTO> organizationDashboards = organizations.stream()
                .map(this::toOrganizationDashboard)
                .toList();

        List<CalculationResponseDTO> latestCalculations = organizationDashboards.stream()
                .map(AdminOrganizationDashboardDTO::latestCalculation)
                .filter(calculation -> calculation != null)
                .toList();

        double totalCards = latestCalculations.stream().mapToDouble(CalculationResponseDTO::cards).sum();
        double totalCo2 = latestCalculations.stream().mapToDouble(CalculationResponseDTO::co2Impact).sum();
        double totalPlastic = latestCalculations.stream().mapToDouble(CalculationResponseDTO::plasticSaved).sum();
        int totalTrees = latestCalculations.stream().mapToInt(CalculationResponseDTO::treesPreserved).sum();
        double totalWater = latestCalculations.stream().mapToDouble(CalculationResponseDTO::waterSaved).sum();
        double totalEnergy = latestCalculations.stream().mapToDouble(CalculationResponseDTO::energySaved).sum();
        double totalMoney = latestCalculations.stream().mapToDouble(CalculationResponseDTO::moneySaved).sum();
        int totalGoalCards = organizationDashboards.stream()
                .map(AdminOrganizationDashboardDTO::goal)
                .filter(GoalResponseDTO::configured)
                .mapToInt(GoalResponseDTO::targetCards)
                .sum();
        double totalGoalProgressPct = totalGoalCards > 0 ? (totalCards / totalGoalCards) * 100 : 0;

        return new AdminDashboardResponseDTO(
                totalCards,
                totalCo2,
                totalPlastic,
                totalTrees,
                totalWater,
                totalEnergy,
                totalMoney,
                totalGoalCards,
                totalGoalProgressPct,
                organizationDashboards
        );
    }

    private AdminOrganizationDashboardDTO toOrganizationDashboard(Organization organization) {
        List<CalculationResponseDTO> history = calculationRepository.findAllByOrganizationOrderByCreatedAtAsc(organization).stream()
                .map(calculationMapper::toResponse)
                .toList();
        CalculationResponseDTO latest = calculationRepository.findTopByOrganizationOrderByCreatedAtDesc(organization)
                .map(calculationMapper::toResponse)
                .orElse(null);
        GoalResponseDTO goal = goalRepository.findByOrganization(organization)
                .map(this::toGoalResponse)
                .orElse(new GoalResponseDTO(0, null, false));
        double goalProgressPct = goal.configured() && goal.targetCards() > 0 && latest != null
                ? (latest.cards() / goal.targetCards()) * 100
                : 0;

        return new AdminOrganizationDashboardDTO(
                organization.getId(),
                organization.getName(),
                organization.getOwner().getId(),
                organization.getOwner().getName(),
                organization.getOwner().getEmail(),
                goal,
                goalProgressPct,
                latest,
                history
        );
    }

    private GoalResponseDTO toGoalResponse(Goal goal) {
        return new GoalResponseDTO(goal.getTargetCards(), goal.getUpdatedAt(), goal.isConfigured());
    }
}
