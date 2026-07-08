package com.codecampus.config;

import com.codecampus.model.*;
import com.codecampus.repository.BatchRepository;
import com.codecampus.repository.CodingTestRepository;
import com.codecampus.repository.UserRepository;
import com.codecampus.service.BatchSectionSeeder;
import com.codecampus.service.ProblemSeeder;
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
    private final ProblemSeeder problemSeeder;
    private final BatchSectionSeeder batchSectionSeeder;
    private final CodingTestRepository codingTestRepository;
    private final BatchRepository batchRepository;
    private final JdbcTemplate jdbcTemplate;

    public static final String DEMO_BATCH_NAME = "Code-Campus-DemoBatcher";

    // Admin credentials come from the environment so production can set a strong,
    // non-public password. On every boot the admin account is synced to these values.
    @Value("${admin.username:admin}")
    private String adminUsername;
    @Value("${admin.email:admin@codecampus.com}")
    private String adminEmail;
    @Value("${admin.password:}")
    private String adminPassword;

    // When false (production), the well-known demo accounts (teacher/student/company)
    // are NOT seeded and any existing ones are disabled so their default passwords
    // (teacher123, etc.) can't be used to log in.
    @Value("${demo.accounts.enabled:true}")
    private boolean demoAccountsEnabled;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, ProblemSeeder problemSeeder, BatchSectionSeeder batchSectionSeeder, CodingTestRepository codingTestRepository, BatchRepository batchRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.problemSeeder = problemSeeder;
        this.batchSectionSeeder = batchSectionSeeder;
        this.codingTestRepository = codingTestRepository;
        this.batchRepository = batchRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        syncAdminUser();
        migrateSectionTeachers();

        if (demoAccountsEnabled) {
            ensureDefaultUser("teacher", "teacher123", "Prof. Sharma", "teacher@codecampus.com", Role.TEACHER, "Computer Science", null, null, null, null, null);
            ensureDefaultUser("student", "student123", "Adarsh Kumar", "student@codecampus.com", Role.STUDENT, "Computer Science", "2024CS001", null, null, null, null);
            ensureDefaultUser("company", "company123", "TechCorp HR", "hr@techcorp.com", Role.COMPANY, null, null, "TechCorp Solutions", "https://techcorp.com", "Leading tech company", "IT");
        } else {
            disableDemoAccount("teacher");
            disableDemoAccount("student");
            disableDemoAccount("company");
        }

        // Seed coding problems from JSON
        problemSeeder.seedProblems();

        // Seed dummy batches/sections/students only in demo mode. In production
        // (DEMO_ACCOUNTS=false) the admin uploads real batches themselves, so we
        // never create — or re-create — the placeholder data.
        if (demoAccountsEnabled) {
            batchSectionSeeder.seedIfNeeded();
        }

        // Ensure the demo batch used for real student uploads exists
        if (!batchRepository.existsByName(DEMO_BATCH_NAME)) {
            batchRepository.save(new Batch(DEMO_BATCH_NAME, 2023, 2027, "B.Tech / MCA"));
            log.info("🎓 Created batch: {}", DEMO_BATCH_NAME);
        }

        // Fix tests with totalMarks = 0
        codingTestRepository.findAll().stream()
            .filter(t -> t.getTotalMarks() <= 0)
            .forEach(t -> {
                t.setTotalMarks(100);
                codingTestRepository.save(t);
                log.info("Fixed totalMarks for test: {}", t.getTitle());
            });
    }

    /**
     * One-time migration: copy the legacy single-teacher assignment (sections.teacher_id)
     * into the new many-to-many section_teachers join table so existing assignments are
     * preserved when upgrading. Safe to run repeatedly and on a fresh DB.
     */
    private void migrateSectionTeachers() {
        try {
            Integer legacyCol = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'sections' AND column_name = 'teacher_id'",
                Integer.class);
            if (legacyCol == null || legacyCol == 0) return; // no legacy column → nothing to migrate
            int migrated = jdbcTemplate.update(
                "INSERT INTO section_teachers (section_id, teacher_id) " +
                "SELECT s.id, s.teacher_id FROM sections s WHERE s.teacher_id IS NOT NULL " +
                "AND NOT EXISTS (SELECT 1 FROM section_teachers st WHERE st.section_id = s.id AND st.teacher_id = s.teacher_id)");
            if (migrated > 0) log.info("🔁 Migrated {} legacy section-teacher assignment(s) into section_teachers", migrated);
        } catch (Exception e) {
            log.warn("Section-teacher migration skipped: {}", e.getMessage());
        }
    }

    /**
     * Creates the admin account if missing, otherwise updates its email/password to match
     * the configured values. A blank admin.password leaves an existing admin's password
     * untouched (and only falls back to "admin123" when creating a brand-new local admin).
     */
    private void syncAdminUser() {
        boolean hasPassword = adminPassword != null && !adminPassword.isBlank();
        userRepository.findByUsername(adminUsername).ifPresentOrElse(
                existing -> {
                    existing.setEmail(adminEmail);
                    existing.setRole(Role.ADMIN);
                    existing.setEnabled(true);
                    if (hasPassword) {
                        existing.setPassword(passwordEncoder.encode(adminPassword));
                    }
                    userRepository.save(existing);
                    log.info("🔐 Admin account synced: {} ({})", adminUsername, adminEmail);
                },
                () -> {
                    String rawPassword = hasPassword ? adminPassword : "admin123";
                    userRepository.save(User.builder()
                            .username(adminUsername).password(passwordEncoder.encode(rawPassword))
                            .fullName("System Admin").email(adminEmail).role(Role.ADMIN)
                            .department("Computer Science").enabled(true).build());
                    log.info("✅ Created admin account: {} ({})", adminUsername, adminEmail);
                }
        );
    }

    private void disableDemoAccount(String username) {
        userRepository.findByUsername(username).ifPresent(u -> {
            u.setEnabled(false);
            userRepository.save(u);
            log.info("🚫 Disabled demo account: {}", username);
        });
    }

    private void ensureDefaultUser(String username, String rawPassword, String fullName, String email,
                                   Role role, String department, String enrollmentNumber,
                                   String companyName, String companyWebsite, String companyDescription, String industry) {
        userRepository.findByUsername(username).ifPresentOrElse(
                existing -> {
                    // Leave existing accounts untouched so admin edits (password, email, enabled,
                    // name) persist across restarts. Defaults only apply when first created.
                    log.debug("Demo user already exists, leaving as-is: {}", username);
                },
                () -> {
                    userRepository.save(User.builder()
                            .username(username).password(passwordEncoder.encode(rawPassword))
                            .fullName(fullName).email(email).role(role).department(department)
                            .enrollmentNumber(enrollmentNumber).companyName(companyName)
                            .companyWebsite(companyWebsite).companyDescription(companyDescription)
                            .industry(industry).enabled(true).build());
                    log.info("✅ Created demo user: {} / {}", username, rawPassword);
                }
        );
    }
}
