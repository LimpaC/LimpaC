package com.limpac.backend.dto;

import java.util.UUID;

public record OrganizationSummaryDTO(
        UUID id,
        String name
) {
}
