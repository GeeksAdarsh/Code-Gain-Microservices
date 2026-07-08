package com.codecampus.controller;

import com.codecampus.model.Submission;
import com.codecampus.repository.SubmissionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Internal endpoints consumed only by integrity-service for plagiarism checks.
 * Not exposed externally via the Gateway.
 */
@RestController
@RequestMapping("/internal/submissions")
public class InternalSubmissionController {

    private final SubmissionRepository submissionRepository;

    public InternalSubmissionController(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @GetMapping("/test/{testId}")
    public ResponseEntity<List<Map<String, Object>>> getSubmissionsForTest(@PathVariable Long testId) {
        List<Map<String, Object>> result = submissionRepository.findByTestId(testId).stream()
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", s.getId());
                    m.put("userId", s.getUser() != null ? s.getUser().getId() : null);
                    m.put("userFullName", s.getUser() != null ? s.getUser().getFullName() : null);
                    m.put("questionId", s.getQuestion() != null ? s.getQuestion().getId() : null);
                    m.put("code", s.getCode());
                    m.put("language", s.getLanguage() != null ? s.getLanguage().name() : null);
                    m.put("status", s.getStatus() != null ? s.getStatus().name() : null);
                    m.put("testCasesPassed", s.getTestCasesPassed());
                    m.put("totalTestCases", s.getTotalTestCases());
                    m.put("submittedAt", s.getSubmittedAt());
                    return m;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
