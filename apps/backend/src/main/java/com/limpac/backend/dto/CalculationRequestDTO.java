package com.limpac.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CalculationRequestDTO(
        @NotNull(message = "O volume de cartões é obrigatório")
        @Min(value = 1, message = "O volume deve ser pelo menos 1")
        Double volume

        //ADD o userID dps
) {
}
