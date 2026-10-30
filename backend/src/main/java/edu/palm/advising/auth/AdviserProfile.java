package edu.palm.advising.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "adviser_profiles")
public class AdviserProfile {
    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(nullable = false, length = 160)
    private String department;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AdviserProfile() {
    }

    public AdviserProfile(AppUser user, String department) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.department = department;
        this.createdAt = Instant.now();
    }

    public String getDepartment() {
        return department;
    }
}
