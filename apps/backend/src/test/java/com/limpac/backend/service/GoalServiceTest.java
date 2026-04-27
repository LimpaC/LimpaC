package com.limpac.backend.service;

import com.limpac.backend.dto.GoalRequestDTO;
import com.limpac.backend.entity.Goal;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.GoalRepository;
import com.limpac.backend.repository.UserRepository;
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
    void getOrCreateByTokenCreatesDefaultGoalWhenMissing() {
        UUID token = UUID.randomUUID();
        User manager = new User();
        manager.setToken(token);

        UserRepository userRepository = proxy(UserRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findByToken" -> Optional.of(manager);
            default -> defaultValue(method.getReturnType());
        });
        GoalRepository goalRepository = proxy(GoalRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findByManager" -> Optional.empty();
            case "save" -> args[0];
            default -> defaultValue(method.getReturnType());
        });

        GoalService service = new GoalService(goalRepository, userRepository);
        Goal goal = service.getOrCreateByToken(token);

        assertEquals(GoalService.DEFAULT_TARGET_CARDS, goal.getTargetCards());
        assertFalse(goal.isConfigured());
        assertNotNull(goal.getUpdatedAt());
    }

    @Test
    @DisplayName("rejeita meta menor ou igual a zero")
    void upsertRejectsNonPositiveGoalTargets() {
        UUID token = UUID.randomUUID();
        GoalService service = new GoalService(
                proxy(GoalRepository.class, (proxy, method, args) -> defaultValue(method.getReturnType())),
                proxy(UserRepository.class, (proxy, method, args) -> defaultValue(method.getReturnType()))
        );

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.upsert(new GoalRequestDTO(token, 0))
        );

        assertEquals(422, exception.getStatusCode().value());
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
