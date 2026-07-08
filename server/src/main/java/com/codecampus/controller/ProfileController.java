package com.codecampus.controller;

import com.codecampus.model.*;
import com.codecampus.repository.*;
import com.codecampus.security.JwtService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_.]{3,20}$");

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final QuestionRepository questionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public ProfileController(UserRepository ur, SubmissionRepository sr, QuestionRepository qr, PasswordEncoder pe, JwtService js) {
        this.userRepository = ur; this.submissionRepository = sr; this.questionRepository = qr; this.passwordEncoder = pe; this.jwtService = js;
    }

    /** Validates a candidate username and reports whether it is available. */
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

    /** Updates the current user's username (must be unique) and returns a refreshed JWT. */
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

        return ResponseEntity.ok(Map.of(
                "message", "Username updated successfully",
                "username", u.getUsername(),
                "token", token));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(buildProfile(user));
    }

    @GetMapping("/{username}")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
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

        List<Submission> subs = submissionRepository.findByUserId(user.getId());
        p.put("totalSubmissions", subs.size());
        p.put("acceptedSubmissions", subs.stream().filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED).count());

        Set<Long> solvedE = new HashSet<>(), solvedM = new HashSet<>(), solvedH = new HashSet<>();
        for (Submission s : subs) {
            if (s.getStatus() == SubmissionStatus.ACCEPTED && s.getQuestion() != null) {
                switch (s.getQuestion().getDifficulty()) {
                    case EASY: solvedE.add(s.getQuestion().getId()); break;
                    case MEDIUM: solvedM.add(s.getQuestion().getId()); break;
                    case HARD: solvedH.add(s.getQuestion().getId()); break;
                }
            }
        }
        p.put("totalSolved", solvedE.size() + solvedM.size() + solvedH.size());
        p.put("totalQuestions", questionRepository.count());
        p.put("easySolved", solvedE.size()); p.put("easyTotal", questionRepository.countByDifficulty(Difficulty.EASY));
        p.put("mediumSolved", solvedM.size()); p.put("mediumTotal", questionRepository.countByDifficulty(Difficulty.MEDIUM));
        p.put("hardSolved", solvedH.size()); p.put("hardTotal", questionRepository.countByDifficulty(Difficulty.HARD));

        // All solved question IDs (for checkmarks on problems list)
        Set<Long> allSolvedIds = new HashSet<>();
        allSolvedIds.addAll(solvedE); allSolvedIds.addAll(solvedM); allSolvedIds.addAll(solvedH);
        p.put("solvedQuestionIds", allSolvedIds);

        // Languages — count unique solved questions per language
        Map<String, Long> langs = subs.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED && s.getLanguage() != null && s.getQuestion() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getLanguage().name(),
                        Collectors.collectingAndThen(
                                Collectors.mapping(s -> s.getQuestion().getId(), Collectors.toSet()),
                                set -> (long) set.size()
                        )
                ));
        p.put("languages", langs);

        // Heatmap
        Map<String, Long> heatmap = subs.stream().filter(s -> s.getSubmittedAt() != null)
                .collect(Collectors.groupingBy(s -> s.getSubmittedAt().toLocalDate().toString(), Collectors.counting()));
        p.put("heatmap", heatmap);

        // Active days & streak
        Set<LocalDate> activeDates = subs.stream().filter(s -> s.getSubmittedAt() != null)
                .map(s -> s.getSubmittedAt().toLocalDate()).collect(Collectors.toSet());
        p.put("totalActiveDays", activeDates.size());

        // Calculate max streak
        int maxStreak = 0, currentStreak = 0;
        if (!activeDates.isEmpty()) {
            List<LocalDate> sorted = new ArrayList<>(activeDates);
            Collections.sort(sorted);
            currentStreak = 1; maxStreak = 1;
            for (int i = 1; i < sorted.size(); i++) {
                if (sorted.get(i).equals(sorted.get(i - 1).plusDays(1))) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
                else { currentStreak = 1; }
            }
        }
        p.put("maxStreak", maxStreak);

        // Current streak
        int curStreak = 0;
        LocalDate today = LocalDate.now();
        while (activeDates.contains(today.minusDays(curStreak))) { curStreak++; }
        p.put("currentStreak", curStreak);

        // Badges
        List<Map<String, Object>> badges = new ArrayList<>();
        int totalSolved = solvedE.size() + solvedM.size() + solvedH.size();
        if (totalSolved >= 1) badges.add(badge("🌱", "First Solve", "Solved your first problem", "bronze"));
        if (totalSolved >= 10) badges.add(badge("⚡", "10 Problems", "Solved 10 problems", "bronze"));
        if (totalSolved >= 25) badges.add(badge("🔥", "25 Problems", "Solved 25 problems", "silver"));
        if (totalSolved >= 50) badges.add(badge("💎", "50 Problems", "Solved 50 problems", "silver"));
        if (totalSolved >= 100) badges.add(badge("🏆", "100 Club", "Solved 100 problems", "gold"));
        if (totalSolved >= 200) badges.add(badge("👑", "200 Club", "Solved 200 problems", "gold"));
        if (totalSolved >= 500) badges.add(badge("🌟", "500 Club", "Solved 500 problems", "platinum"));
        if (solvedH.size() >= 1) badges.add(badge("🎯", "Hard Starter", "Solved first hard problem", "bronze"));
        if (solvedH.size() >= 10) badges.add(badge("💀", "Hard Master", "Solved 10 hard problems", "gold"));
        if (activeDates.size() >= 7) badges.add(badge("📅", "7 Day Streak", "Active for 7 days", "bronze"));
        if (activeDates.size() >= 30) badges.add(badge("🗓️", "30 Day Streak", "Active for 30 days", "silver"));
        if (activeDates.size() >= 100) badges.add(badge("💯", "100 Days", "Active for 100 days", "gold"));
        if (activeDates.size() >= 365) badges.add(badge("🏅", "365 Days", "Active for 365 days", "platinum"));
        if (maxStreak >= 7) badges.add(badge("🔥", "Week Warrior", "7 day streak", "bronze"));
        if (maxStreak >= 30) badges.add(badge("⭐", "Month Master", "30 day streak", "silver"));
        if (subs.size() >= 50) badges.add(badge("📝", "50 Submissions", "Made 50 submissions", "bronze"));
        if (subs.size() >= 200) badges.add(badge("📚", "200 Submissions", "Made 200 submissions", "silver"));
        p.put("badges", badges);

        // Recent AC — unique solved questions (latest per question, deduplicated)
        Set<Long> seenQids = new HashSet<>();
        List<Map<String, Object>> recentAC = subs.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED && s.getQuestion() != null)
                .sorted((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()))
                .filter(s -> seenQids.add(s.getQuestion().getId()))
                .limit(20)
                .map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("questionTitle", s.getQuestion().getTitle());
                    m.put("questionId", s.getQuestion().getId());
                    m.put("status", s.getStatus()); m.put("language", s.getLanguage());
                    m.put("submittedAt", s.getSubmittedAt()); m.put("score", s.getScore());
                    return m;
                }).collect(Collectors.toList());

        // All recent submissions (for "All" tab)
        List<Map<String, Object>> recentAll = subs.stream()
                .sorted((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()))
                .limit(30)
                .map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("questionTitle", s.getQuestion() != null ? s.getQuestion().getTitle() : "Unknown");
                    m.put("questionId", s.getQuestion() != null ? s.getQuestion().getId() : null);
                    m.put("status", s.getStatus()); m.put("language", s.getLanguage());
                    m.put("submittedAt", s.getSubmittedAt()); m.put("score", s.getScore());
                    return m;
                }).collect(Collectors.toList());

        p.put("recentSubmissions", recentAll);
        p.put("recentAccepted", recentAC);

        return p;
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) {
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
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (currentPassword == null || currentPassword.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Current password is required"));
        if (newPassword == null || newPassword.length() < 6) return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
        User u = userRepository.findById(user.getId()).orElseThrow();
        u.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    private Map<String, Object> badge(String icon, String name, String desc, String tier) {
        Map<String, Object> b = new HashMap<>();
        b.put("icon", icon); b.put("name", name); b.put("description", desc); b.put("tier", tier);
        return b;
    }

    /** Full practice history — submissions grouped by question + topic stats */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal User user) {
        List<Submission> subs = submissionRepository.findByUserId(user.getId());

        // Group by questionId → latest submission info + count
        Map<Long, Map<String, Object>> byQuestion = new LinkedHashMap<>();
        // Sort newest first so we process latest per question
        subs.stream()
            .filter(s -> s.getQuestion() != null)
            .sorted((a, b2) -> b2.getSubmittedAt().compareTo(a.getSubmittedAt()))
            .forEach(s -> {
                Long qid = s.getQuestion().getId();
                byQuestion.computeIfAbsent(qid, k -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("questionId", qid);
                    m.put("questionTitle", s.getQuestion().getTitle());
                    m.put("difficulty", s.getQuestion().getDifficulty());
                    m.put("tags", s.getQuestion().getTags());
                    m.put("lastResult", s.getStatus());
                    m.put("lastSubmittedAt", s.getSubmittedAt());
                    m.put("language", s.getLanguage());
                    m.put("count", 0);
                    return m;
                });
                byQuestion.get(qid).merge("count", 1, (a2, b3) -> (int)a2 + (int)b3);
            });

        // Topic stats — count solved questions per tag
        Set<Long> solvedIds = subs.stream()
            .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED && s.getQuestion() != null)
            .map(s -> s.getQuestion().getId())
            .collect(Collectors.toSet());

        // Get total questions per tag and solved per tag
        Map<String, Integer> tagSolved = new HashMap<>();
        Map<String, Integer> tagTotal = new HashMap<>();
        questionRepository.findAll().forEach(q -> {
            if (q.getTags() != null) {
                for (String tag : q.getTags()) {
                    tagTotal.merge(tag, 1, Integer::sum);
                    if (solvedIds.contains(q.getId())) {
                        tagSolved.merge(tag, 1, Integer::sum);
                    }
                }
            }
        });

        List<Map<String, Object>> topics = tagTotal.entrySet().stream()
            .map(e -> {
                Map<String, Object> t = new HashMap<>();
                t.put("tag", e.getKey());
                t.put("total", e.getValue());
                t.put("solved", tagSolved.getOrDefault(e.getKey(), 0));
                return t;
            })
            .sorted((a2, b2) -> Integer.compare((int)b2.get("solved"), (int)a2.get("solved")))
            .collect(Collectors.toList());

        // Acceptance rate
        long total = subs.size();
        long accepted = subs.stream().filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED).count();
        double acceptRate = total > 0 ? (accepted * 100.0 / total) : 0.0;

        Map<String, Object> result = new HashMap<>();
        result.put("history", new ArrayList<>(byQuestion.values()));
        result.put("topics", topics);
        result.put("totalSubmissions", total);
        result.put("acceptanceRate", Math.round(acceptRate * 10.0) / 10.0);
        return ResponseEntity.ok(result);
    }
}
