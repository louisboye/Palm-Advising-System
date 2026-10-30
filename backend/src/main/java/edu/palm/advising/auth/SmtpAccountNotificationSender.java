package edu.palm.advising.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Profile("!local & !test")
public class SmtpAccountNotificationSender implements AccountNotificationSender {
    private final JavaMailSender mailSender;
    private final String from;

    public SmtpAccountNotificationSender(JavaMailSender mailSender,
                                         @Value("${app.mail.from}") String from,
                                         @Value("${SMTP_HOST:}") String smtpHost) {
        if (smtpHost.isBlank()) {
            throw new IllegalStateException("Set SMTP_HOST before running outside the local or test profile.");
        }
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void sendEmailVerification(String email, String verificationUrl) {
        send(email, "Verify your Palm Advising account",
                "Confirm your email address by opening this one-time link:\n\n" + verificationUrl);
    }

    @Override
    public void sendAdviserInvitation(String email, String invitationUrl) {
        send(email, "Your Palm Advising account invitation",
                "An administrator invited you to Palm Advising. Set your password using this one-time link:\n\n"
                        + invitationUrl);
    }

    private void send(String recipient, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}
