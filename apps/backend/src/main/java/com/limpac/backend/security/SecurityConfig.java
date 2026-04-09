package com.limpac.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
<<<<<<< HEAD
import org.springframework.security.config.Customizer;
=======
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
<<<<<<< HEAD
                .cors(Customizer.withDefaults())
=======
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
                // Desabilita CSRF (necessário para aceitar requisiçors http)
                .csrf(AbstractHttpConfigurer::disable)
                // Permite todas as requisições sem autenticação
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                );

        return http.build();
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
