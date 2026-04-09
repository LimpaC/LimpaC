package com.limpac.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CalculationRequestDTO(
        @JsonAlias("volume")
        @NotNull(message = "A quantidade de cartões é obrigatória")
        @Min(value = 1, message = "A quantidade deve ser pelo menos 1")
        Double cards,

        @NotNull(message = "O token do usuário é obrigatório")
        UUID token
) {
}
