package com.limpac.backend.domain.calculation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ImpactCalculatorTest {

    @Test
    @DisplayName("calcula metricas de impacto a partir da quantidade de cartoes")
    void calculatesImpactMetricsFromCardQuantity() {
        ImpactFactors factors = new ImpactFactors(1.5, 0.25, 0.4, 2.0, 3.0, 15.0);

        ImpactMetrics metrics = new ImpactCalculator(factors).calculate(new CardQuantity(10));

        assertEquals(10.0, metrics.cards(), 0.0001);
        assertEquals(15.0, metrics.co2Impact(), 0.0001);
        assertEquals(2.5, metrics.plasticSaved(), 0.0001);
        assertEquals(4, metrics.treesPreserved());
        assertEquals(20.0, metrics.waterSaved(), 0.0001);
        assertEquals(30.0, metrics.energySaved(), 0.0001);
        assertEquals(150.0, metrics.moneySaved(), 0.0001);
    }
}
