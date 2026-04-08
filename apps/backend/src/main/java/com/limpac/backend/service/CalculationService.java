package com.limpac.backend.service;

import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.entity.Calculation;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.CalculationRepository;
import com.limpac.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CalculationService {

    private final CalculationRepository repository;
    private final UserRepository userRepository;

    private static final double CO2_PER_CARD = 0.044;
    private static final double PLASTIC_PER_CARD = 0.00714;
    private static final double TREES_PER_CARD = 0.0342;
    private static final double WATER_PER_CARD = 12.857;
    private static final double ENERGY_PER_CARD = 0.514;
    private static final double SUSTAINABILITY_GOAL = -8450;
    private static final double MAX_GOAL = -13000;

    public CalculationService(CalculationRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CalculationResponseDTO save(CalculationRequestDTO dto) {
        User manager = validateUserToken(dto.token());
        Calculation entity = new Calculation();
        double cards = dto.cards();

        entity.setCardVolume(cards);
        entity.setPhysicalCo2Generated(cards * CO2_PER_CARD);
        entity.setDigitalCo2Generated(0.0);
        entity.setCo2Saved(entity.getPhysicalCo2Generated());

        entity.setPhysicalPlasticGenerated(cards * PLASTIC_PER_CARD);
        entity.setDigitalPlasticGenerated(0.0);

        entity.setPhysicalPaperGenerated(0.0);
        entity.setDigitalPaperGenerated(0.0);

        entity.setTreeEquivalents((int) Math.round(cards * TREES_PER_CARD));

        entity.setCreatedAt(LocalDateTime.now());
        entity.setManager(manager);

        Calculation saved = repository.save(entity);
        return convertToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<CalculationResponseDTO> findAll(UUID token) {
        User manager = validateUserToken(token);

        return repository.findAllByManager(manager).stream()
                .map(this::convertToDTO)
                .toList();
    }

    private User validateUserToken(UUID token) {
        if (token == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O token do usuário é obrigatório.");
        }

        return userRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de usuário inválido."));
    }

    public CalculationResponseDTO convertToDTO(Calculation entity) {
        double cards = entity.getCardVolume();
        double progress = (Math.abs(SUSTAINABILITY_GOAL) / Math.abs(MAX_GOAL)) * 100;

        return new CalculationResponseDTO(
                entity.getId(),
                cards,
                entity.getCo2Saved(),
                entity.getPhysicalPlasticGenerated(),
                entity.getTreeEquivalents(),
                cards * WATER_PER_CARD,
                cards * ENERGY_PER_CARD,
                SUSTAINABILITY_GOAL,
                MAX_GOAL,
                progress,
                entity.getCreatedAt()
        );
    }
}
