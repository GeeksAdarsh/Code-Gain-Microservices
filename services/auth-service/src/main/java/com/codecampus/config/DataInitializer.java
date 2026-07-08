package com.codecampus.config;

import com.codecampus.model.*;
import com.codecampus.repository.BatchRepository;
import com.codecampus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BatchRepository batchRepository;
    private final JdbcTemplate jdbcTemplate;

    public static final String DEMO_BATCH_NAME = "Code-Campus-DemoBatcher";

    @Value("${admin.username:admin}")
    private String adminUsername;
    @Value("${admin.email:admin@codegaint.com}")
    private String adminEmail;
    @Value("${admin.password:}")
    private String adminPassword;

    @Value("${demo.accounts.enabled:false}")
    private boolean demoAccountsEnabled;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           BatchRepository batchRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.batchRepository = batchRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        syncAdminUser();
        migrateSectionTeachers();

        if (demoAccountsEnabled) {
            ensureDefaultUser("teacher", "teacher123", "Prof. Sharma", "teacher@codecampus.com",
                    Role.TEACHER, "Computer Science", null, null, null, null, null);
            ensureDefaultUser("student", "student123", "Adarsh Kumar", "student@codecampus.com",
                    Role.STUDENT, "Computer Science", "2024CS001", null, null, null, null);
            ensureDefaultUser("company", "company123", "TechCorp HR", "hr@techcorp.com",
                    Role.COMPANY, null, null, "TechCorp Solutions", "https://techcorp.com", "Leading tech company", "IT");
        } else {
            disableDemoAccount("teacher");
            disableDemoAccount("student");
            disableDemoAccount("company");
        }

        if (!batchRepository.existsByName(DEMO_BATCH_NAME)) {
            batchRepository.save(new Batch(DEMO_BATCH_NAME, 2023, 2027, "B.Tech / MCA"));
            log.info("Created batch: {}", DEMO_BATCH_NAME);
        }
    }

    private void migrateSectionTeachers() {
        try {
            Integer legacyCol = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() " +
                "AND table_name = 'sections' AND column_name = 'teacher_id'", Integer.class);
            if (legacyCol == null || legacyCol == 0) return;
            int migrated = jdbcTemplate.update(
                "INSERT INTO section_teachers (section_id, teacher_id) " +
                "SELECT s.id, s.teacher_id FROM sections s WHERE s.teacher_id IS NOT NULL " +
                "AND NOT EXISTS (SELECT 1 FROM section_teachers st WHERE st.section_id = s.id AND st.teacher_id = s.teacher_id)");
            if (migrated > 0) log.info("Migrated {} legacy section-teacher assignment(s)", migrated);
        } catch (Exception e) {
            log.warn("Section-teacher migration skipped: {}", e.getMessage());
        }
    }

    private void syncAdminUser() {
        boolean hasPassword = adminPassword != null && !adminPassword.isBlank();
        userRepository.findByUsername(adminUsername).ifPresentOrElse(
                existing -> {
                    existing.setEmail(adminEmail);
                    existing.setRole(Role.ADMIN);
                    existing.setEnabled(true);
                    if (hasPassword) existing.setPassword(passwordEncoder.encode(adminPassword));
                    userRepository.save(existing);
                    log.info("Admin account synced: {} ({})", adminUsername, adminEmail);
                },
                () -> {
                    String rawPassword = hasPassword ? adminPassword : "admin123";
                    userRepository.save(User.builder()
                            .username(adminUsername).password(passwordEncoder.encode(rawPassword))
                            .fullName("System Admin").email(adminEmail).role(Role.ADMIN)
                            .department("Computer Science").enabled(true).build());
                    log.info("Created admin account: {} ({})", adminUsername, adminEmail);
                }
        );
    }

    private void disableDemoAccount(String username) {
        userRepository.findByUsername(username).ifPresent(u -> {
            u.setEnabled(false);
            userRepository.save(u);
            log.info("Disabled demo account: {}", username);
        });
    }

    private void ensureDefaultUser(String username, String rawPassword, String fullName, String email,
                                   Role role, String department, String enrollmentNumber,
                                   String companyName, String companyWebsite, String companyDescription,
                                   String industry) {
        userRepository.findByUsername(username).ifPresentOrElse(
                existing -> log.debug("Demo user already exists: {}", username),
                () -> {
                    userRepository.save(User.builder()
                            .username(username).password(passwordEncoder.encode(rawPassword))
                            .fullName(fullName).email(email).role(role).department(department)
                            .enrollmentNumber(enrollmentNumber).companyName(companyName)
                            .companyWebsite(companyWebsite).companyDescription(companyDescription)
                            .industry(industry).enabled(true).build());
                    log.info("Created demo user: {} / {}", username, rawPassword);
                }
        );
    }
}
