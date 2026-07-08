package com.codecampus.controller;

import com.codecampus.model.ProctoringEventType;
import com.codecampus.model.User;
import com.codecampus.service.ProctoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/proctoring")
public class ProctoringController {
    private final ProctoringService proctoringService;
    public ProctoringController(ProctoringService proctoringService) { this.proctoringService = proctoringService; }

    @PostMapping("/log")
    public ResponseEntity<?> logEvent(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        Object testIdRaw = body.get("testId");
        Object eventTypeRaw = body.get("eventType");
        if (testIdRaw == null || eventTypeRaw == null)
            return ResponseEntity.badRequest().body(Map.of("error", "testId and eventType are required"));
        Long testId = Long.parseLong(testIdRaw.toString());
        ProctoringEventType eventType;
        try { eventType = ProctoringEventType.valueOf(eventTypeRaw.toString()); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("error", "Unknown eventType: " + eventTypeRaw)); }
        String details = body.getOrDefault("details", "").toString();
        String snapshot = body.getOrDefault("snapshot", "").toString();
        var entry = proctoringService.logEvent(testId, user, eventType, details, snapshot.isEmpty() ? null : snapshot);
        return ResponseEntity.ok(Map.of("logged", true, "flagged", entry.isFlagged(), "autoSubmit", proctoringService.shouldAutoSubmit(testId, user.getId())));
    }

    @GetMapping("/report/{testId}/student/{userId}") @PreAuthorize("hasAnyRole('TEACHER','ADMIN','COMPANY')")
    public ResponseEntity<Map<String, Object>> getStudentReport(@PathVariable Long testId, @PathVariable Long userId) { return ResponseEntity.ok(proctoringService.getStudentProctoringReport(testId, userId)); }

    @GetMapping("/overview/{testId}") @PreAuthorize("hasAnyRole('TEACHER','ADMIN','COMPANY')")
    public ResponseEntity<List<Map<String, Object>>> getOverview(@PathVariable Long testId) { return ResponseEntity.ok(proctoringService.getTestProctoringOverview(testId)); }
}
