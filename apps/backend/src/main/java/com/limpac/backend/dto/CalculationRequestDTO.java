package com.limpac.backend.dto;

<<<<<<< HEAD
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
=======
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CalculationRequestDTO(
        @NotNull(message = "O volume de cartões é obrigatório")
        @Min(value = 1, message = "O volume deve ser pelo menos 1")
        Double volume
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8

        //ADD o userID dps
) {
}
