package com.limpac.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GoalRequestDTO(
        @NotNull(message = "O token do usuário é obrigatório")
        UUID token,

        @NotNull(message = "A meta é obrigatória")
        @Min(value = 1, message = "A meta mínima é 1")
        @Max(value = 5000000, message = "A meta máxima é 5000000")
        Integer targetCards
) {
}
