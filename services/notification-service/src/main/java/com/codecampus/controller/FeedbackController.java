package com.codecampus.controller;

import com.codecampus.model.*;
import com.codecampus.repository.FeedbackRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;

    public FeedbackController(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    @PostMapping
    public ResponseEntity<?> submit(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        Long questionId = body.get("questionId") != null ? Long.valueOf(body.get("questionId").toString()) : null;
        String questionTitle = body.get("questionTitle") != null ? body.get("questionTitle").toString() : null;
        String category = (String) body.get("category");
        String message = (String) body.get("message");

        if (category == null || category.isBlank() || message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Category and message are required"));
        }

        Feedback fb = new Feedback();
        fb.setUser(user);
        fb.setQuestionId(questionId);
        fb.setQuestionTitle(questionTitle);
        fb.setCategory(category);
        fb.setMessage(message);
        feedbackRepository.save(fb);

        return ResponseEntity.ok(Map.of("message", "Feedback submitted successfully", "id", fb.getId()));
    }

    @GetMapping("/question/{questionId}")
    public ResponseEntity<List<Map<String, Object>>> getByQuestion(@PathVariable Long questionId) {
        return ResponseEntity.ok(feedbackRepository.findByQuestionIdOrderByCreatedAtDesc(questionId)
                .stream().map(this::toMap).collect(Collectors.toList()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Map<String, Object>>> myFeedback(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(feedbackRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toMap).collect(Collectors.toList()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(feedbackRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toMap).collect(Collectors.toList()));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", feedbackRepository.count());
        stats.put("open", feedbackRepository.countByStatus("OPEN"));
        stats.put("resolved", feedbackRepository.countByStatus("RESOLVED"));
        stats.put("dismissed", feedbackRepository.countByStatus("DISMISSED"));
        return ResponseEntity.ok(stats);
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<?> resolve(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Feedback fb = feedbackRepository.findById(id).orElseThrow(() -> new RuntimeException("Feedback not found"));
        fb.setStatus("RESOLVED");
        fb.setAdminNote(body.getOrDefault("note", ""));
        fb.setResolvedAt(LocalDateTime.now());
        feedbackRepository.save(fb);
        return ResponseEntity.ok(Map.of("message", "Feedback resolved"));
    }

    @PutMapping("/{id}/dismiss")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<?> dismiss(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Feedback fb = feedbackRepository.findById(id).orElseThrow(() -> new RuntimeException("Feedback not found"));
        fb.setStatus("DISMISSED");
        fb.setAdminNote(body.getOrDefault("note", ""));
        fb.setResolvedAt(LocalDateTime.now());
        feedbackRepository.save(fb);
        return ResponseEntity.ok(Map.of("message", "Feedback dismissed"));
    }

    private Map<String, Object> toMap(Feedback fb) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", fb.getId());
        m.put("category", fb.getCategory());
        m.put("message", fb.getMessage());
        m.put("status", fb.getStatus());
        m.put("adminNote", fb.getAdminNote());
        m.put("createdAt", fb.getCreatedAt());
        m.put("resolvedAt", fb.getResolvedAt());
        m.put("userName", fb.getUser().getFullName());
        m.put("userEmail", fb.getUser().getEmail());
        m.put("questionId", fb.getQuestionId());
        m.put("questionTitle", fb.getQuestionTitle());
        return m;
    }
}
