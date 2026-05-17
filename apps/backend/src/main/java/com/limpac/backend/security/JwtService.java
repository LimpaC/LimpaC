package com.limpac.backend.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtService {

    public static final String COOKIE_NAME = "limpac_auth";

    private final String secret;
    private final long expirationMinutes;
    private final boolean cookieSecure;

    public JwtService(
            @Value("${app.auth.jwt-secret}") String secret,
            @Value("${app.auth.jwt-expiration-minutes}") long expirationMinutes,
            @Value("${app.auth.cookie-secure:false}") boolean cookieSecure
    ) {
        this.secret = secret;
        this.expirationMinutes = expirationMinutes;
        this.cookieSecure = cookieSecure;
    }

    public String createToken(UUID userId, String email) {
        long issuedAt = Instant.now().getEpochSecond();
        long expiresAt = issuedAt + Duration.ofMinutes(expirationMinutes).toSeconds();
        String header = base64Url("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        String payload = base64Url("{\"sub\":\"%s\",\"email\":\"%s\",\"iat\":%d,\"exp\":%d}"
                .formatted(userId, escapeJson(email), issuedAt, expiresAt));
        return header + "." + payload + "." + sign(header + "." + payload);
    }

    public Optional<String> extractEmail(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3 || !sign(parts[0] + "." + parts[1]).equals(parts[2])) {
                return Optional.empty();
            }

            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            long exp = Long.parseLong(extractJsonValue(payload, "exp"));
            if (Instant.now().getEpochSecond() >= exp) {
                return Optional.empty();
            }

            return Optional.ofNullable(extractJsonValue(payload, "email"));
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }

    public Optional<String> readToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }

        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName())) {
                return Optional.of(cookie.getValue());
            }
        }

        return Optional.empty();
    }

    public ResponseCookie createCookie(String token) {
        return ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMinutes(expirationMinutes))
                .build();
    }

    public ResponseCookie clearCookie() {
        return ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível assinar o token.", exception);
        }
    }

    private static String base64Url(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String extractJsonValue(String json, String key) {
        String quoted = "\"" + key + "\":";
        int start = json.indexOf(quoted);
        if (start < 0) {
            return null;
        }
        int valueStart = start + quoted.length();
        if (json.charAt(valueStart) == '"') {
            int stringStart = valueStart + 1;
            int stringEnd = json.indexOf('"', stringStart);
            return json.substring(stringStart, stringEnd);
        }
        int end = json.indexOf(',', valueStart);
        if (end < 0) {
            end = json.indexOf('}', valueStart);
        }
        return json.substring(valueStart, end);
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
