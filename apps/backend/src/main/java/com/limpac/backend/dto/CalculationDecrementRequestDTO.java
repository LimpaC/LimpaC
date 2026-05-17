package com.limpac.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CalculationDecrementRequestDTO(
        @NotNull(message = "A organização é obrigatória")
        UUID organizationId,

        @NotNull(message = "A quantidade a remover é obrigatória")
        @Min(value = 1, message = "A quantidade deve ser pelo menos 1")
        Integer removeCards
) {
}
