package com.codecampus.controller;

import com.codecampus.dto.CodingTestDTO;
import com.codecampus.model.User;
import com.codecampus.service.CodingTestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tests")
public class TestController {
    private final CodingTestService codingTestService;
    public TestController(CodingTestService codingTestService) { this.codingTestService = codingTestService; }

    @GetMapping public ResponseEntity<List<CodingTestDTO>> getAll(@AuthenticationPrincipal User user) { return ResponseEntity.ok(codingTestService.getAllTestsForUser(user)); }
    @GetMapping("/active") public ResponseEntity<List<CodingTestDTO>> getActive(@AuthenticationPrincipal User user) { return ResponseEntity.ok(codingTestService.getActiveTestsForUser(user)); }
    @GetMapping("/upcoming") public ResponseEntity<List<CodingTestDTO>> getUpcoming(@AuthenticationPrincipal User user) { return ResponseEntity.ok(codingTestService.getUpcomingTestsForUser(user)); }
    @GetMapping("/{id}") public ResponseEntity<CodingTestDTO> getById(@PathVariable Long id) { return ResponseEntity.ok(codingTestService.getTestById(id)); }

    @PostMapping @PreAuthorize("hasAnyRole('TEACHER','ADMIN','COMPANY')")
    public ResponseEntity<CodingTestDTO> create(@Valid @RequestBody CodingTestDTO dto, @AuthenticationPrincipal User user) { return ResponseEntity.ok(codingTestService.createTest(dto, user)); }

    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('TEACHER','ADMIN','COMPANY')")
    public ResponseEntity<CodingTestDTO> update(@PathVariable Long id, @Valid @RequestBody CodingTestDTO dto) { return ResponseEntity.ok(codingTestService.updateTest(id, dto)); }

    @PutMapping("/{id}/publish") @PreAuthorize("hasAnyRole('TEACHER','ADMIN','COMPANY')")
    public ResponseEntity<CodingTestDTO> publish(@PathVariable Long id) { return ResponseEntity.ok(codingTestService.publishTest(id)); }

    @DeleteMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) { codingTestService.deleteTest(id); return ResponseEntity.ok().build(); }

    @GetMapping("/teacher") @PreAuthorize("hasAnyRole('TEACHER','ADMIN','COMPANY')")
    public ResponseEntity<List<CodingTestDTO>> myTests(@AuthenticationPrincipal User user) { return ResponseEntity.ok(codingTestService.getTestsByTeacher(user.getId())); }

    @GetMapping("/{id}/question-status")
    public ResponseEntity<List<Map<String, Object>>> getQuestionStatus(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(codingTestService.getQuestionStatus(id, user));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitTest(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(codingTestService.submitTest(id, user, false));
    }

    @PostMapping("/{id}/auto-submit")
    public ResponseEntity<Map<String, Object>> autoSubmitTest(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(codingTestService.submitTest(id, user, true));
    }

    /** Admin/Teacher: reset a student's submission so they can rejoin a live test */
    @DeleteMapping("/{testId}/completions/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<Void> resetCompletion(@PathVariable Long testId, @PathVariable Long userId) {
        codingTestService.resetCompletion(testId, userId);
        return ResponseEntity.ok().build();
    }

    /** Admin: list all completions for a test (for results view) */
    @GetMapping("/{id}/completions")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<List<Map<String, Object>>> getCompletions(@PathVariable Long id) {
        return ResponseEntity.ok(codingTestService.getTestCompletions(id));
    }

    @GetMapping("/completed")
    public ResponseEntity<List<Map<String, Object>>> getCompletedTests(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(codingTestService.getCompletedTests(user));
    }

    @GetMapping("/{id}/is-completed")
    public ResponseEntity<Map<String, Object>> isTestCompleted(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(codingTestService.isTestCompleted(id, user));
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(@PathVariable Long id) {
        return ResponseEntity.ok(codingTestService.getLeaderboard(id));
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<Map<String, Object>> getUserSummary(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(codingTestService.getUserTestSummary(id, user));
    }
}
