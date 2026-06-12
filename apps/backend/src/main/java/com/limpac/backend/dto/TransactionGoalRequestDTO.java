package com.limpac.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TransactionGoalRequestDTO(
        @NotNull(message = "A organização é obrigatória")
        UUID organizationId,

        @NotNull(message = "A meta de transações digitais é obrigatória")
        @Min(value = 1, message = "A meta deve ser de pelo menos 1%")
        @Max(value = 100, message = "A meta não pode passar de 100%")
        Integer targetDigitalPct
) {
}
