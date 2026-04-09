package com.limpac.backend.service;

import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.entity.Calculation;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.CalculationRepository;
<<<<<<< HEAD
import com.limpac.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
=======
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8

@Service
public class CalculationService {

    private final CalculationRepository repository;
<<<<<<< HEAD
    private final UserRepository userRepository;

    private static final double CO2_PER_CARD = 0.044;
    private static final double PLASTIC_PER_CARD = 0.00714;
    private static final double TREES_PER_CARD = 0.0342;
    private static final double WATER_PER_CARD = 12.857;
    private static final double ENERGY_PER_CARD = 0.514;

    public CalculationService(CalculationRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
=======

    // Constantes de impacto por unidade de cartão físico e Digital
    private static final double PHYSICAL_CO2_FACTOR = 0.155;
    private static final double DIGITAL_CO2_FACTOR = 0.000003;
    private static final double PHYSICAL_PLASTIC_FACTOR = 0.005;
    private static final double PHYSICAL_PAPER_FACTOR = 0.020;
    private static final double CO2_ABSORPTION_PER_TREE = 8.15;

    public CalculationService(CalculationRepository repository) {
        this.repository = repository;
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
    }

    @Transactional
    public CalculationResponseDTO save(CalculationRequestDTO dto) {
<<<<<<< HEAD
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
=======

        //Criar entidade
        Calculation entity = new Calculation();
        double volume = dto.volume();

        // Caalculos
        entity.setCardVolume(volume);
        entity.setPhysicalCo2Generated(volume * PHYSICAL_CO2_FACTOR);
        entity.setDigitalCo2Generated(volume * DIGITAL_CO2_FACTOR);
        entity.setCo2Saved(entity.getPhysicalCo2Generated() - entity.getDigitalCo2Generated());

        entity.setPhysicalPlasticGenerated(volume * PHYSICAL_PLASTIC_FACTOR);
        entity.setDigitalPlasticGenerated(0.0);

        entity.setPhysicalPaperGenerated(volume * PHYSICAL_PAPER_FACTOR);
        entity.setDigitalPaperGenerated(0.0);

        int trees = (int) Math.ceil(entity.getCo2Saved() / CO2_ABSORPTION_PER_TREE);
        entity.setTreeEquivalents(trees);

        entity.setCreatedAt(LocalDateTime.now());
        //entity.setManager();
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8

        Calculation saved = repository.save(entity);
        return convertToDTO(saved);
    }
<<<<<<< HEAD

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
=======
    @Transactional(readOnly = true)
    public List<CalculationResponseDTO> findAll() {
        //convertendo para DTO
        return repository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
    }

    public CalculationResponseDTO convertToDTO(Calculation entity) {
        return new CalculationResponseDTO(
                entity.getId(),
<<<<<<< HEAD
                entity.getCards(),
                entity.getCo2Impact(),
                entity.getPlasticSaved(),
                entity.getTreesPreserved(),
                entity.getWaterSaved(),
                entity.getEnergySaved(),
                entity.getCreatedAt()
=======
                entity.getCardVolume(),
                entity.getCo2Saved(),
                entity.getPhysicalPlasticGenerated(), // 0
                entity.getPhysicalPaperGenerated(),   //  0
                entity.getPhysicalCo2Generated(),
                entity.getDigitalCo2Generated(),
                entity.getTreeEquivalents(),
                entity.getCreatedAt()
                //entity.getManager() != null ? entity.getManager().getFullName() : "Anonymous Simulation"
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
        );
    }
}
