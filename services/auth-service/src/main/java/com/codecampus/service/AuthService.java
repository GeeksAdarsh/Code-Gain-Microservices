package com.codecampus.service;

import com.codecampus.dto.AuthRequest;
import com.codecampus.dto.AuthResponse;
import com.codecampus.dto.RegisterRequest;
import com.codecampus.model.*;
import com.codecampus.repository.BatchRepository;
import com.codecampus.repository.PasswordResetTokenRepository;
import com.codecampus.repository.SectionRepository;
import com.codecampus.repository.UserRepository;
import com.codecampus.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final SectionRepository sectionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Value("${college.email.domain:}")
    private String collegeEmailDomain;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.password-reset.expiry-minutes:30}")
    private long resetExpiryMinutes;

    public AuthService(UserRepository userRepository, BatchRepository batchRepository, SectionRepository sectionRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService, AuthenticationManager authenticationManager,
                       PasswordResetTokenRepository passwordResetTokenRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.batchRepository = batchRepository;
        this.sectionRepository = sectionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) throw new RuntimeException("Username already exists!");
        if (userRepository.existsByEmail(request.getEmail())) throw new RuntimeException("Email already exists!");

        if (collegeEmailDomain != null && !collegeEmailDomain.isEmpty() && request.getRole() == Role.STUDENT) {
            if (!request.getEmail().endsWith(collegeEmailDomain))
                throw new RuntimeException("Only college emails (" + collegeEmailDomain + ") are allowed for student registration");
        }

        String systemId = null;
        Batch batch = null;
        if (collegeEmailDomain != null && !collegeEmailDomain.isEmpty() && request.getEmail().endsWith(collegeEmailDomain)) {
            String localPart = request.getEmail().split("@")[0];
            if (localPart.contains(".")) localPart = localPart.split("\\.")[0];
            if (localPart.length() >= 4) {
                systemId = localPart;
                try {
                    int batchYear = Integer.parseInt(localPart.substring(0, 4));
                    String batchName = batchYear + "-" + (batchYear + 4);
                    batch = batchRepository.findByName(batchName).orElse(null);
                } catch (NumberFormatException ignored) {}
            }
        }

        Section section = null;
        if (request.getSectionId() != null) {
            section = sectionRepository.findById(request.getSectionId()).orElse(null);
            if (section != null && batch == null) batch = section.getBatch();
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .role(request.getRole() != null ? request.getRole() : Role.STUDENT)
                .department(request.getDepartment())
                .enrollmentNumber(request.getEnrollmentNumber())
                .systemId(systemId)
                .batch(batch)
                .section(section)
                .companyName(request.getCompanyName())
                .companyWebsite(request.getCompanyWebsite())
                .companyDescription(request.getCompanyDescription())
                .industry(request.getIndustry())
                .enabled(true)
                .build();
        userRepository.save(user);

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId());
        String token = jwtService.generateToken(claims, user);

        return AuthResponse.builder().token(token).username(user.getUsername()).fullName(user.getFullName())
                .email(user.getEmail()).role(user.getRole()).userId(user.getId()).build();
    }

    public AuthResponse login(AuthRequest request) {
        String loginId = request.getUsername();
        User user = userRepository.findByEmail(loginId)
                .or(() -> userRepository.findByUsername(loginId))
                .orElseThrow(() -> new RuntimeException("User not found"));
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword()));

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId());
        String token = jwtService.generateToken(claims, user);

        return AuthResponse.builder().token(token).username(user.getUsername()).fullName(user.getFullName())
                .email(user.getEmail()).role(user.getRole()).userId(user.getId()).build();
    }

    /**
     * Generates a single-use, time-limited reset token and emails a reset link.
     * Always behaves the same whether or not the email exists, to avoid leaking which
     * emails are registered.
     */
    public void forgotPassword(String email) {
        Optional<User> maybeUser = userRepository.findByEmail(email);
        if (maybeUser.isEmpty()) {
            return;
        }
        User user = maybeUser.get();

        passwordResetTokenRepository.invalidateAllForUser(user);

        String token = UUID.randomUUID().toString().replace("-", "")
                + Long.toHexString(System.nanoTime());
        PasswordResetToken prt = new PasswordResetToken(
                token, user, LocalDateTime.now().plusMinutes(resetExpiryMinutes));
        passwordResetTokenRepository.save(prt);

        String base = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        String resetLink = base + "/reset-password?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), resetLink);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset link"));
        if (!prt.isValid()) {
            throw new RuntimeException("This reset link has expired or already been used");
        }

        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        prt.setUsed(true);
        passwordResetTokenRepository.save(prt);
    }
}
