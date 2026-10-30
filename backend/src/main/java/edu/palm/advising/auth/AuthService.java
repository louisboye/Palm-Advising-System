package edu.palm.advising.auth;

import edu.palm.advising.common.ApiException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Duration EMAIL_VERIFICATION_TTL = Duration.ofHours(24);
    private static final Duration ADVISER_INVITATION_TTL = Duration.ofHours(48);

    private final AppUserRepository users;
    private final StudentProfileRepository students;
    private final AdviserProfileRepository advisers;
    private final AccountTokenRepository tokens;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final AccountNotificationSender notificationSender;
    private final JwtTokenService jwtTokenService;
    private final String verificationUrl;
    private final String invitationUrl;

    public AuthService(AppUserRepository users,
                       StudentProfileRepository students,
                       AdviserProfileRepository advisers,
                       AccountTokenRepository tokens,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       AccountNotificationSender notificationSender,
                       JwtTokenService jwtTokenService,
                       @Value("${app.mail.verification-url}") String verificationUrl,
                       @Value("${app.mail.invitation-url}") String invitationUrl) {
        this.users = users;
        this.students = students;
        this.advisers = advisers;
        this.tokens = tokens;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.notificationSender = notificationSender;
        this.jwtTokenService = jwtTokenService;
        this.verificationUrl = verificationUrl;
        this.invitationUrl = invitationUrl;
    }

    @Transactional
    public void registerStudent(StudentRegistration request) {
        validatePasswordByteLength(request.password());
        String email = normalizeEmail(request.email());
        if (users.findByEmail(email).isPresent()) {
            return;
        }
        if (students.existsByStudentNumber(request.studentNumber().trim())) {
            throw ApiException.conflict("That student number is already registered.");
        }
        String token = newRawToken();
        AppUser user = users.save(new AppUser(email, request.fullName().trim(),
                passwordEncoder.encode(request.password()), Role.STUDENT,
                AccountStatus.PENDING_EMAIL_VERIFICATION));
        students.save(new StudentProfile(user, request.studentNumber().trim(),
                request.programme().trim(), request.level()));
        tokens.save(new AccountToken(user, hashToken(token), TokenPurpose.EMAIL_VERIFICATION,
                Instant.now().plus(EMAIL_VERIFICATION_TTL)));
        notificationSender.sendEmailVerification(email, verificationUrl + "?token=" + token);
    }

    @Transactional
    public void verifyStudentEmail(String rawToken) {
        AccountToken token = findUsableToken(rawToken, TokenPurpose.EMAIL_VERIFICATION);
        if (token.getUser().getRole() != Role.STUDENT
                || token.getUser().getAccountStatus() != AccountStatus.PENDING_EMAIL_VERIFICATION) {
            throw ApiException.badRequest("This verification link is invalid or has expired.");
        }
        token.getUser().activate();
        token.markUsed(Instant.now());
    }

    @Transactional
    public void inviteAdviser(AdviserInvitation request) {
        String email = normalizeEmail(request.email());
        if (users.findByEmail(email).isPresent()) {
            throw ApiException.conflict("An account with that email address already exists.");
        }
        String rawToken = newRawToken();
        AppUser user = users.save(new AppUser(email, request.fullName().trim(), null, Role.ADVISER,
                AccountStatus.INVITED));
        advisers.save(new AdviserProfile(user, request.department().trim()));
        tokens.save(new AccountToken(user, hashToken(rawToken), TokenPurpose.ADVISER_INVITATION,
                Instant.now().plus(ADVISER_INVITATION_TTL)));
        notificationSender.sendAdviserInvitation(email, invitationUrl + "?token=" + rawToken);
    }

    @Transactional
    public UserSummary acceptAdviserInvitation(String rawToken, String password) {
        validatePasswordByteLength(password);
        AccountToken token = findUsableToken(rawToken, TokenPurpose.ADVISER_INVITATION);
        AppUser user = token.getUser();
        if (user.getRole() != Role.ADVISER || user.getAccountStatus() != AccountStatus.INVITED) {
            throw ApiException.badRequest("This invitation link is invalid or has expired.");
        }
        user.activate(passwordEncoder.encode(password));
        token.markUsed(Instant.now());
        return UserSummary.from(user);
    }

    public JwtTokenService.IssuedToken login(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, password));
        } catch (AuthenticationException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
        AppUser user = users.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AuthenticationServiceException("Authenticated account was not found."));
        return jwtTokenService.issue(user);
    }

    @Transactional(readOnly = true)
    public UserSummary currentUser(String id) {
        AppUser user = users.findById(java.util.UUID.fromString(id))
                .orElseThrow(() -> ApiException.notFound("Account not found."));
        return UserSummary.from(user);
    }

    @Transactional(readOnly = true)
    public StudentProfile studentProfile(String id) {
        return students.findByUserId(java.util.UUID.fromString(id))
                .orElseThrow(() -> ApiException.notFound("Student profile not found."));
    }

    private AccountToken findUsableToken(String rawToken, TokenPurpose purpose) {
        if (rawToken == null || rawToken.isBlank()) {
            throw ApiException.badRequest("This link is invalid or has expired.");
        }
        AccountToken token = tokens.findByTokenHashAndPurpose(hashToken(rawToken), purpose)
                .orElseThrow(() -> ApiException.badRequest("This link is invalid or has expired."));
        if (!token.isUsableAt(Instant.now())) {
            throw ApiException.badRequest("This link is invalid or has expired.");
        }
        return token;
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String newRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hashToken(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required by the Java runtime.", exception);
        }
    }

    private static void validatePasswordByteLength(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw ApiException.badRequest("Password must be no longer than 72 UTF-8 bytes.");
        }
    }

    public record StudentRegistration(String email, String fullName, String password, String studentNumber,
                                      String programme, Integer level) {
    }

    public record AdviserInvitation(String email, String fullName, String department) {
    }
}
