package com.codecampus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableCaching
public class CodeCampusApplication {
    public static void main(String[] args) {
        SpringApplication.run(CodeCampusApplication.class, args);
    }
}
