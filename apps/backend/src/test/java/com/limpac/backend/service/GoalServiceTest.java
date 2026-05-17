package com.limpac.backend.service;

import com.limpac.backend.dto.GoalRequestDTO;
import com.limpac.backend.entity.Goal;
import com.limpac.backend.entity.Organization;
import com.limpac.backend.repository.GoalRepository;
import org.mockito.Mockito;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GoalServiceTest {

    @Test
    @DisplayName("cria meta padrao quando nao existe")
    void getOrCreateByOrganizationCreatesDefaultGoalWhenMissing() {
        Organization organization = new Organization();
        organization.setId(UUID.randomUUID());

        GoalRepository goalRepository = proxy(GoalRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findByOrganization" -> Optional.empty();
            case "save" -> args[0];
            default -> defaultValue(method.getReturnType());
        });

        GoalService service = new GoalService(goalRepository, Mockito.mock(OrganizationService.class));
        Goal goal = service.getOrCreateByOrganization(organization);

        assertEquals(GoalService.DEFAULT_TARGET_CARDS, goal.getTargetCards());
        assertFalse(goal.isConfigured());
        assertNotNull(goal.getUpdatedAt());
        assertEquals(organization, goal.getOrganization());
    }

    @Test
    @DisplayName("rejeita meta menor ou igual a zero")
    void upsertRejectsNonPositiveGoalTargets() {
        UUID organizationId = UUID.randomUUID();
        GoalService service = new GoalService(
                proxy(GoalRepository.class, (proxy, method, args) -> defaultValue(method.getReturnType())),
                Mockito.mock(OrganizationService.class)
        );

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.upsert(new GoalRequestDTO(organizationId, 0), UUID.randomUUID())
        );

        assertEquals(422, exception.getStatusCode().value());
    }

    @Test
    @DisplayName("atualiza meta da organizacao selecionada")
    void upsertStoresGoalForSelectedOrganization() {
        UUID userId = UUID.randomUUID();
        UUID organizationId = UUID.randomUUID();
        Organization organization = new Organization();
        organization.setId(organizationId);

        OrganizationService organizationService = Mockito.mock(OrganizationService.class);
        Mockito.when(organizationService.getOwnedOrganization(organizationId, userId)).thenReturn(organization);
        GoalRepository goalRepository = proxy(GoalRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findByOrganization" -> Optional.empty();
            case "save" -> args[0];
            default -> defaultValue(method.getReturnType());
        });

        GoalService service = new GoalService(goalRepository, organizationService);
        var response = service.upsert(new GoalRequestDTO(organizationId, 500), userId);

        assertEquals(500, response.targetCards());
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
