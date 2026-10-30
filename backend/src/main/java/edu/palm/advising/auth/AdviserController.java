package edu.palm.advising.auth;

import edu.palm.advising.common.ApiException;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/advisers")
public class AdviserController {
    private final AppUserRepository users;
    private final AdviserProfileRepository advisers;

    public AdviserController(AppUserRepository users, AdviserProfileRepository advisers) {
        this.users = users;
        this.advisers = advisers;
    }

    @GetMapping("/me")
    public AdviserSelfProfile me(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        AppUser user = users.findById(userId).orElseThrow(() -> ApiException.notFound("Account not found."));
        AdviserProfile profile = advisers.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Adviser profile not found."));
        return new AdviserSelfProfile(user.getId(), user.getEmail(), user.getFullName(), profile.getDepartment());
    }

    public record AdviserSelfProfile(UUID id, String email, String fullName, String department) {
    }
}
