package com.limpac.backend.service;

import com.limpac.backend.config.CalculationMetricsProperties;
import com.limpac.backend.dto.CalculationDecrementRequestDTO;
import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.entity.Calculation;
import com.limpac.backend.entity.Goal;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.CalculationRepository;
import com.limpac.backend.repository.GoalRepository;
import com.limpac.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CalculationServiceTest {

    @Test
    @DisplayName("calcula os impactos esperados ao salvar")
    void saveComputesTheExpectedImpactMetrics() {
        UUID token = UUID.randomUUID();
        User manager = new User();
        manager.setToken(token);

        CalculationMetricsProperties metrics = new CalculationMetricsProperties();
        metrics.setCo2PerCard(1.5);
        metrics.setPlasticPerCard(0.25);
        metrics.setTreesPerCard(0.4);
        metrics.setWaterPerCard(2.0);
        metrics.setEnergyPerCard(3.0);
        metrics.setMaterialCostPerCardBrl(4.0);
        metrics.setManufacturingCostPerCardBrl(5.0);
        metrics.setShippingCostPerCardBrl(6.0);

        CalculationRepository calculationRepository = proxy(CalculationRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "save" -> {
                Calculation entity = (Calculation) args[0];
                entity.setId(UUID.randomUUID());
                yield entity;
            }
            default -> defaultValue(method.getReturnType());
        });
        UserRepository userRepository = proxy(UserRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findByToken" -> Optional.of(manager);
            default -> defaultValue(method.getReturnType());
        });
        GoalService goalService = new GoalService(
                proxy(GoalRepository.class, (proxy, method, args) -> switch (method.getName()) {
                    case "findByManager" -> Optional.empty();
                    case "save" -> args[0];
                    default -> defaultValue(method.getReturnType());
                }),
                userRepository
        );

        CalculationService service = new CalculationService(calculationRepository, userRepository, goalService, metrics);
        CalculationResponseDTO calculation = service.save(new CalculationRequestDTO(10.0, token));

        assertEquals(15.0, calculation.co2Impact(), 0.0001);
        assertEquals(2.5, calculation.plasticSaved(), 0.0001);
        assertEquals(4, calculation.treesPreserved());
        assertEquals(20.0, calculation.waterSaved(), 0.0001);
        assertEquals(30.0, calculation.energySaved(), 0.0001);
        assertEquals(150.0, calculation.moneySaved(), 0.0001);
    }

    @Test
    @DisplayName("rejeita remocao que deixaria menos de um cartao")
    void decrementRejectsRequestsThatWouldDropBelowOneCard() {
        UUID token = UUID.randomUUID();
        User manager = new User();
        manager.setToken(token);

        Calculation latest = new Calculation();
        latest.setCards(1.0);
        latest.setCreatedAt(LocalDateTime.now());
        latest.setManager(manager);

        CalculationRepository calculationRepository = proxy(CalculationRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findTopByManagerOrderByCreatedAtDesc" -> Optional.of(latest);
            default -> defaultValue(method.getReturnType());
        });
        UserRepository userRepository = proxy(UserRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findByTokenForUpdate" -> Optional.of(manager);
            default -> defaultValue(method.getReturnType());
        });
        GoalService goalService = new GoalService(
                proxy(GoalRepository.class, (proxy, method, args) -> switch (method.getName()) {
                    case "findByManager" -> Optional.empty();
                    case "save" -> args[0];
                    default -> defaultValue(method.getReturnType());
                }),
                userRepository
        );

        CalculationService service = new CalculationService(calculationRepository, userRepository, goalService, new CalculationMetricsProperties());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.decrement(new CalculationDecrementRequestDTO(token, 1))
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
