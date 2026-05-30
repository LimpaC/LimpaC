package com.limpac.backend.config;

import com.limpac.backend.entity.User;
import com.limpac.backend.entity.UserRole;
import com.limpac.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminUserSeeder implements CommandLineRunner {

    public static final String ADMIN_EMAIL = "admin@edenred.com";
    private static final String ADMIN_PASSWORD = "senha123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        userRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(existing -> {
            if (existing.getRole() != UserRole.ADMIN) {
                existing.setRole(UserRole.ADMIN);
            }
            if (!passwordEncoder.matches(ADMIN_PASSWORD, existing.getPasswordHash())) {
                existing.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
            }
            userRepository.save(existing);
        }, () -> {
            User admin = new User();
            admin.setName("Edenred Admin");
            admin.setEmail(ADMIN_EMAIL);
            admin.setCnpj("00000000000000");
            admin.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
            admin.setRole(UserRole.ADMIN);
            userRepository.save(admin);
        });
    }
}
