package com.limpac.backend.repository;

import com.limpac.backend.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByToken(UUID token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.token = :token")
    Optional<User> findByTokenForUpdate(@Param("token") UUID token);
}
