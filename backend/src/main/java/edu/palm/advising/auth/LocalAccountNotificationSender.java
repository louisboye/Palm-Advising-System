package edu.palm.advising.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
public class LocalAccountNotificationSender implements AccountNotificationSender {
    private static final Logger log = LoggerFactory.getLogger(LocalAccountNotificationSender.class);

    @Override
    public void sendEmailVerification(String email, String verificationUrl) {
        log.info("LOCAL ONLY: email verification link for {}: {}", email, verificationUrl);
    }

    @Override
    public void sendAdviserInvitation(String email, String invitationUrl) {
        log.info("LOCAL ONLY: adviser invitation link for {}: {}", email, invitationUrl);
    }
}
