package com.limpac.backend.service;

import com.limpac.backend.dto.CalculationRequestDTO;
import com.limpac.backend.dto.CalculationResponseDTO;
import com.limpac.backend.entity.Calculation;
import com.limpac.backend.entity.User;
import com.limpac.backend.repository.CalculationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CalculationService {

    private final CalculationRepository repository;

    // Constantes de impacto por unidade de cartão físico
    private static final double KG_CO2_POR_CARTAO = 0.155;
    private static final double KG_PLASTICO_POR_CARTAO = 0.005;
    private static final double KG_PAPEL_POR_KIT = 0.020;
    private static final double CO2_PER_TREE = 163.0; // kg absorvidos em 20 anos

    public CalculationService(CalculationRepository repository) {
        this.repository = repository;
    }

    public CalculationResponseDTO save(CalculationRequestDTO dto) {

        //Criar entidade
        Calculation entity = new Calculation();
        double volume = dto.volume();

        entity.setTransactionVolume(volume);
        entity.setSavedCo2(volume * KG_CO2_POR_CARTAO);
        entity.setSavedPlastic(volume * KG_PLASTICO_POR_CARTAO);
        entity.setSavedPaper(volume * KG_PAPEL_POR_KIT);

        // Conversão visual: Árvores necessárias para compensar o CO2 em 1 ano
        int tree = (int) Math.ceil(entity.getSavedCo2() / CO2_PER_TREE);
        entity.setEquivalentTrees(tree);

        //entity.setManager(gestor);
        entity.setDateCreate(LocalDateTime.now());

        // Salvar no banco via Repository
        Calculation salvo = repository.save(entity);

        // Retornar o DTO de resposta
        return converterParaDTO(salvo);
    }

    public List<Calculation> findAll() {
        return repository.findAll();
    }

    public CalculationResponseDTO converterParaDTO(Calculation entity) {
        return new CalculationResponseDTO(
                entity.getId(),
                entity.getTransactionVolume(),
                entity.getSavedCo2(),
                entity.getSavedPlastic(),
                entity.getSavedPaper(),
                entity.getEquivalentTrees(),
                entity.getDateCreate()
                //entity.getManager() != null ? entity.getManager().getFullName() : "Anónimo"
        );
    }
}
