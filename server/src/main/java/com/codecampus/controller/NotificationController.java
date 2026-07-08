package com.codecampus.controller;

import com.codecampus.model.User;
import com.codecampus.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "30") int limit) {
        return ResponseEntity.ok(notificationService.listForUser(user, limit));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> unreadCount(@AuthenticationPrincipal User user) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("count", notificationService.unreadCount(user));
        return ResponseEntity.ok(m);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable Long id, @AuthenticationPrincipal User user) {
        boolean ok = notificationService.markRead(user, id);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", ok);
        return ok ? ResponseEntity.ok(m) : ResponseEntity.notFound().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead(@AuthenticationPrincipal User user) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("marked", notificationService.markAllRead(user));
        return ResponseEntity.ok(m);
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> broadcast(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User admin) {
        String title = body.getOrDefault("title", "Announcement");
        String message = body.getOrDefault("message", "");
        String targetType = body.getOrDefault("targetType", "all");
        String batchName = body.get("batchName");
        String sectionIdStr = body.get("sectionId");
        Long sectionId = null;
        if (sectionIdStr != null && !sectionIdStr.isBlank()) {
            try { sectionId = Long.parseLong(sectionIdStr); } catch (NumberFormatException ignored) {}
        }
        int count = notificationService.broadcastAnnouncement(title, message, targetType, batchName, sectionId, admin);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("sent", count);
        return ResponseEntity.ok(m);
    }
}
