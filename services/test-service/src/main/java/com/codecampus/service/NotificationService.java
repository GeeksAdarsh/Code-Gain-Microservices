package com.codecampus.service;

import com.codecampus.model.*;
import com.codecampus.repository.CodingTestRepository;
import com.codecampus.repository.UserNotificationRepository;
import com.codecampus.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class NotificationService {

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("MMM d, yyyy HH:mm");

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final CodingTestRepository codingTestRepository;

    public NotificationService(UserNotificationRepository notificationRepository, UserRepository userRepository, CodingTestRepository codingTestRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.codingTestRepository = codingTestRepository;
    }

    @Transactional
    public void notifyTestPublished(Long testId) {
        CodingTest test = codingTestRepository.findById(testId).orElse(null);
        if (test == null || test.getCreatedBy() == null) return;

        String prof = test.getCreatedBy().getFullName();
        String when = test.getStartTime() != null ? test.getStartTime().format(DT) : "soon";
        String relative = relativeStart(test.getStartTime());
        String title = "New test scheduled";
        String body = prof + " scheduled \"" + test.getTitle() + "\" — " + (relative != null ? relative : "starts " + when);
        String link = "/contest/" + test.getId();

        for (User student : studentsWhoSeeTest(test)) {
            save(student, title, body, NotificationType.TEST_SCHEDULED, link);
        }
    }

    @Transactional
    public void notifySubmissionAccepted(User user, Question question, Long testId) {
        if (user == null || question == null) return;
        String title = "Submission accepted";
        String body = "Your submission for \"" + question.getTitle() + "\" was accepted.";
        String link = testId != null ? "/contest/" + testId : "/problem/" + question.getId();
        save(user, title, body, NotificationType.SUBMISSION_ACCEPTED, link);
    }

    @Transactional
    public void notifyPlagiarismDetected(CodingTest test, String detailLine) {
        if (test == null || test.getCreatedBy() == null) return;
        User teacher = test.getCreatedBy();
        String title = "Plagiarism review required";
        String body = detailLine != null ? detailLine : "Plagiarism detected in \"" + test.getTitle() + "\" — review required.";
        String link = "/plagiarism/" + test.getId();
        save(teacher, title, body, NotificationType.PLAGIARISM_DETECTED, link);
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

    private List<User> studentsWhoSeeTest(CodingTest t) {
        List<User> out = new ArrayList<>();
        for (User u : userRepository.findByRole(Role.STUDENT)) {
            if (u.isDebarred()) continue;
            if (studentSeesTest(u, t)) out.add(u);
        }
        return out;
    }

    private boolean studentSeesTest(User user, CodingTest test) {
        Section studentSection = user.getSection();
        if (test.isRestrictToSections() && test.getAllowedSections() != null && !test.getAllowedSections().isEmpty()) {
            if (studentSection == null) return false;
            Long sid = studentSection.getId();
            return test.getAllowedSections().stream().anyMatch(s -> s.getId().equals(sid));
        }
        if (studentSection != null && !studentSection.getTeachers().isEmpty() && test.getCreatedBy() != null) {
            return studentSection.hasTeacher(test.getCreatedBy().getId());
        }
        return studentSection == null;
    }

    private static String relativeStart(LocalDateTime start) {
        if (start == null) return null;
        LocalDateTime now = LocalDateTime.now();
        if (start.isBefore(now)) return "already started";
        long hours = ChronoUnit.HOURS.between(now, start);
        long mins = ChronoUnit.MINUTES.between(now, start);
        if (hours >= 48) return "starts in " + (hours / 24) + " days";
        if (hours >= 1) return "starts in " + hours + " hour" + (hours == 1 ? "" : "s");
        if (mins >= 1) return "starts in " + mins + " minute" + (mins == 1 ? "" : "s");
        return "starting soon";
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listForUser(User user, int limit) {
        var page = PageRequest.of(0, Math.min(Math.max(limit, 1), 100));
        List<UserNotification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), page);
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserNotification n : list) {
            result.add(toMap(n));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public long unreadCount(User user) {
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public boolean markRead(User user, Long id) {
        return notificationRepository.findById(id).filter(n -> n.getUser().getId().equals(user.getId())).map(n -> {
            n.setRead(true);
            notificationRepository.save(n);
            return true;
        }).orElse(false);
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
}
