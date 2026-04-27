package com.limpac.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.limpac.backend.dto.GoalRequestDTO;
import com.limpac.backend.dto.GoalResponseDTO;
import com.limpac.backend.service.GoalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Meta")
public class GoalControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private GoalService goalService;
    private MockMvc mockMvc;

    @BeforeEach
    void configurarMockMvc() {
        goalService = Mockito.mock(GoalService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new GoalController(goalService)).build();
    }

    @Test
    @DisplayName("retorna 200 e chama o servico ao atualizar a meta")
    void deveRetornar200EChamarServicoAoAtualizarMeta() throws Exception {
        UUID token = UUID.randomUUID();
        GoalRequestDTO request = new GoalRequestDTO(token, 500);
        GoalResponseDTO response = new GoalResponseDTO(500, LocalDateTime.parse("2026-04-27T10:15:30"), true);
        Mockito.when(goalService.upsert(Mockito.any())).thenReturn(response);

        mockMvc.perform(
                        put("/goal")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(response)))
                .andExpect(jsonPath("$.targetCards").value(500))
                .andExpect(jsonPath("$.configured").value(true));

        ArgumentCaptor<GoalRequestDTO> captor = ArgumentCaptor.forClass(GoalRequestDTO.class);
        Mockito.verify(goalService).upsert(captor.capture());
        assertEquals(token, captor.getValue().token());
        assertEquals(500, captor.getValue().targetCards());
    }

    @Test
    @DisplayName("retorna 400 quando a meta for invalida")
    void deveRetornar400QuandoMetaForInvalida() throws Exception {
        GoalRequestDTO request = new GoalRequestDTO(UUID.randomUUID(), 0);

        mockMvc.perform(
                        put("/goal")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isBadRequest());

        Mockito.verifyNoInteractions(goalService);
    }
}
