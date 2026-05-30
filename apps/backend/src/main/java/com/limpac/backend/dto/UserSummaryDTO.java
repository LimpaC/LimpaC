package com.limpac.backend.dto;

import java.util.UUID;

public record UserSummaryDTO(
        UUID id,
        String name,
        String email,
        String cnpj,
        String role
) {
}
