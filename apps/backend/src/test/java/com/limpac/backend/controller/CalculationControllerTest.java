package com.limpac.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.limpac.backend.dto.CalculationDecrementRequestDTO;
import com.limpac.backend.dto.CalculationIncrementRequestDTO;
import com.limpac.backend.dto.CalculationMetricsDTO;
import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.dto.DashboardStateResponseDTO;
import com.limpac.backend.dto.GoalResponseDTO;
import com.limpac.backend.service.CalculationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Calculo")
public class CalculationControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private CalculationService calculationService;
    private MockMvc mockMvc;

    @BeforeEach
    void configurarMockMvc() {
        calculationService = Mockito.mock(CalculationService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new CalculationController(calculationService)).build();
    }

    @Test
    @DisplayName("retorna 201 e chama o servico ao criar simulacao")
    void deveRetornar201EChamarServicoAoCriarSimulacao() throws Exception {
        UUID token = UUID.randomUUID();
        CalculationRequestDTO request = new CalculationRequestDTO(10.0, token);
        CalculationResponseDTO response = response(10.0);
        Mockito.when(calculationService.save(Mockito.any())).thenReturn(response);

        mockMvc.perform(
                        post("/calculation")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isCreated())
                .andExpect(content().json(objectMapper.writeValueAsString(response)))
                .andExpect(jsonPath("$.cards").value(10.0));

        ArgumentCaptor<CalculationRequestDTO> captor = ArgumentCaptor.forClass(CalculationRequestDTO.class);
        Mockito.verify(calculationService).save(captor.capture());
        assertEquals(token, captor.getValue().token());
        assertEquals(10.0, captor.getValue().cards());
    }

    @Test
    @DisplayName("retorna 200 com historico quando existir historico")
    void deveRetornar200ComHistoricoQuandoExistirHistorico() throws Exception {
        UUID token = UUID.randomUUID();
        List<CalculationResponseDTO> historico = List.of(response(10.0), response(25.0));
        Mockito.when(calculationService.findAll(token)).thenReturn(historico);

        mockMvc.perform(get("/calculation/history").param("token", token.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].cards").value(10.0))
                .andExpect(jsonPath("$[1].cards").value(25.0));

        Mockito.verify(calculationService).findAll(token);
    }

    @Test
    @DisplayName("retorna 204 quando o historico estiver vazio")
    void deveRetornar204QuandoHistoricoEstiverVazio() throws Exception {
        UUID token = UUID.randomUUID();
        Mockito.when(calculationService.findAll(token)).thenReturn(List.of());

        mockMvc.perform(get("/calculation/history").param("token", token.toString()))
                .andExpect(status().isNoContent());

        Mockito.verify(calculationService).findAll(token);
    }

    @Test
    @DisplayName("retorna 200 ao consultar o estado")
    void deveRetornar200AoConsultarEstado() throws Exception {
        UUID token = UUID.randomUUID();
        DashboardStateResponseDTO state = new DashboardStateResponseDTO(
                new GoalResponseDTO(350, LocalDateTime.parse("2026-04-27T10:15:30"), true),
                response(25.0),
                new CalculationMetricsDTO(1, 2, 3, 4, 5, 6, 7, 8, 9),
                true,
                7.14
        );
        Mockito.when(calculationService.state(token)).thenReturn(state);

        mockMvc.perform(get("/calculation/state").param("token", token.toString()))
                .andExpect(status().isOk())
                .andExpect(content().json(objectMapper.writeValueAsString(state)))
                .andExpect(jsonPath("$.goal.targetCards").value(350))
                .andExpect(jsonPath("$.hasHistory").value(true));

        Mockito.verify(calculationService).state(token);
    }

    @Test
    @DisplayName("retorna 201 ao incrementar")
    void deveRetornar201AoIncrementar() throws Exception {
        UUID token = UUID.randomUUID();
        CalculationIncrementRequestDTO request = new CalculationIncrementRequestDTO(token, 5);
        CalculationResponseDTO response = response(15.0);
        Mockito.when(calculationService.increment(Mockito.any())).thenReturn(response);

        mockMvc.perform(
                        post("/calculation/increment")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isCreated())
                .andExpect(content().json(objectMapper.writeValueAsString(response)));

        ArgumentCaptor<CalculationIncrementRequestDTO> captor = ArgumentCaptor.forClass(CalculationIncrementRequestDTO.class);
        Mockito.verify(calculationService).increment(captor.capture());
        assertEquals(token, captor.getValue().token());
        assertEquals(5, captor.getValue().addCards());
    }

    @Test
    @DisplayName("retorna 201 ao diminuir")
    void deveRetornar201AoDiminuir() throws Exception {
        UUID token = UUID.randomUUID();
        CalculationDecrementRequestDTO request = new CalculationDecrementRequestDTO(token, 2);
        CalculationResponseDTO response = response(8.0);
        Mockito.when(calculationService.decrement(Mockito.any())).thenReturn(response);

        mockMvc.perform(
                        post("/calculation/decrement")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isCreated())
                .andExpect(content().json(objectMapper.writeValueAsString(response)));

        ArgumentCaptor<CalculationDecrementRequestDTO> captor = ArgumentCaptor.forClass(CalculationDecrementRequestDTO.class);
        Mockito.verify(calculationService).decrement(captor.capture());
        assertEquals(token, captor.getValue().token());
        assertEquals(2, captor.getValue().removeCards());
    }

    @Test
    @DisplayName("retorna 400 quando o incremento for invalido")
    void deveRetornar400QuandoIncrementoForInvalido() throws Exception {
        CalculationIncrementRequestDTO request = new CalculationIncrementRequestDTO(UUID.randomUUID(), 0);

        mockMvc.perform(
                        post("/calculation/increment")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isBadRequest());

        Mockito.verifyNoInteractions(calculationService);
    }

    private static CalculationResponseDTO response(double cards) {
        return new CalculationResponseDTO(
                UUID.randomUUID(),
                cards,
                cards * 1.5,
                cards * 0.25,
                (int) Math.round(cards * 0.4),
                cards * 2.0,
                cards * 3.0,
                cards * 15.0,
                LocalDateTime.parse("2026-04-27T10:15:30")
        );
    }
}
