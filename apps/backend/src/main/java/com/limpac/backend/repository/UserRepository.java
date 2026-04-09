package com.limpac.backend.repository;

import com.limpac.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

<<<<<<< HEAD
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByToken(UUID token);
=======
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
>>>>>>> 846e6abfc5f352a23603caf29ece639c484068e8
}
