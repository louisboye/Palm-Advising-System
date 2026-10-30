package edu.palm.advising.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class AdminBootstrap {
    @Bean
    @ConditionalOnProperty(name = "app.bootstrap.admin.enabled", havingValue = "true")
    ApplicationRunner bootstrapAdmin(AppUserRepository users,
                                     PasswordEncoder passwordEncoder,
                                     @Value("${app.bootstrap.admin.email}") String email,
                                     @Value("${app.bootstrap.admin.password}") String password,
                                     @Value("${app.bootstrap.admin.full-name:System Administrator}") String fullName) {
        return arguments -> {
            String normalizedEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
            if (normalizedEmail.isBlank() || password.getBytes(StandardCharsets.UTF_8).length < 12
                    || password.getBytes(StandardCharsets.UTF_8).length > 72) {
                throw new IllegalStateException(
                        "Set a bootstrap administrator email and a password between 12 and 72 UTF-8 bytes.");
            }
            users.findByEmail(normalizedEmail).ifPresentOrElse(user -> {
                if (user.getRole() != Role.ADMIN) {
                    throw new IllegalStateException(
                            "The configured bootstrap admin email belongs to a non-admin account.");
                }
            }, () -> users.save(new AppUser(normalizedEmail, fullName.trim(), passwordEncoder.encode(password),
                    Role.ADMIN, AccountStatus.ACTIVE)));
        };
    }
}
