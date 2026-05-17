package com.limpac.backend.service;

import com.limpac.backend.dto.CreateOrganizationRequestDTO;
import com.limpac.backend.dto.OrganizationSummaryDTO;
import com.limpac.backend.entity.Organization;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.OrganizationRepository;
import com.limpac.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    public OrganizationService(OrganizationRepository organizationRepository, UserRepository userRepository) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<OrganizationSummaryDTO> findAll(UUID ownerId) {
        return organizationRepository.findAllByOwnerIdOrderByCreatedAtAsc(ownerId).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public OrganizationSummaryDTO create(UUID ownerId, CreateOrganizationRequestDTO request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida."));

        Organization organization = new Organization();
        organization.setOwner(owner);
        organization.setName(request.name().trim());

        return toSummary(organizationRepository.save(organization));
    }

    public Organization getOwnedOrganization(UUID organizationId, UUID ownerId) {
        if (organizationId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A organização é obrigatória.");
        }

        return organizationRepository.findByIdAndOwnerId(organizationId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Organização não autorizada."));
    }

    private OrganizationSummaryDTO toSummary(Organization organization) {
        return new OrganizationSummaryDTO(organization.getId(), organization.getName());
    }
}
