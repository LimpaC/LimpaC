package com.limpac.backend.dto;

import java.util.List;

public record AuthSessionResponseDTO(
        UserSummaryDTO user,
        List<OrganizationSummaryDTO> organizations
) {
}
