package com.limpac.backend.security;

import com.limpac.backend.controller.AdminController;
import com.limpac.backend.controller.AuthController;
import com.limpac.backend.controller.CalculationController;
import com.limpac.backend.controller.GoalController;
import com.limpac.backend.controller.OrganizationController;
import com.limpac.backend.entity.UserRole;
import com.limpac.backend.service.AdminDashboardService;
import com.limpac.backend.service.AuthService;
import com.limpac.backend.service.CalculationService;
import com.limpac.backend.service.GoalService;
import com.limpac.backend.service.OrganizationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        AdminController.class,
        AuthController.class,
        CalculationController.class,
        GoalController.class,
        OrganizationController.class
})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CalculationService calculationService;

    @MockitoBean
    private GoalService goalService;

    @MockitoBean
    private OrganizationService organizationService;

    @MockitoBean
    private AdminDashboardService adminDashboardService;

    private final AuthenticatedUser regularUser = new AuthenticatedUser(
            UUID.randomUUID(),
            "maria@example.com",
            "hash",
            UserRole.USER
    );

    @Test
    @DisplayName("bloqueia APIs protegidas quando nao ha usuario autenticado")
    void rejectsProtectedApisWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/calculation/state"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("bloqueia painel admin para usuario comum")
    void rejectsAdminDashboardForRegularUsers() throws Exception {
        mockMvc.perform(get("/admin/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("bloqueia escrita autenticada sem token csrf")
    void rejectsAuthenticatedWritesWithoutCsrf() throws Exception {
        mockMvc.perform(post("/organizations")
                        .with(user(regularUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Recife\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("permite escrita autenticada com token csrf")
    void allowsAuthenticatedWritesWithCsrf() throws Exception {
        mockMvc.perform(post("/organizations")
                        .with(user(regularUser))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Recife\"}"))
                .andExpect(status().isCreated());

        Mockito.verify(organizationService).create(Mockito.any(), Mockito.any());
    }

    @Test
    @DisplayName("expõe cookie csrf para SPA")
    void exposesCsrfCookieForSpa() throws Exception {
        mockMvc.perform(get("/auth/csrf"))
                .andExpect(status().isNoContent())
                .andExpect(cookie().exists("XSRF-TOKEN"));
    }
}
