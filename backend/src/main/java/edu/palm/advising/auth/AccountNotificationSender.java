package edu.palm.advising.auth;

public interface AccountNotificationSender {
    void sendEmailVerification(String email, String verificationUrl);

    void sendAdviserInvitation(String email, String invitationUrl);
}
