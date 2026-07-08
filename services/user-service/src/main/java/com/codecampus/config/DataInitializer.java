package com.codecampus.config;

import com.codecampus.model.Batch;
import com.codecampus.repository.BatchRepository;
import com.codecampus.service.BatchSectionSeeder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds demo batches/sections on startup when demo mode is enabled.
 */
@Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final BatchRepository batchRepository;
    private final BatchSectionSeeder batchSectionSeeder;

    @Value("${demo.accounts.enabled:false}")
    private boolean demoAccountsEnabled;

    public DataInitializer(BatchRepository batchRepository, BatchSectionSeeder batchSectionSeeder) {
        this.batchRepository = batchRepository;
        this.batchSectionSeeder = batchSectionSeeder;
    }

    @Override
    public void run(String... args) {
        if (demoAccountsEnabled) {
            batchSectionSeeder.seedIfNeeded();
        }
        if (!batchRepository.existsByName("Code-Campus-DemoBatcher")) {
            batchRepository.save(new Batch("Code-Campus-DemoBatcher", 2023, 2027, "B.Tech / MCA"));
            log.info("Created batch: Code-Campus-DemoBatcher");
        }
    }
}
