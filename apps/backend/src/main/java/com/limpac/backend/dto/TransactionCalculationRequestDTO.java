package com.limpac.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TransactionCalculationRequestDTO(
        @NotNull(message = "A quantidade de transações é obrigatória")
        @Min(value = 1, message = "A quantidade deve ser pelo menos 1")
        Double totalTransactions,

        @NotNull(message = "O percentual digital é obrigatório")
        @Min(value = 0, message = "O percentual digital não pode ser negativo")
        @Max(value = 100, message = "O percentual digital não pode passar de 100")
        Double digitalPct,

        @NotNull(message = "A organização é obrigatória")
        UUID organizationId
) {
}
