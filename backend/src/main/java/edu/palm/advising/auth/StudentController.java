package edu.palm.advising.auth;

import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    private final AuthService authService;

    public StudentController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public StudentSelfProfile me(@AuthenticationPrincipal Jwt jwt) {
        StudentProfile profile = authService.studentProfile(jwt.getSubject());
        AppUser user = profile.getUser();
        return new StudentSelfProfile(user.getId(), user.getEmail(), user.getFullName(),
                profile.getStudentNumber(), profile.getProgramme(), profile.getLevel());
    }

    public record StudentSelfProfile(UUID id, String email, String fullName, String studentNumber,
                                     String programme, Integer level) {
    }
}
