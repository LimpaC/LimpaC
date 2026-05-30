package com.limpac.backend.service;

import com.limpac.backend.dto.RegisterRequestDTO;
import com.limpac.backend.entity.Organization;
import com.limpac.backend.entity.User;
import com.limpac.backend.entity.UserRole;
import com.limpac.backend.repository.OrganizationRepository;
import com.limpac.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthServiceTest {

    @Test
    @DisplayName("registro cria usuario, primeira organizacao e normaliza credenciais")
    void registerCreatesUserAndFirstOrganization() {
        List<User> savedUsers = new ArrayList<>();
        List<Organization> savedOrganizations = new ArrayList<>();

        UserRepository userRepository = proxy(UserRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "existsByEmail" -> false;
            case "save" -> {
                User user = (User) args[0];
                user.setId(UUID.randomUUID());
                savedUsers.add(user);
                yield user;
            }
            default -> defaultValue(method.getReturnType());
        });
        OrganizationRepository organizationRepository = proxy(OrganizationRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "save" -> {
                Organization organization = (Organization) args[0];
                organization.setId(UUID.randomUUID());
                savedOrganizations.add(organization);
                yield organization;
            }
            case "findAllByOwnerIdOrderByCreatedAtAsc" -> savedOrganizations;
            default -> defaultValue(method.getReturnType());
        });
        PasswordEncoder passwordEncoder = proxy(PasswordEncoder.class, (proxy, method, args) -> switch (method.getName()) {
            case "encode" -> "encoded-" + args[0];
            default -> defaultValue(method.getReturnType());
        });

        AuthService service = new AuthService(userRepository, organizationRepository, passwordEncoder);
        var session = service.register(new RegisterRequestDTO(
                "Maria Silva",
                " MARIA@EXAMPLE.COM ",
                "12.345.678/0001-90",
                "12345678",
                "LimpaC Recife"
        ));

        assertEquals("maria@example.com", savedUsers.get(0).getEmail());
        assertEquals("12345678000190", savedUsers.get(0).getCnpj());
        assertEquals("encoded-12345678", savedUsers.get(0).getPasswordHash());
        assertEquals(UserRole.USER, savedUsers.get(0).getRole());
        assertEquals(savedUsers.get(0), savedOrganizations.get(0).getOwner());
        assertEquals("USER", session.user().role());
        assertEquals("LimpaC Recife", session.organizations().get(0).name());
    }

    @Test
    @DisplayName("Dado uma conta admin, quando faz login, entao a sessao retorna perfil admin sem organizacoes de usuario")
    void loginReturnsAdminRoleWithoutUserOrganizations() {
        User admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setName("Edenred Admin");
        admin.setEmail("admin@edenred.com");
        admin.setCnpj("00000000000000");
        admin.setPasswordHash("encoded");
        admin.setRole(UserRole.ADMIN);

        UserRepository userRepository = proxy(UserRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findByEmail" -> Optional.of(admin);
            default -> defaultValue(method.getReturnType());
        });
        OrganizationRepository organizationRepository = proxy(OrganizationRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findAllByOwnerIdOrderByCreatedAtAsc" -> {
                throw new AssertionError("admin login must not load owner-scoped organizations");
            }
            default -> defaultValue(method.getReturnType());
        });
        PasswordEncoder passwordEncoder = proxy(PasswordEncoder.class, (proxy, method, args) -> switch (method.getName()) {
            case "matches" -> true;
            default -> defaultValue(method.getReturnType());
        });

        AuthService service = new AuthService(userRepository, organizationRepository, passwordEncoder);
        var session = service.login("ADMIN@EDENRED.COM", "senha123");

        assertEquals("admin@edenred.com", session.user().email());
        assertEquals("ADMIN", session.user().role());
        assertTrue(session.organizations().isEmpty());
    }

    @Test
    @DisplayName("registro rejeita email duplicado")
    void registerRejectsDuplicateEmail() {
        UserRepository userRepository = proxy(UserRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "existsByEmail" -> true;
            default -> defaultValue(method.getReturnType());
        });

        AuthService service = new AuthService(
                userRepository,
                proxy(OrganizationRepository.class, (proxy, method, args) -> defaultValue(method.getReturnType())),
                proxy(PasswordEncoder.class, (proxy, method, args) -> defaultValue(method.getReturnType()))
        );

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.register(new RegisterRequestDTO("Maria", "maria@example.com", "1", "12345678", "Org"))
        );

        assertEquals(409, exception.getStatusCode().value());
    }

    @Test
    @DisplayName("login rejeita senha invalida")
    void loginRejectsInvalidPassword() {
        User user = new User();
        user.setEmail("maria@example.com");
        user.setPasswordHash("encoded");

        UserRepository userRepository = proxy(UserRepository.class, (proxy, method, args) -> switch (method.getName()) {
            case "findByEmail" -> Optional.of(user);
            default -> defaultValue(method.getReturnType());
        });
        PasswordEncoder passwordEncoder = proxy(PasswordEncoder.class, (proxy, method, args) -> switch (method.getName()) {
            case "matches" -> false;
            default -> defaultValue(method.getReturnType());
        });

        AuthService service = new AuthService(
                userRepository,
                proxy(OrganizationRepository.class, (proxy, method, args) -> List.of()),
                passwordEncoder
        );

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.login("maria@example.com", "wrong-password")
        );

        assertEquals(401, exception.getStatusCode().value());
        assertTrue(exception.getReason().contains("Credenciais"));
    }

    private static <T> T proxy(Class<T> type, InvocationHandler handler) {
        Object proxy = Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, handler);
        return type.cast(proxy);
    }

    private static Object defaultValue(Class<?> returnType) {
        if (returnType.equals(boolean.class)) {
            return false;
        }
        if (returnType.equals(byte.class)
                || returnType.equals(short.class)
                || returnType.equals(int.class)
                || returnType.equals(long.class)
                || returnType.equals(float.class)
                || returnType.equals(double.class)
                || returnType.equals(char.class)) {
            return 0;
        }
        return null;
    }
}
