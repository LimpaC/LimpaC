package com.limpac.backend.service;

import com.limpac.backend.dto.AdminOrganizationDashboardDTO;
import com.limpac.backend.entity.Calculation;
import com.limpac.backend.entity.Organization;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.CalculationRepository;
import com.limpac.backend.repository.OrganizationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AdminDashboardServiceTest {

    @Test
    @DisplayName("Dado organizacoes de varios donos, quando admin consulta dashboard, entao ve totais e historico de todas")
    void adminDashboardAggregatesAllOrganizations() {
        User ownerA = owner("Maria", "maria@example.com");
        User ownerB = owner("Joao", "joao@example.com");
        Organization recife = organization("Recife", ownerA);
        Organization sp = organization("Sao Paulo", ownerB);
        Calculation recifeFirst = calculation(recife, 10, "2026-04-27T10:00:00");
        Calculation recifeLatest = calculation(recife, 25, "2026-04-28T10:00:00");
        Calculation spLatest = calculation(sp, 40, "2026-04-29T10:00:00");

        OrganizationRepository organizationRepository = proxy(OrganizationRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findAllByOrderByCreatedAtAsc" -> List.of(recife, sp);
            default -> defaultValue(method.getReturnType());
        });
        CalculationRepository calculationRepository = proxy(CalculationRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findTopByOrganizationOrderByCreatedAtDesc" -> {
                Organization organization = (Organization) args[0];
                yield Optional.of(organization.equals(recife) ? recifeLatest : spLatest);
            }
            case "findAllByOrganizationOrderByCreatedAtAsc" -> {
                Organization organization = (Organization) args[0];
                yield organization.equals(recife) ? List.of(recifeFirst, recifeLatest) : List.of(spLatest);
            }
            default -> defaultValue(method.getReturnType());
        });

        AdminDashboardService service = new AdminDashboardService(organizationRepository, calculationRepository);
        var dashboard = service.dashboard();

        assertEquals(65.0, dashboard.totalCards(), 0.0001);
        assertEquals(2, dashboard.organizations().size());
        assertEquals("Recife", dashboard.organizations().get(0).name());
        assertEquals("Maria", dashboard.organizations().get(0).ownerName());
        assertEquals(2, dashboard.organizations().get(0).history().size());
        assertEquals(25.0, dashboard.organizations().get(0).latestCalculation().cards(), 0.0001);
        assertEquals(40.0, dashboard.organizations().get(1).latestCalculation().cards(), 0.0001);
    }

    @Test
    @DisplayName("Dado organizacao sem calculos, quando admin consulta dashboard, entao organizacao aparece sem impactar totais")
    void adminDashboardKeepsOrganizationsWithoutCalculations() {
        User owner = owner("Maria", "maria@example.com");
        Organization organization = organization("Sem historico", owner);

        OrganizationRepository organizationRepository = proxy(OrganizationRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findAllByOrderByCreatedAtAsc" -> List.of(organization);
            default -> defaultValue(method.getReturnType());
        });
        CalculationRepository calculationRepository = proxy(CalculationRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findTopByOrganizationOrderByCreatedAtDesc" -> Optional.empty();
            case "findAllByOrganizationOrderByCreatedAtAsc" -> List.of();
            default -> defaultValue(method.getReturnType());
        });

        AdminDashboardService service = new AdminDashboardService(organizationRepository, calculationRepository);
        AdminOrganizationDashboardDTO organizationDashboard = service.dashboard().organizations().get(0);

        assertEquals(0.0, service.dashboard().totalCards(), 0.0001);
        assertEquals("Sem historico", organizationDashboard.name());
        assertEquals(null, organizationDashboard.latestCalculation());
        assertEquals(0, organizationDashboard.history().size());
    }

    private static User owner(String name, String email) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName(name);
        user.setEmail(email);
        user.setCnpj("12345678000190");
        user.setPasswordHash("hash");
        return user;
    }

    private static Organization organization(String name, User owner) {
        Organization organization = new Organization();
        organization.setId(UUID.randomUUID());
        organization.setName(name);
        organization.setOwner(owner);
        return organization;
    }

    private static Calculation calculation(Organization organization, double cards, String createdAt) {
        Calculation calculation = new Calculation();
        calculation.setId(UUID.randomUUID());
        calculation.setOrganization(organization);
        calculation.setCards(cards);
        calculation.setCo2Impact(cards * 1.5);
        calculation.setPlasticSaved(cards * 0.25);
        calculation.setTreesPreserved((int) Math.round(cards * 0.4));
        calculation.setWaterSaved(cards * 2.0);
        calculation.setEnergySaved(cards * 3.0);
        calculation.setMoneySaved(cards * 15.0);
        calculation.setCreatedAt(LocalDateTime.parse(createdAt));
        return calculation;
    }

    private static <T> T proxy(Class<T> type, InvocationHandler handler) {
        Object proxy = Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, handler);
        return type.cast(proxy);
    }

    private static Object defaultValue(Class<?> returnType) {
        if (returnType.equals(boolean.class)) {
            return false;
        }
        if (returnType.equals(byte.class)
                || returnType.equals(short.class)
                || returnType.equals(int.class)
                || returnType.equals(long.class)
                || returnType.equals(float.class)
                || returnType.equals(double.class)
                || returnType.equals(char.class)) {
            return 0;
        }
        return null;
    }
}
