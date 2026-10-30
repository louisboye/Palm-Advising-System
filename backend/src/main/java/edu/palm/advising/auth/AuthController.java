package edu.palm.advising.auth;

import edu.palm.advising.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/student")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Message registerStudent(@Valid @RequestBody StudentRegistrationRequest request) {
        authService.registerStudent(new AuthService.StudentRegistration(request.email(), request.fullName(),
                request.password(), request.studentNumber(), request.programme(), request.level()));
        return new Message("If this address can be registered, a verification link will be sent.");
    }

    @GetMapping("/verify-email")
    public Message verifyEmail(@RequestParam String token) {
        authService.verifyStudentEmail(token);
        return new Message("Email verified. You can now sign in.");
    }

    @PostMapping("/accept-invitation")
    public UserSummary acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        return authService.acceptAdviserInvitation(request.token(), request.password());
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        JwtTokenService.IssuedToken token = authService.login(request.email(), request.password());
        return new LoginResponse(token.accessToken(), "Bearer", token.expiresIn(), token.user());
    }

    @GetMapping("/me")
    public UserSummary me(@AuthenticationPrincipal Jwt jwt) {
        return authService.currentUser(jwt.getSubject());
    }

    public record StudentRegistrationRequest(
            @NotBlank @Email @Size(max = 320) String email,
            @NotBlank @Size(max = 160) String fullName,
            @NotBlank @Size(min = 12, max = 72) String password,
            @NotBlank @Size(max = 64) String studentNumber,
            @NotBlank @Size(max = 160) String programme,
            @Min(100) @Max(1000) Integer level) {
    }

    public record LoginRequest(@NotBlank @Email @Size(max = 320) String email,
                               @NotBlank String password) {
    }

    public record AcceptInvitationRequest(@NotBlank String token,
                                          @NotBlank @Size(min = 12, max = 72) String password) {
    }

    public record LoginResponse(String accessToken, String tokenType, long expiresIn, UserSummary user) {
    }

    public record Message(String message) {
    }
}
