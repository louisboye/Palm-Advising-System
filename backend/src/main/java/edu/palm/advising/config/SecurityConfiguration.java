package edu.palm.advising.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.proc.SecurityContext;
import edu.palm.advising.auth.AppUserRepository;
import edu.palm.advising.common.ApiExceptionHandler.ApiError;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.json.JsonMapper;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {
    @Bean
    SecretKey jwtSecretKey(@Value("${app.jwt.secret}") String encodedSecret) {
        if (encodedSecret == null || encodedSecret.isBlank()) {
            throw new IllegalStateException("Set JWT_SECRET to a Base64-encoded random key of at least 32 bytes.");
        }
        try {
            byte[] key = Base64.getDecoder().decode(encodedSecret);
            if (key.length < 32) {
                throw new IllegalStateException("JWT_SECRET must decode to at least 32 random bytes.");
            }
            return new SecretKeySpec(key, "HmacSHA256");
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("JWT_SECRET must be valid Base64 encoding.", exception);
        }
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<SecurityContext>(jwtSecretKey));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSecretKey).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    UserDetailsService userDetailsService(AppUserRepository users) {
        return email -> users.findByEmail(email)
                .map(account -> User.withUsername(account.getEmail())
                        .password(account.getPasswordHash() == null ? "" : account.getPasswordHash())
                        .authorities("ROLE_" + account.getRole().name())
                        .disabled(account.getAccountStatus() != edu.palm.advising.auth.AccountStatus.ACTIVE)
                        .build())
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException(
                        "Invalid email or password."));
    }

    @Bean
    AuthenticationManager authenticationManager(UserDetailsService userDetailsService,
                                                 PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            JwtAuthenticationConverter jwtAuthenticationConverter,
                                            JsonMapper objectMapper) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(
                        org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/auth/login", "/api/auth/register/student",
                                "/api/auth/verify-email", "/api/auth/accept-invitation",
                                "/accept-invitation.html",
                                "/api/health", "/actuator/health", "/actuator/health/**",
                                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/openapi.yaml")
                        .permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/advisers/**").hasRole("ADVISER")
                        .requestMatchers("/api/students/**").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                        .authenticationEntryPoint((request, response, exception) ->
                                writeError(objectMapper, response, HttpStatus.UNAUTHORIZED,
                                        "Authentication is required or the access token is invalid.",
                                        request.getRequestURI()))
                        .accessDeniedHandler((request, response, exception) ->
                                writeError(objectMapper, response, HttpStatus.FORBIDDEN,
                                        "You do not have permission to access this resource.",
                                        request.getRequestURI())));
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") String allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins.split("\\s*,\\s*")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setExposedHeaders(List.of("Location"));
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        source.registerCorsConfiguration("/v3/api-docs/**", configuration);
        source.registerCorsConfiguration("/swagger-ui/**", configuration);
        return source;
    }

    private static void writeError(JsonMapper objectMapper,
                                   jakarta.servlet.http.HttpServletResponse response,
                                   HttpStatus status,
                                   String message,
                                   String path) throws java.io.IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(),
                new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, path, java.util.Map.of()));
    }
}
