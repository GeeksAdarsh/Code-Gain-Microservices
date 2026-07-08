package com.codecampus.controller;

import com.codecampus.model.Difficulty;
import com.codecampus.model.Role;
import com.codecampus.model.User;
import com.codecampus.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;
    private final CodingTestRepository codingTestRepository;
    private final SectionRepository sectionRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository, QuestionRepository questionRepository, SubmissionRepository submissionRepository, CodingTestRepository codingTestRepository, SectionRepository sectionRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository; this.questionRepository = questionRepository; this.submissionRepository = submissionRepository; this.codingTestRepository = codingTestRepository; this.sectionRepository = sectionRepository; this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> s = new HashMap<>();
        s.put("totalUsers", userRepository.count()); s.put("totalStudents", userRepository.countByRole(Role.STUDENT)); s.put("totalTeachers", userRepository.countByRole(Role.TEACHER)); s.put("totalCompanies", userRepository.countByRole(Role.COMPANY)); s.put("totalQuestions", questionRepository.count()); s.put("totalTests", codingTestRepository.count()); s.put("totalSubmissions", submissionRepository.count()); s.put("easyQuestions", questionRepository.countByDifficulty(Difficulty.EASY)); s.put("mediumQuestions", questionRepository.countByDifficulty(Difficulty.MEDIUM)); s.put("hardQuestions", questionRepository.countByDifficulty(Difficulty.HARD));
        return ResponseEntity.ok(s);
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream().map(u -> {
            Map<String,Object> m=new HashMap<>(); m.put("id",u.getId()); m.put("username",u.getUsername()); m.put("fullName",u.getFullName()); m.put("email",u.getEmail()); m.put("role",u.getRole()); m.put("department",u.getDepartment()); m.put("enabled",u.isEnabled()); m.put("createdAt",u.getCreatedAt()); m.put("systemId",u.getSystemId());
            var sec = u.getSection();
            var bat = u.getBatch() != null ? u.getBatch() : (sec != null ? sec.getBatch() : null);
            m.put("sectionName", sec != null ? sec.getName() : null);
            m.put("batchName", bat != null ? bat.getName() : null);
            return m;
        }).collect(Collectors.toList()));
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long userId, @RequestBody Map<String,String> body) {
        User u = userRepository.findById(userId).orElseThrow(); u.setRole(Role.valueOf(body.get("role"))); userRepository.save(u); return ResponseEntity.ok(Map.of("message","Role updated"));
    }

    @PutMapping("/users/{userId}/toggle")
    public ResponseEntity<?> toggleUser(@PathVariable Long userId) {
        User u = userRepository.findById(userId).orElseThrow(); u.setEnabled(!u.isEnabled()); userRepository.save(u); return ResponseEntity.ok(Map.of("message","User toggled"));
    }

    @DeleteMapping("/users/{userId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        User u = userRepository.findById(userId).orElseThrow();
        if (u.getRole() == Role.ADMIN) return ResponseEntity.badRequest().body(Map.of("error", "Admin accounts cannot be deleted"));
        try {
            // Unassign this user from any sections they teach so the FK doesn't block deletion.
            sectionRepository.findByTeachersId(userId).forEach(s -> { s.removeTeacher(userId); sectionRepository.save(s); });
            userRepository.deleteById(userId);
            return ResponseEntity.ok(Map.of("message", "Deleted " + u.getFullName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "Could not delete — this user has tests or submissions on record."));
        }
    }

    @PutMapping("/users/{userId}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        String newPassword = body.get("password");
        if (newPassword == null || newPassword.length() < 6) return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        User u = userRepository.findById(userId).orElseThrow();
        u.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Password reset for " + u.getFullName()));
    }
}
