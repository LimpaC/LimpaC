package com.limpac.backend.domain.goal;

public final class GoalProgressCalculator {

    public double calculate(Double latestCards, Integer targetCards) {
        if (latestCards == null || targetCards == null || targetCards <= 0) {
            return 0;
        }

        double progress = (latestCards / targetCards) * 100;
        return Math.max(0, Math.min(100, progress));
    }
}
