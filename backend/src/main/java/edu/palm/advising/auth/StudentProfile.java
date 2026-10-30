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
@Table(name = "student_profiles")
public class StudentProfile {
    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(name = "student_number", nullable = false, unique = true, length = 64)
    private String studentNumber;

    @Column(nullable = false, length = 160)
    private String programme;

    @Column(nullable = false)
    private Integer level;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected StudentProfile() {
    }

    public StudentProfile(AppUser user, String studentNumber, String programme, Integer level) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.studentNumber = studentNumber;
        this.programme = programme;
        this.level = level;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public String getProgramme() {
        return programme;
    }

    public Integer getLevel() {
        return level;
    }
}
