package com.limpac.backend.domain.goal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GoalProgressCalculatorTest {

    private final GoalProgressCalculator calculator = new GoalProgressCalculator();

    @Test
    @DisplayName("retorna zero quando ainda nao existe calculo")
    void returnsZeroWhenThereIsNoCalculationYet() {
        assertEquals(0.0, calculator.calculate(null, 350), 0.0001);
    }

    @Test
    @DisplayName("calcula percentual limitado entre zero e cem")
    void clampsProgressPercentageBetweenZeroAndOneHundred() {
        assertEquals(50.0, calculator.calculate(175.0, 350), 0.0001);
        assertEquals(100.0, calculator.calculate(700.0, 350), 0.0001);
        assertEquals(0.0, calculator.calculate(-10.0, 350), 0.0001);
    }
}
