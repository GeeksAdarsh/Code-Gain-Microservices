package com.codecampus.config;

import com.codecampus.service.ProblemSeeder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds the question catalog from JSON on first startup.
 */
@Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final ProblemSeeder problemSeeder;

    public DataInitializer(ProblemSeeder problemSeeder) {
        this.problemSeeder = problemSeeder;
    }

    @Override
    public void run(String... args) {
        log.info("Seeding problems...");
        problemSeeder.seedProblems();
    }
}
