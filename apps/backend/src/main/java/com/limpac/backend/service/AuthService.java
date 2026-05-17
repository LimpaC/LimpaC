package com.limpac.backend.service;

import com.limpac.backend.dto.AuthSessionResponseDTO;
import com.limpac.backend.dto.OrganizationSummaryDTO;
import com.limpac.backend.dto.RegisterRequestDTO;
import com.limpac.backend.dto.UserSummaryDTO;
import com.limpac.backend.entity.Organization;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.OrganizationRepository;
import com.limpac.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, OrganizationRepository organizationRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthSessionResponseDTO register(RegisterRequestDTO request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma conta com este email.");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setCnpj(sanitizeCnpj(request.cnpj()));
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        User savedUser = userRepository.save(user);

        Organization organization = new Organization();
        organization.setName(request.organizationName().trim());
        organization.setOwner(savedUser);
        Organization savedOrganization = organizationRepository.save(organization);

        return session(savedUser, List.of(savedOrganization));
    }

    @Transactional(readOnly = true)
    public AuthSessionResponseDTO login(String email, String password) {
        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas."));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas.");
        }

        return session(user, organizationRepository.findAllByOwnerIdOrderByCreatedAtAsc(user.getId()));
    }

    @Transactional(readOnly = true)
    public AuthSessionResponseDTO currentSession(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida."));
        return session(user, organizationRepository.findAllByOwnerIdOrderByCreatedAtAsc(user.getId()));
    }

    private AuthSessionResponseDTO session(User user, List<Organization> organizations) {
        return new AuthSessionResponseDTO(
                new UserSummaryDTO(user.getId(), user.getName(), user.getEmail(), user.getCnpj()),
                organizations.stream().map(this::toSummary).toList()
        );
    }

    private OrganizationSummaryDTO toSummary(Organization organization) {
        return new OrganizationSummaryDTO(organization.getId(), organization.getName());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private static String sanitizeCnpj(String cnpj) {
        return cnpj.replaceAll("\\D", "");
    }
}
