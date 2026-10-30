package edu.palm.advising;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.palm.advising.auth.AccountNotificationSender;
import org.hamcrest.Matchers;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(AuthFlowIntegrationTests.NotificationConfiguration.class)
class AuthFlowIntegrationTests {
    @Autowired
    MockMvc mockMvc;

    @Autowired
    JsonMapper objectMapper;

    @Autowired
    RecordingNotificationSender notifications;

    @Test
    void studentAndInvitedAdviserCanActivateAndSignInWithRoleScopedAccess() throws Exception {
        mockMvc.perform(get("/accept-invitation.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(Matchers.containsString("Set up your adviser account")));

        mockMvc.perform(post("/api/auth/register/student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", "student@example.test",
                                "fullName", "Synthetic Student",
                                "password", "student-test-password-2026",
                                "studentNumber", "TEST-1001",
                                "programme", "Synthetic Programme",
                                "level", 200))))
                .andExpect(status().isAccepted());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "student@example.test",
                                "password", "student-test-password-2026"))))
                .andExpect(status().isUnauthorized());

        String verificationToken = tokenFrom(notifications.verificationLinks.get("student@example.test"));
        mockMvc.perform(get("/api/auth/verify-email").param("token", verificationToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/auth/verify-email").param("token", verificationToken))
                .andExpect(status().isBadRequest());

        String studentJwt = login("student@example.test", "student-test-password-2026");
        mockMvc.perform(get("/api/students/me").header("Authorization", bearer(studentJwt)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentNumber").value("TEST-1001"))
                .andExpect(jsonPath("$.email").value("student@example.test"));
        mockMvc.perform(post("/api/admin/advisers")
                        .header("Authorization", bearer(studentJwt))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "unauthorized@example.test",
                                "fullName", "Unauthorized", "department", "Test"))))
                .andExpect(status().isForbidden());

        String adminJwt = login("admin@example.test", "test-admin-password-just-for-tests");
        mockMvc.perform(post("/api/admin/advisers")
                        .header("Authorization", bearer(adminJwt))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "adviser@example.test",
                                "fullName", "Synthetic Adviser", "department", "Computing"))))
                .andExpect(status().isAccepted());

        String invitationToken = tokenFrom(notifications.invitationLinks.get("adviser@example.test"));
        mockMvc.perform(post("/api/auth/accept-invitation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("token", invitationToken,
                                "password", "adviser-test-password-2026"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADVISER"));

        String adviserJwt = login("adviser@example.test", "adviser-test-password-2026");
        mockMvc.perform(get("/api/advisers/me").header("Authorization", bearer(adviserJwt)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.department").value("Computing"));
        mockMvc.perform(get("/api/students/me").header("Authorization", bearer(adviserJwt)))
                .andExpect(status().isForbidden());
    }

    private String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("accessToken").asText();
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private static String tokenFrom(String link) {
        String query = URI.create(link).getRawQuery();
        return query.substring("token=".length());
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class NotificationConfiguration {
        @Bean
        @Primary
        RecordingNotificationSender recordingNotificationSender() {
            return new RecordingNotificationSender();
        }
    }

    static class RecordingNotificationSender implements AccountNotificationSender {
        final Map<String, String> verificationLinks = new ConcurrentHashMap<>();
        final Map<String, String> invitationLinks = new ConcurrentHashMap<>();

        @Override
        public void sendEmailVerification(String email, String verificationUrl) {
            verificationLinks.put(email, verificationUrl);
        }

        @Override
        public void sendAdviserInvitation(String email, String invitationUrl) {
            invitationLinks.put(email, invitationUrl);
        }
    }
}
