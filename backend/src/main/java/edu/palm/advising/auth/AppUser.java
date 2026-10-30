package edu.palm.advising.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_users")
public class AppUser {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 320)
    private String email;

    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 160)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 32)
    private AccountStatus accountStatus;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AppUser() {
    }

    public AppUser(String email, String fullName, String passwordHash, Role role, AccountStatus accountStatus) {
        this.id = UUID.randomUUID();
        this.email = email;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.role = role;
        this.accountStatus = accountStatus;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getFullName() {
        return fullName;
    }

    public Role getRole() {
        return role;
    }

    public AccountStatus getAccountStatus() {
        return accountStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void activate(String encodedPassword) {
        this.passwordHash = encodedPassword;
        this.accountStatus = AccountStatus.ACTIVE;
    }

    public void activate() {
        this.accountStatus = AccountStatus.ACTIVE;
    }
}
