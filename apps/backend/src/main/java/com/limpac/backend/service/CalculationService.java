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

    public CalculationService(CalculationRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CalculationResponseDTO save(CalculationRequestDTO dto) {
        User manager = validateUserToken(dto.token());
        Calculation entity = new Calculation();
        double cards = dto.cards();

        entity.setCards(cards);
        entity.setCo2Impact(cards * CO2_PER_CARD);
        entity.setPlasticSaved(cards * PLASTIC_PER_CARD);
        entity.setTreesPreserved((int) Math.round(cards * TREES_PER_CARD));
        entity.setWaterSaved(cards * WATER_PER_CARD);
        entity.setEnergySaved(cards * ENERGY_PER_CARD);
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
        return new CalculationResponseDTO(
                entity.getId(),
                entity.getCards(),
                entity.getCo2Impact(),
                entity.getPlasticSaved(),
                entity.getTreesPreserved(),
                entity.getWaterSaved(),
                entity.getEnergySaved(),
                entity.getCreatedAt()
        );
    }
}
