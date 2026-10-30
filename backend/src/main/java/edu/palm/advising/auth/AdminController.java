package edu.palm.advising.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/advisers")
@Validated
public class AdminController {
    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("hasRole('ADMIN')")
    public Message inviteAdviser(@Valid @RequestBody AdviserInvitationRequest request) {
        authService.inviteAdviser(new AuthService.AdviserInvitation(
                request.email(), request.fullName(), request.department()));
        return new Message("An adviser invitation has been sent to " + request.email() + ".");
    }

    public record AdviserInvitationRequest(@NotBlank @Email @Size(max = 320) String email,
                                           @NotBlank @Size(max = 160) String fullName,
                                           @NotBlank @Size(max = 160) String department) {
    }

    public record Message(String message) {
    }
}
