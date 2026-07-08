package com.codecampus.service;

import com.codecampus.model.*;
import com.codecampus.repository.UserNotificationRepository;
import com.codecampus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Notification-service NotificationService.
 * Creates UserNotification records from RabbitMQ events received by EventListener.
 * Does NOT depend on CodingTestRepository (test data comes from event payloads).
 */
@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(UserNotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void handleSubmissionAccepted(Map<String, Object> event) {
        Long userId = getLong(event.get("userId"));
        String questionTitle = (String) event.getOrDefault("questionTitle", "your solution");
        Long testId = getLong(event.get("testId"));
        Long questionId = getLong(event.get("questionId"));
        if (userId == null) return;

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.debug("User {} not found in notification-db, skipping submission.accepted notification", userId);
            return;
        }
        String link = testId != null ? "/contest/" + testId : (questionId != null ? "/problem/" + questionId : "/");
        save(user, "Submission accepted",
             "Your submission for \"" + questionTitle + "\" was accepted.",
             NotificationType.SUBMISSION_ACCEPTED, link);
    }

    @Transactional
    public void handleTestPublished(Map<String, Object> event) {
        String testTitle = (String) event.getOrDefault("testTitle", "New Test");
        String teacherName = (String) event.getOrDefault("teacherName", "Your instructor");
        Long testId = getLong(event.get("testId"));
        Object rawIds = event.get("studentUserIds");
        if (rawIds == null) return;

        List<Long> studentIds = new ArrayList<>();
        if (rawIds instanceof List<?> list) {
            for (Object o : list) if (o instanceof Number n) studentIds.add(n.longValue());
        }

        String body = teacherName + " scheduled \"" + testTitle + "\"";
        String link = testId != null ? "/contest/" + testId : "/";
        for (Long uid : studentIds) {
            User user = userRepository.findById(uid).orElse(null);
            if (user != null) save(user, "New test scheduled", body, NotificationType.TEST_SCHEDULED, link);
        }
    }

    @Transactional
    public void handlePlagiarismDetected(Map<String, Object> event) {
        Long teacherId = getLong(event.get("teacherUserId"));
        String message = (String) event.getOrDefault("message", "Plagiarism detected — review required.");
        Long testId = getLong(event.get("testId"));
        if (teacherId == null) return;

        User teacher = userRepository.findById(teacherId).orElse(null);
        if (teacher == null) {
            log.debug("Teacher {} not found in notification-db, skipping plagiarism notification", teacherId);
            return;
        }
        String link = testId != null ? "/plagiarism/" + testId : "/";
        save(teacher, "Plagiarism review required", message, NotificationType.PLAGIARISM_DETECTED, link);
    }

    private void save(User user, String title, String body, NotificationType type, String linkUrl) {
        UserNotification n = new UserNotification();
        n.setUser(user);
        n.setTitle(title);
        n.setBody(body);
        n.setType(type);
        n.setLinkUrl(linkUrl);
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listForUser(User user, int limit) {
        var page = PageRequest.of(0, Math.min(Math.max(limit, 1), 100));
        List<UserNotification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), page);
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserNotification n : list) result.add(toMap(n));
        return result;
    }

    @Transactional(readOnly = true)
    public long unreadCount(User user) {
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public boolean markRead(User user, Long id) {
        return notificationRepository.findById(id)
                .filter(n -> n.getUser().getId().equals(user.getId()))
                .map(n -> { n.setRead(true); notificationRepository.save(n); return true; })
                .orElse(false);
    }

    @Transactional
    public int markAllRead(User user) {
        return notificationRepository.markAllReadForUser(user.getId());
    }

    private Map<String, Object> toMap(UserNotification n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("title", n.getTitle());
        m.put("body", n.getBody());
        m.put("type", n.getType().name());
        m.put("linkUrl", n.getLinkUrl());
        m.put("read", n.isRead());
        m.put("createdAt", n.getCreatedAt());
        return m;
    }

    private static Long getLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number n) return n.longValue();
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return null; }
    }
}
