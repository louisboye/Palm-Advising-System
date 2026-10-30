package edu.palm.advising.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {
    boolean existsByStudentNumber(String studentNumber);

    @EntityGraph(attributePaths = "user")
    Optional<StudentProfile> findByUserId(UUID userId);
}
