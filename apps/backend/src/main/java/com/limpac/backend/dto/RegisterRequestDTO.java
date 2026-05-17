package com.limpac.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequestDTO(
        @NotBlank(message = "O nome é obrigatório")
        String name,

        @Email(message = "Informe um email válido")
        @NotBlank(message = "O email é obrigatório")
        String email,

        @NotBlank(message = "O CNPJ é obrigatório")
        String cnpj,

        @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres")
        @NotBlank(message = "A senha é obrigatória")
        String password,

        @NotBlank(message = "O nome da organização é obrigatório")
        String organizationName
) {
}
