package com.codecampus.controller;

import com.codecampus.dto.CodeExecutionRequest;
import com.codecampus.dto.CodeExecutionResponse;
import com.codecampus.model.Submission;
import com.codecampus.model.User;
import com.codecampus.repository.SubmissionRepository;
import com.codecampus.service.CodeExecutionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/code")
public class CodeController {
    private final CodeExecutionService codeExecutionService;
    private final SubmissionRepository submissionRepository;

    public CodeController(CodeExecutionService codeExecutionService, SubmissionRepository submissionRepository) {
        this.codeExecutionService = codeExecutionService;
        this.submissionRepository = submissionRepository;
    }

    @PostMapping("/execute")
    public ResponseEntity<CodeExecutionResponse> executeCode(@Valid @RequestBody CodeExecutionRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(codeExecutionService.executeCode(request, user));
    }

    @PostMapping("/submit")
    public ResponseEntity<CodeExecutionResponse> submitCode(@Valid @RequestBody CodeExecutionRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(codeExecutionService.executeCode(request, user));
    }

    @GetMapping("/submissions/{questionId}")
    public ResponseEntity<List<Map<String, Object>>> getSubmissions(
            @PathVariable Long questionId, @AuthenticationPrincipal User user) {
        List<Submission> subs = submissionRepository.findByUserIdAndQuestionId(user.getId(), questionId);
        List<Map<String, Object>> result = subs.stream()
                .sorted((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()))
                .map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", s.getId());
                    m.put("status", s.getStatus());
                    m.put("language", s.getLanguage());
                    m.put("code", s.getCode());
                    m.put("score", s.getScore());
                    m.put("testCasesPassed", s.getTestCasesPassed());
                    m.put("totalTestCases", s.getTotalTestCases());
                    m.put("submittedAt", s.getSubmittedAt());
                    m.put("testId", s.getCodingTest() != null ? s.getCodingTest().getId() : null);
                    m.put("executionTimeMs", s.getExecutionTimeMs());
                    return m;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
