package com.codecampus.service;

import com.codecampus.model.*;
import com.codecampus.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BatchSectionSeeder {

    private static final Logger log = LoggerFactory.getLogger(BatchSectionSeeder.class);
    private final BatchRepository batchRepository;
    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String[] FIRST_NAMES = {"Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Ayaan","Krishna","Ishaan",
            "Ananya","Diya","Myra","Aanya","Aadhya","Priya","Riya","Saanvi","Nisha","Pooja",
            "Rahul","Amit","Rohit","Ankur","Deepak","Varun","Karan","Nikhil","Harsh","Pankaj"};
    private static final String[] LAST_NAMES = {"Kumar","Sharma","Singh","Verma","Gupta","Patel","Joshi","Mishra","Yadav","Chauhan",
            "Reddy","Nair","Menon","Iyer","Pillai","Rao","Das","Bose","Sen","Dutta",
            "Agarwal","Mehta","Shah","Jain","Thakur","Pandey","Tiwari","Saxena","Dubey","Rastogi"};

    public BatchSectionSeeder(BatchRepository batchRepository, SectionRepository sectionRepository,
                               UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.batchRepository = batchRepository;
        this.sectionRepository = sectionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void seedIfNeeded() {
        if (batchRepository.count() > 0) {
            log.info("📦 Batches already seeded ({} batches, {} sections)", batchRepository.count(), sectionRepository.count());
            return;
        }

        log.info("🏫 Seeding batch & section data with dummy students...");

        int[][] batchYears = {{2022, 2026}, {2023, 2027}};
        String[] sectionNames = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"};
        int studentsPerSection = 30;

        User teacher1 = userRepository.findByUsername("teacher").orElse(null);
        User teacher2 = createTeacherIfNeeded("prof.sharma", "Prof. Sharma", "sharma@faculty.sharda.ac.in");
        User teacher3 = createTeacherIfNeeded("prof.verma", "Prof. Verma", "verma@faculty.sharda.ac.in");
        User teacher4 = createTeacherIfNeeded("prof.singh", "Prof. Singh", "singh@faculty.sharda.ac.in");
        User[] teachers = {teacher1, teacher2, teacher3, teacher4};

        int totalStudents = 0;

        for (int[] years : batchYears) {
            String batchName = years[0] + "-" + years[1];
            Batch batch = new Batch(batchName, years[0], years[1], "B.Tech");
            batchRepository.save(batch);

            for (int si = 0; si < sectionNames.length; si++) {
                Section section = new Section(sectionNames[si], batch);
                User assignedTeacher = teachers[si % teachers.length];
                section.addTeacher(assignedTeacher);
                sectionRepository.save(section);

                for (int s = 0; s < studentsPerSection; s++) {
                    int idx = si * studentsPerSection + s;
                    String firstName = FIRST_NAMES[idx % FIRST_NAMES.length];
                    String lastName = LAST_NAMES[(idx / FIRST_NAMES.length + si) % LAST_NAMES.length];
                    String fullName = firstName + " " + lastName;

                    String systemId = String.format("%d%06d", years[0], 500001 + idx);
                    String email = systemId + "." + firstName.toLowerCase() + "@ug.sharda.ac.in";
                    String username = systemId.toLowerCase();
                    String rollNumber = "CSE-" + sectionNames[si] + String.format("%02d", s + 1);

                    if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) continue;

                    User student = User.builder()
                            .username(username).password(passwordEncoder.encode(systemId))
                            .fullName(fullName).email(email).role(Role.STUDENT)
                            .systemId(systemId).enrollmentNumber(rollNumber)
                            .department("Computer Science").university("Sharda University")
                            .batch(batch).section(section).enabled(true).build();
                    userRepository.save(student);
                    totalStudents++;
                }
            }
        }

        log.info("✅ Seeded {} batches, {} sections, {} students", batchYears.length, batchYears.length * sectionNames.length, totalStudents);
    }

    private User createTeacherIfNeeded(String username, String fullName, String email) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            User t = User.builder().username(username).password(passwordEncoder.encode(username + "123"))
                    .fullName(fullName).email(email).role(Role.TEACHER)
                    .department("Computer Science").university("Sharda University").enabled(true).build();
            return userRepository.save(t);
        });
    }
}
