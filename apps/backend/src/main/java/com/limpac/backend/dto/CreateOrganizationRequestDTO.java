package com.limpac.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateOrganizationRequestDTO(
        @NotBlank(message = "O nome da organização é obrigatório")
        String name
) {
}
