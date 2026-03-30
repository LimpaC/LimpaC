package com.limpac.backend.service;

import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.entity.Calculation;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.CalculationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CalculationService {

    private final CalculationRepository repository;

    // Constantes de impacto por unidade de cartão físico e Digital
    private static final double PHYSICAL_CO2_FACTOR = 0.155;
    private static final double DIGITAL_CO2_FACTOR = 0.000003;
    private static final double PHYSICAL_PLASTIC_FACTOR = 0.005;
    private static final double PHYSICAL_PAPER_FACTOR = 0.020;
    private static final double CO2_ABSORPTION_PER_TREE = 8.15;

    public CalculationService(CalculationRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public CalculationResponseDTO save(CalculationRequestDTO dto) {

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

        Calculation saved = repository.save(entity);
        return convertToDTO(saved);
    }
    @Transactional(readOnly = true)
    public List<CalculationResponseDTO> findAll() {
        //convertendo para DTO
        return repository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CalculationResponseDTO convertToDTO(Calculation entity) {
        return new CalculationResponseDTO(
                entity.getId(),
                entity.getCardVolume(),
                entity.getCo2Saved(),
                entity.getPhysicalPlasticGenerated(), // 0
                entity.getPhysicalPaperGenerated(),   //  0
                entity.getPhysicalCo2Generated(),
                entity.getDigitalCo2Generated(),
                entity.getTreeEquivalents(),
                entity.getCreatedAt()
                //entity.getManager() != null ? entity.getManager().getFullName() : "Anonymous Simulation"
        );
    }
}
