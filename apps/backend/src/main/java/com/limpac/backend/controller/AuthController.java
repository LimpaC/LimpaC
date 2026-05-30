package com.limpac.backend.controller;

import com.limpac.backend.dto.AuthSessionResponseDTO;
import com.limpac.backend.dto.LoginRequestDTO;
import com.limpac.backend.dto.RegisterRequestDTO;
import com.limpac.backend.security.AuthenticatedUser;
import com.limpac.backend.security.JwtService;
import com.limpac.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthSessionResponseDTO> register(@RequestBody @Valid RegisterRequestDTO request) {
        AuthSessionResponseDTO response = authService.register(request);
        String token = jwtService.createToken(response.user().id(), response.user().email());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtService.createCookie(token).toString())
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthSessionResponseDTO> login(@RequestBody @Valid LoginRequestDTO request) {
        AuthSessionResponseDTO response = authService.login(request.email(), request.password());
        String token = jwtService.createToken(response.user().id(), response.user().email());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtService.createCookie(token).toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, jwtService.clearCookie().toString())
                .build();
    }

    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf(CsrfToken csrfToken) {
        csrfToken.getToken();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthSessionResponseDTO> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(authService.currentSession(user.id()));
    }
}
