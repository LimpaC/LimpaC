package com.limpac.backend.repository;

import com.limpac.backend.entity.Calculation;
<<<<<<< HEAD
import com.limpac.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
=======
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
import java.util.UUID;

@Repository
public interface CalculationRepository extends JpaRepository<Calculation, UUID> {
<<<<<<< HEAD
    List<Calculation> findAllByManager(User manager);
=======

>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
}
