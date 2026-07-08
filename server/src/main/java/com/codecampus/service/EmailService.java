package com.codecampus.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.from:CodeCampus <no-reply@codecampus.com>}")
    private String from;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean isConfigured() {
        return mailUsername != null && !mailUsername.isBlank();
    }

    public void sendPasswordResetEmail(String to, String fullName, String resetLink) {
        String subject = "Reset your CodeCampus password";
        String html = buildResetHtml(fullName, resetLink);

        if (!isConfigured()) {
            log.warn("📭 SMTP not configured (MAIL_USERNAME blank). Password-reset link for {}:\n   {}", to, resetLink);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("✉️  Password-reset email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send password-reset email to {}: {}", to, e.getMessage());
            log.warn("Fallback — password-reset link for {}:\n   {}", to, resetLink);
        }
    }

    private String buildResetHtml(String fullName, String resetLink) {
        String name = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        return """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
                  <h2 style="color:#4f46e5;margin-bottom:4px">CodeCampus</h2>
                  <p>Hi %s,</p>
                  <p>We received a request to reset your password. Click the button below to choose a new one.
                     This link expires shortly and can be used only once.</p>
                  <p style="text-align:center;margin:28px 0">
                    <a href="%s" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;font-weight:bold">Reset Password</a>
                  </p>
                  <p style="font-size:13px;color:#475569">If the button doesn't work, copy and paste this link into your browser:</p>
                  <p style="font-size:13px;word-break:break-all"><a href="%s">%s</a></p>
                  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
                  <p style="font-size:12px;color:#94a3b8">If you didn't request this, you can safely ignore this email — your password won't change.</p>
                </div>
                """.formatted(name, resetLink, resetLink, resetLink);
    }
}
