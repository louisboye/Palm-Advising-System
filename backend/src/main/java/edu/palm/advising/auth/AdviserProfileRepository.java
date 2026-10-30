package edu.palm.advising.auth;

import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdviserProfileRepository extends JpaRepository<AdviserProfile, UUID> {
    @EntityGraph(attributePaths = "user")
    Optional<AdviserProfile> findByUserId(UUID userId);
}
