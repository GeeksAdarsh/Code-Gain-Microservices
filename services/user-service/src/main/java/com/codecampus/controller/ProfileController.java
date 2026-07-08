package com.codecampus.controller;

import com.codecampus.model.*;
import com.codecampus.repository.*;
import com.codecampus.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_.]{3,20}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public ProfileController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @GetMapping("/username-available")
    public ResponseEntity<?> usernameAvailable(@AuthenticationPrincipal User user, @RequestParam String username) {
        String candidate = username == null ? "" : username.trim();
        if (!USERNAME_PATTERN.matcher(candidate).matches()) {
            return ResponseEntity.ok(Map.of("available", false,
                    "reason", "Username must be 3-20 characters: letters, numbers, dot or underscore"));
        }
        if (candidate.equalsIgnoreCase(user.getUsername())) {
            return ResponseEntity.ok(Map.of("available", true, "reason", "This is your current username"));
        }
        boolean taken = userRepository.findByUsername(candidate).isPresent();
        return ResponseEntity.ok(Map.of("available", !taken,
                "reason", taken ? "This username is already taken" : "Username is available"));
    }

    @PutMapping("/username")
    public ResponseEntity<?> updateUsername(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        String candidate = body.getOrDefault("username", "").trim();
        if (!USERNAME_PATTERN.matcher(candidate).matches()) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "Username must be 3-20 characters: letters, numbers, dot or underscore"));
        }
        User u = userRepository.findById(user.getId()).orElseThrow();
        if (candidate.equalsIgnoreCase(u.getUsername()) && candidate.equals(u.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "That's already your username"));
        }
        Optional<User> existing = userRepository.findByUsername(candidate);
        if (existing.isPresent() && !existing.get().getId().equals(u.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This username is already taken"));
        }
        u.setUsername(candidate);
        userRepository.save(u);
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", u.getRole().name());
        claims.put("userId", u.getId());
        String token = jwtService.generateToken(claims, u);
        return ResponseEntity.ok(Map.of("message", "Username updated successfully",
                "username", u.getUsername(), "token", token));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(buildProfile(user));
    }

    @GetMapping("/{username}")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(buildProfile(user));
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        if (body.containsKey("fullName")) u.setFullName(body.get("fullName"));
        if (body.containsKey("bio")) u.setBio(body.get("bio"));
        if (body.containsKey("profileImage")) u.setProfileImage(body.get("profileImage"));
        if (body.containsKey("githubUrl")) u.setGithubUrl(body.get("githubUrl"));
        if (body.containsKey("linkedinUrl")) u.setLinkedinUrl(body.get("linkedinUrl"));
        if (body.containsKey("twitterUrl")) u.setTwitterUrl(body.get("twitterUrl"));
        if (body.containsKey("websiteUrl")) u.setWebsiteUrl(body.get("websiteUrl"));
        if (body.containsKey("location")) u.setLocation(body.get("location"));
        if (body.containsKey("university")) u.setUniversity(body.get("university"));
        if (body.containsKey("department")) u.setDepartment(body.get("department"));
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Profile updated"));
    }

    private Map<String, Object> buildProfile(User user) {
        Map<String, Object> p = new HashMap<>();
        p.put("id", user.getId());
        p.put("username", user.getUsername());
        p.put("fullName", user.getFullName());
        p.put("email", user.getEmail());
        p.put("role", user.getRole());
        p.put("department", user.getDepartment());
        p.put("enrollmentNumber", user.getEnrollmentNumber());
        p.put("profileImage", user.getProfileImage());
        p.put("bio", user.getBio());
        p.put("githubUrl", user.getGithubUrl());
        p.put("linkedinUrl", user.getLinkedinUrl());
        p.put("twitterUrl", user.getTwitterUrl());
        p.put("websiteUrl", user.getWebsiteUrl());
        p.put("location", user.getLocation());
        p.put("university", user.getUniversity());
        p.put("companyName", user.getCompanyName());
        p.put("createdAt", user.getCreatedAt());
        // Submission and question stats are served by execution-service and question-service
        p.put("totalSubmissions", 0);
        p.put("acceptedSubmissions", 0);
        p.put("totalSolved", 0);
        p.put("totalQuestions", 0);
        p.put("easySolved", 0); p.put("easyTotal", 0);
        p.put("mediumSolved", 0); p.put("mediumTotal", 0);
        p.put("hardSolved", 0); p.put("hardTotal", 0);
        p.put("solvedQuestionIds", List.of());
        p.put("languages", Map.of());
        p.put("heatmap", Map.of());
        p.put("totalActiveDays", 0);
        p.put("maxStreak", 0);
        p.put("currentStreak", 0);
        p.put("badges", List.of());
        p.put("recentSubmissions", List.of());
        p.put("recentAccepted", List.of());
        return p;
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@AuthenticationPrincipal User user,
                                          @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "No file selected"));
        if (file.getSize() > 1048576) return ResponseEntity.badRequest().body(Map.of("error", "File too large. Max 1MB allowed."));
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only JPEG and PNG images are allowed"));
        }
        try {
            String base64 = java.util.Base64.getEncoder().encodeToString(file.getBytes());
            String dataUri = "data:" + contentType + ";base64," + base64;
            User u = userRepository.findById(user.getId()).orElseThrow();
            u.setProfileImage(dataUri);
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "Image uploaded", "imageUrl", dataUri));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to process image"));
        }
    }

    @DeleteMapping("/remove-image")
    public ResponseEntity<?> removeImage(@AuthenticationPrincipal User user) {
        User u = userRepository.findById(user.getId()).orElseThrow();
        u.setProfileImage(null);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Profile photo removed"));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal User user,
                                             @RequestBody Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword()))
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
        User u = userRepository.findById(user.getId()).orElseThrow();
        u.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
