package com.limpac.backend.controller;

import com.limpac.backend.dto.GoalRequestDTO;
import com.limpac.backend.dto.GoalResponseDTO;
import com.limpac.backend.security.AuthenticatedUser;
import com.limpac.backend.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/goal")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @PutMapping
    public ResponseEntity<GoalResponseDTO> upsert(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody @Valid GoalRequestDTO request) {
        GoalResponseDTO response = goalService.upsert(request, user.id());
        return ResponseEntity.ok(response);
    }
}
