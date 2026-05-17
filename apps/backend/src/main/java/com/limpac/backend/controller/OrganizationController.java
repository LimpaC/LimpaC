package com.limpac.backend.controller;

import com.limpac.backend.dto.CreateOrganizationRequestDTO;
import com.limpac.backend.dto.OrganizationSummaryDTO;
import com.limpac.backend.dto.OverallDashboardResponseDTO;
import com.limpac.backend.security.AuthenticatedUser;
import com.limpac.backend.service.CalculationService;
import com.limpac.backend.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final CalculationService calculationService;

    public OrganizationController(OrganizationService organizationService, CalculationService calculationService) {
        this.organizationService = organizationService;
        this.calculationService = calculationService;
    }

    @GetMapping
    public ResponseEntity<List<OrganizationSummaryDTO>> findAll(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(organizationService.findAll(user.id()));
    }

    @PostMapping
    public ResponseEntity<OrganizationSummaryDTO> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody @Valid CreateOrganizationRequestDTO request
    ) {
        return new ResponseEntity<>(organizationService.create(user.id(), request), HttpStatus.CREATED);
    }

    @GetMapping("/overall")
    public ResponseEntity<OverallDashboardResponseDTO> overall(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(calculationService.overall(user.id()));
    }
}
