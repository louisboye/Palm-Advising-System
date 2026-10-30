package edu.palm.advising.auth;

import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.QueryHints;
import jakarta.persistence.QueryHint;
import org.springframework.data.repository.query.Param;

public interface AccountTokenRepository extends JpaRepository<AccountToken, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
    @org.springframework.data.jpa.repository.Query(
            "select token from AccountToken token where token.tokenHash = :tokenHash and token.purpose = :purpose")
    Optional<AccountToken> findByTokenHashAndPurpose(
            @Param("tokenHash") String tokenHash,
            @Param("purpose") TokenPurpose purpose);
}
