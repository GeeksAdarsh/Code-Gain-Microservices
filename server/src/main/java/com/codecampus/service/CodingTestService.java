package com.codecampus.service;

import com.codecampus.dto.CodingTestDTO;
import com.codecampus.model.*;
import com.codecampus.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CodingTestService {

    private final CodingTestRepository codingTestRepository;
    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;
    private final TestCompletionRepository testCompletionRepository;
    private final TestQuestionWeightRepository testQuestionWeightRepository;
    private final SectionRepository sectionRepository;
    private final NotificationService notificationService;
    private final McqQuestionRepository mcqQuestionRepository;
    private final McqAnswerRepository mcqAnswerRepository;
    private final ProctoringLogRepository proctoringLogRepository;
    private final PlagiarismReportRepository plagiarismReportRepository;

    // Default camera-snapshot interval for new tests (seconds), overridable via PROCTOR_SNAPSHOT_INTERVAL.
    @Value("${proctoring.snapshot-interval-seconds:300}")
    private int defaultSnapshotInterval;

    public CodingTestService(CodingTestRepository codingTestRepository, QuestionRepository questionRepository,
                             SubmissionRepository submissionRepository, TestCompletionRepository testCompletionRepository,
                             TestQuestionWeightRepository testQuestionWeightRepository, SectionRepository sectionRepository,
                             NotificationService notificationService, McqQuestionRepository mcqQuestionRepository,
                             McqAnswerRepository mcqAnswerRepository, ProctoringLogRepository proctoringLogRepository,
                             PlagiarismReportRepository plagiarismReportRepository) {
        this.codingTestRepository = codingTestRepository;
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
        this.testCompletionRepository = testCompletionRepository;
        this.testQuestionWeightRepository = testQuestionWeightRepository;
        this.sectionRepository = sectionRepository;
        this.notificationService = notificationService;
        this.mcqQuestionRepository = mcqQuestionRepository;
        this.mcqAnswerRepository = mcqAnswerRepository;
        this.proctoringLogRepository = proctoringLogRepository;
        this.plagiarismReportRepository = plagiarismReportRepository;
    }

    public List<CodingTestDTO> getAllTests() { return codingTestRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList()); }
    public List<CodingTestDTO> getActiveTests() { return codingTestRepository.findActiveTests(LocalDateTime.now()).stream().map(this::toDTO).collect(Collectors.toList()); }
    public List<CodingTestDTO> getUpcomingTests() { return codingTestRepository.findUpcomingTests(LocalDateTime.now()).stream().map(this::toDTO).collect(Collectors.toList()); }

    public List<CodingTestDTO> getAllTestsForUser(User user) { return filterForUser(codingTestRepository.findAll(), user); }
    public List<CodingTestDTO> getActiveTestsForUser(User user) { return filterForUser(codingTestRepository.findActiveTests(LocalDateTime.now()), user); }
    public List<CodingTestDTO> getUpcomingTestsForUser(User user) { return filterForUser(codingTestRepository.findUpcomingTests(LocalDateTime.now()), user); }

    private List<CodingTestDTO> filterForUser(List<CodingTest> tests, User user) {
        if (user == null) return tests.stream().filter(t -> !t.isDeleted()).map(this::toDTO).collect(Collectors.toList());

        // Admin sees ALL tests including soft-deleted ones
        if (user.getRole() == Role.ADMIN) return tests.stream().map(this::toDTO).collect(Collectors.toList());

        // Teacher/Company sees only their own tests (including soft-deleted so they see the deletion notice)
        if (user.getRole() == Role.TEACHER || user.getRole() == Role.COMPANY) {
            return tests.stream()
                .filter(t -> t.getCreatedBy() != null && t.getCreatedBy().getId().equals(user.getId()))
                .map(this::toDTO).collect(Collectors.toList());
        }

        // Student: debarred students see nothing; soft-deleted tests hidden
        if (user.isDebarred()) return List.of();

        Section studentSection = user.getSection();
        return tests.stream().filter(t -> {
            if (t.isDeleted()) return false; // Students never see deleted tests
            if (t.isRestrictToSections() && !t.getAllowedSections().isEmpty()) {
                if (studentSection == null) return false;
                return t.getAllowedSections().stream().anyMatch(s -> s.getId().equals(studentSection.getId()));
            }
            if (studentSection != null && !studentSection.getTeachers().isEmpty() && t.getCreatedBy() != null) {
                return studentSection.hasTeacher(t.getCreatedBy().getId());
            }
            return studentSection == null;
        }).map(this::toDTO).collect(Collectors.toList());
    }
    public CodingTestDTO getTestById(Long id) { return toDTO(codingTestRepository.findById(id).orElseThrow(() -> new RuntimeException("Test not found"))); }

    @Transactional
    public CodingTestDTO createTest(CodingTestDTO dto, User creator) {
        List<Question> questions = dto.getQuestionIds() != null ? questionRepository.findAllById(dto.getQuestionIds()) : new java.util.ArrayList<>();
        CodingTest test = CodingTest.builder().title(dto.getTitle()).description(dto.getDescription()).startTime(dto.getStartTime()).endTime(dto.getEndTime()).durationMinutes(dto.getDurationMinutes()).isActive(dto.isActive()).isPublished(dto.isPublished()).questions(questions).accessCode(dto.getAccessCode()).createdBy(creator).proctoringEnabled(dto.isProctoringEnabled()).cameraRequired(dto.isCameraRequired()).fullscreenRequired(dto.isFullscreenRequired()).maxTabSwitches(dto.getMaxTabSwitches() > 0 ? dto.getMaxTabSwitches() : 7).snapshotIntervalSeconds(dto.getSnapshotIntervalSeconds() > 0 ? dto.getSnapshotIntervalSeconds() : defaultSnapshotInterval).plagiarismCheckEnabled(dto.isPlagiarismCheckEnabled()).testType(dto.getTestType() != null ? TestType.valueOf(dto.getTestType()) : TestType.COLLEGE).jobRole(dto.getJobRole()).companyName(dto.getCompanyName()).experienceLevel(dto.getExperienceLevel()).build();
        if (dto.isRestrictToSections() && dto.getSectionIds() != null && !dto.getSectionIds().isEmpty()) {
            test.setRestrictToSections(true);
            test.setAllowedSections(sectionRepository.findAllById(dto.getSectionIds()));
        }
        CodingTest saved = codingTestRepository.save(test);
        // Save per-question marks weights
        if (dto.getQuestionWeights() != null && !dto.getQuestionWeights().isEmpty()) {
            for (CodingTestDTO.QuestionWeightDTO w : dto.getQuestionWeights()) {
                questionRepository.findById(w.getQuestionId()).ifPresent(q -> {
                    TestQuestionWeight weight = new TestQuestionWeight();
                    weight.setCodingTest(saved);
                    weight.setQuestion(q);
                    weight.setMaxMarks(w.getMaxMarks() > 0 ? w.getMaxMarks() : 100);
                    testQuestionWeightRepository.save(weight);
                });
            }
        }
        return toDTO(saved);
    }

    @Transactional
    public CodingTestDTO updateTest(Long id, CodingTestDTO dto) {
        CodingTest t = codingTestRepository.findById(id).orElseThrow(() -> new RuntimeException("Test not found"));
        t.setTitle(dto.getTitle()); t.setDescription(dto.getDescription()); t.setStartTime(dto.getStartTime()); t.setEndTime(dto.getEndTime()); t.setDurationMinutes(dto.getDurationMinutes()); t.setActive(dto.isActive()); t.setPublished(dto.isPublished()); t.setAccessCode(dto.getAccessCode());
        t.setProctoringEnabled(dto.isProctoringEnabled()); t.setCameraRequired(dto.isCameraRequired()); t.setFullscreenRequired(dto.isFullscreenRequired()); t.setMaxTabSwitches(dto.getMaxTabSwitches()); t.setSnapshotIntervalSeconds(dto.getSnapshotIntervalSeconds()); t.setPlagiarismCheckEnabled(dto.isPlagiarismCheckEnabled());
        if (dto.getJoinWindowMinutes() > 0) t.setJoinWindowMinutes(dto.getJoinWindowMinutes());
        if (dto.getTestType() != null) t.setTestType(TestType.valueOf(dto.getTestType())); t.setJobRole(dto.getJobRole()); t.setCompanyName(dto.getCompanyName()); t.setExperienceLevel(dto.getExperienceLevel());
        if (dto.getQuestionIds() != null) t.setQuestions(questionRepository.findAllById(dto.getQuestionIds()));
        t.setRestrictToSections(dto.isRestrictToSections());
        if (dto.isRestrictToSections() && dto.getSectionIds() != null && !dto.getSectionIds().isEmpty()) {
            t.setAllowedSections(sectionRepository.findAllById(dto.getSectionIds()));
        } else {
            t.setAllowedSections(new ArrayList<>());
        }
        CodingTest savedT = codingTestRepository.save(t);
        // Replace per-question marks weights
        testQuestionWeightRepository.deleteByCodingTestId(id);
        if (dto.getQuestionWeights() != null && !dto.getQuestionWeights().isEmpty()) {
            for (CodingTestDTO.QuestionWeightDTO w : dto.getQuestionWeights()) {
                questionRepository.findById(w.getQuestionId()).ifPresent(q -> {
                    TestQuestionWeight weight = new TestQuestionWeight();
                    weight.setCodingTest(savedT);
                    weight.setQuestion(q);
                    weight.setMaxMarks(w.getMaxMarks() > 0 ? w.getMaxMarks() : 100);
                    testQuestionWeightRepository.save(weight);
                });
            }
        }
        return toDTO(savedT);
    }

    @Transactional
    public CodingTestDTO publishTest(Long id) {
        CodingTest t = codingTestRepository.findById(id).orElseThrow();
        t.setPublished(true);
        t.setActive(true);
        CodingTest saved = codingTestRepository.save(t);
        notificationService.notifyTestPublished(saved.getId());
        return toDTO(saved);
    }
    @Transactional
    public void deleteTest(Long id, String reason, String adminName) {
        CodingTest test = codingTestRepository.findById(id).orElse(null);
        if (test == null) return;
        // Notify the teacher BEFORE soft-deleting so we still have the test data
        notificationService.notifyTestDeleted(test, reason, adminName);
        // Soft-delete: mark as deleted, keep the record so teachers can see the deletion notice
        test.setDeleted(true);
        test.setDeletedReason(reason);
        test.setDeletedByAdminName(adminName);
        test.setDeletedAt(LocalDateTime.now());
        test.setActive(false);
        test.setPublished(false);
        codingTestRepository.save(test);
    }

    @Transactional
    public void resetCompletion(Long testId, Long userId) {
        testCompletionRepository.deleteByUserIdAndCodingTestId(userId, testId);
    }

    public List<Map<String, Object>> getTestCompletions(Long testId) {
        return testCompletionRepository.findByCodingTestId(testId).stream().map(tc -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", tc.getUser().getId());
            m.put("userName", tc.getUser().getFullName());
            m.put("userEmail", tc.getUser().getEmail());
            m.put("totalScore", tc.getTotalScore());
            m.put("questionsAccepted", tc.getQuestionsAccepted());
            m.put("totalQuestions", tc.getTotalQuestions());
            m.put("completedAt", tc.getCompletedAt());
            m.put("autoSubmitted", tc.isAutoSubmitted());
            return m;
        }).collect(Collectors.toList());
    }
    public List<CodingTestDTO> getTestsByTeacher(Long teacherId) { return codingTestRepository.findByCreatedById(teacherId).stream().map(this::toDTO).collect(Collectors.toList()); }

    public List<Map<String, Object>> getQuestionStatus(Long testId, User user) {
        CodingTest test = codingTestRepository.findById(testId).orElseThrow(() -> new RuntimeException("Test not found"));
        List<Submission> userSubs = submissionRepository.findByUserIdAndCodingTestId(user.getId(), testId);
        Map<Long, Integer> weightMap = getWeightMap(testId, test);

        Map<Long, Submission> bestSubPerQuestion = new HashMap<>();
        for (Submission sub : userSubs) {
            if (sub.getQuestion() == null) continue;
            Long qId = sub.getQuestion().getId();
            Submission current = bestSubPerQuestion.get(qId);
            if (current == null || sub.getStatus() == SubmissionStatus.ACCEPTED
                || (current.getStatus() != SubmissionStatus.ACCEPTED && sub.getTestCasesPassed() > current.getTestCasesPassed())) {
                bestSubPerQuestion.put(qId, sub);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        List<Question> questions = test.getQuestions();
        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            Map<String, Object> qStatus = new LinkedHashMap<>();
            qStatus.put("questionId", q.getId());
            qStatus.put("questionNumber", i + 1);
            qStatus.put("title", q.getTitle());
            qStatus.put("difficulty", q.getDifficulty() != null ? q.getDifficulty().name() : "MEDIUM");
            int maxMarks = weightMap.getOrDefault(q.getId(), 100);
            qStatus.put("maxMarks", maxMarks);
            Submission best = bestSubPerQuestion.get(q.getId());
            if (best == null) {
                qStatus.put("status", "NOT_ATTEMPTED");
                qStatus.put("testCasesPassed", 0);
                qStatus.put("totalTestCases", 0);
                qStatus.put("marksObtained", 0);
            } else {
                qStatus.put("status", best.getStatus() == SubmissionStatus.ACCEPTED ? "ACCEPTED" : "ATTEMPTED");
                qStatus.put("testCasesPassed", best.getTestCasesPassed());
                qStatus.put("totalTestCases", best.getTotalTestCases());
                int marks = best.getTotalTestCases() > 0
                    ? (int) Math.round((double) best.getTestCasesPassed() / best.getTotalTestCases() * maxMarks)
                    : 0;
                qStatus.put("marksObtained", marks);
            }
            result.add(qStatus);
        }
        return result;
    }

    // MCQ score for a user on a test: index 0 = marks scored, index 1 = total MCQ marks available.
    private int[] getMcqScore(Long testId, Long userId) {
        List<McqQuestion> mcqs = mcqQuestionRepository.findByCodingTestIdOrderByOrderIndexAsc(testId);
        if (mcqs.isEmpty()) return new int[]{0, 0};
        int totalMarks = mcqs.stream().mapToInt(McqQuestion::getMarks).sum();
        List<McqAnswer> answers = mcqAnswerRepository.findByUserIdAndCodingTestId(userId, testId);
        int scored = answers.stream()
            .filter(a -> a.getMcqQuestion() != null && a.isCorrect())
            .mapToInt(a -> a.getMcqQuestion().getMarks())
            .sum();
        return new int[]{scored, totalMarks};
    }

    private Map<Long, Integer> getWeightMap(Long testId, CodingTest test) {
        List<TestQuestionWeight> weights = testQuestionWeightRepository.findByCodingTestId(testId);
        Map<Long, Integer> weightMap = new HashMap<>();
        if (!weights.isEmpty()) {
            for (TestQuestionWeight w : weights) weightMap.put(w.getQuestion().getId(), w.getMaxMarks());
        } else {
            int total = test.getTotalMarks() > 0 ? test.getTotalMarks() : 100;
            int numQ = test.getQuestions().size();
            int perQ = numQ > 0 ? total / numQ : 100;
            if (perQ == 0) perQ = 100;
            for (Question q : test.getQuestions()) weightMap.put(q.getId(), perQ);
        }
        return weightMap;
    }

    @Transactional
    public Map<String, Object> submitTest(Long testId, User user) {
        return submitTest(testId, user, false);
    }

    @Transactional
    public Map<String, Object> submitTest(Long testId, User user, boolean autoSubmitted) {
        CodingTest test = codingTestRepository.findById(testId).orElseThrow(() -> new RuntimeException("Test not found"));

        Optional<TestCompletion> existing = testCompletionRepository.findByUserIdAndCodingTestId(user.getId(), testId);
        if (existing.isPresent()) {
            // Allow overwriting only if it was an auto-submit and the test is still live
            if (!existing.get().isAutoSubmitted() || !test.isCurrentlyActive()) {
                throw new RuntimeException("Test already submitted");
            }
            // Delete old auto-submission so we can replace it with new one (or new auto-submit)
            testCompletionRepository.delete(existing.get());
            testCompletionRepository.flush();
        }

        List<Map<String, Object>> questionStatus = getQuestionStatus(testId, user);
        int attempted = (int) questionStatus.stream().filter(q -> !"NOT_ATTEMPTED".equals(q.get("status"))).count();
        int accepted = (int) questionStatus.stream().filter(q -> "ACCEPTED".equals(q.get("status"))).count();
        int totalQ = questionStatus.size();
        int codingObtained = questionStatus.stream().mapToInt(q -> (int) q.getOrDefault("marksObtained", 0)).sum();
        int codingMax = questionStatus.stream().mapToInt(q -> (int) q.getOrDefault("maxMarks", 0)).sum();

        // Fold MCQ marks into the overall score so the final % covers coding + MCQ.
        int[] mcq = getMcqScore(testId, user.getId());
        int mcqObtained = mcq[0], mcqMax = mcq[1];

        int totalMarksObtained = codingObtained + mcqObtained;
        int totalMaxMarks = codingMax + mcqMax;
        int score = totalMaxMarks > 0 ? (int) Math.round((double) totalMarksObtained / totalMaxMarks * 100) : 0;

        TestCompletion completion = new TestCompletion();
        completion.setUser(user);
        completion.setCodingTest(test);
        completion.setTotalQuestions(totalQ);
        completion.setQuestionsAttempted(attempted);
        completion.setQuestionsAccepted(accepted);
        completion.setTotalScore(totalMarksObtained);
        completion.setAutoSubmitted(autoSubmitted);
        testCompletionRepository.save(completion);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("testId", testId);
        result.put("totalQuestions", totalQ);
        result.put("questionsAttempted", attempted);
        result.put("questionsAccepted", accepted);
        result.put("totalScore", totalMarksObtained);
        result.put("totalMaxMarks", totalMaxMarks);
        result.put("codingScore", codingObtained);
        result.put("codingMaxMarks", codingMax);
        result.put("mcqScore", mcqObtained);
        result.put("mcqMaxMarks", mcqMax);
        result.put("percentage", score);
        result.put("message", "Test submitted successfully");
        return result;
    }

    public List<Map<String, Object>> getCompletedTests(User user) {
        List<TestCompletion> completions = testCompletionRepository.findByUserId(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (TestCompletion tc : completions) {
            CodingTest test = tc.getCodingTest();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("testId", test.getId());
            m.put("title", test.getTitle());
            m.put("createdByName", test.getCreatedBy() != null ? test.getCreatedBy().getFullName() : null);
            m.put("totalQuestions", tc.getTotalQuestions());
            m.put("questionsAccepted", tc.getQuestionsAccepted());
            m.put("questionsAttempted", tc.getQuestionsAttempted());
            m.put("totalScore", tc.getTotalScore());
            int codingMax = getWeightMap(test.getId(), test).values().stream().mapToInt(Integer::intValue).sum();
            int mcqMax = getMcqScore(test.getId(), user.getId())[1];
            int totalMax = codingMax + mcqMax;
            m.put("totalMarks", totalMax > 0 ? totalMax : test.getTotalMarks());
            m.put("totalMaxMarks", totalMax);
            m.put("percentage", totalMax > 0 ? (int) Math.round((double) tc.getTotalScore() / totalMax * 100) : 0);
            m.put("completedAt", tc.getCompletedAt());
            m.put("durationMinutes", test.getDurationMinutes());
            m.put("startTime", test.getStartTime());
            m.put("endTime", test.getEndTime());
            result.add(m);
        }
        return result;
    }

    public Map<String, Object> isTestCompleted(Long testId, User user) {
        boolean completed = testCompletionRepository.existsByUserIdAndCodingTestId(user.getId(), testId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("completed", completed);
        if (completed) {
            TestCompletion tc = testCompletionRepository.findByUserIdAndCodingTestId(user.getId(), testId).orElse(null);
            if (tc != null) {
                result.put("totalScore", tc.getTotalScore());
                result.put("questionsAccepted", tc.getQuestionsAccepted());
                result.put("totalQuestions", tc.getTotalQuestions());
                result.put("completedAt", tc.getCompletedAt());
                result.put("autoSubmitted", tc.isAutoSubmitted());
                // Recompute the achievable max (coding + MCQ) so we can show a real percentage.
                CodingTest test = codingTestRepository.findById(testId).orElse(null);
                if (test != null) {
                    int codingMax = getWeightMap(testId, test).values().stream().mapToInt(Integer::intValue).sum();
                    int mcqMax = getMcqScore(testId, user.getId())[1];
                    int totalMax = codingMax + mcqMax;
                    result.put("totalMaxMarks", totalMax);
                    result.put("percentage", totalMax > 0 ? (int) Math.round((double) tc.getTotalScore() / totalMax * 100) : 0);
                }
            }
        }
        return result;
    }

    public List<Map<String, Object>> getLeaderboard(Long testId) {
        CodingTest test = codingTestRepository.findById(testId).orElseThrow(() -> new RuntimeException("Test not found"));
        List<Submission> allSubs = submissionRepository.findByCodingTestId(testId);
        Map<Long, Integer> weightMap = getWeightMap(testId, test);
        List<Question> questions = test.getQuestions();

        Map<Long, Map<Long, Submission>> userBestSubs = new HashMap<>();
        for (Submission sub : allSubs) {
            if (sub.getQuestion() == null) continue;
            Long userId = sub.getUser().getId();
            Long qId = sub.getQuestion().getId();
            userBestSubs.computeIfAbsent(userId, k -> new HashMap<>());
            Submission current = userBestSubs.get(userId).get(qId);
            if (current == null || sub.getStatus() == SubmissionStatus.ACCEPTED
                || (current.getStatus() != SubmissionStatus.ACCEPTED && sub.getTestCasesPassed() > current.getTestCasesPassed())) {
                userBestSubs.get(userId).put(qId, sub);
            }
        }

        // MCQ marks per user + total MCQ marks available, merged into the leaderboard so the
        // score reflects coding + MCQ. Also include users who only answered MCQs.
        List<McqQuestion> mcqQs = mcqQuestionRepository.findByCodingTestIdOrderByOrderIndexAsc(testId);
        int mcqMax = mcqQs.stream().mapToInt(McqQuestion::getMarks).sum();
        Map<Long, Integer> mcqScoreByUser = new HashMap<>();
        Map<Long, User> userById = new HashMap<>();
        for (Map.Entry<Long, Map<Long, Submission>> e : userBestSubs.entrySet()) {
            userById.put(e.getKey(), e.getValue().values().iterator().next().getUser());
        }
        for (McqAnswer a : mcqAnswerRepository.findByCodingTestId(testId)) {
            Long uid = a.getUser().getId();
            userById.putIfAbsent(uid, a.getUser());
            if (a.isCorrect()) mcqScoreByUser.merge(uid, a.getMcqQuestion().getMarks(), Integer::sum);
        }

        List<Map<String, Object>> leaderboard = new ArrayList<>();
        for (Long userId : userById.keySet()) {
            User u = userById.get(userId);
            Map<Long, Submission> qSubs = userBestSubs.getOrDefault(userId, Collections.emptyMap());

            int totalMarksObtained = 0;
            int totalTcPassed = 0;
            int totalTc = 0;
            int questionsAccepted = 0;
            int questionsAttempted = qSubs.size();
            LocalDateTime lastSubmission = null;

            for (Map.Entry<Long, Submission> qe : qSubs.entrySet()) {
                Submission best = qe.getValue();
                int maxM = weightMap.getOrDefault(qe.getKey(), 100);
                int marks = best.getTotalTestCases() > 0
                    ? (int) Math.round((double) best.getTestCasesPassed() / best.getTotalTestCases() * maxM)
                    : 0;
                totalMarksObtained += marks;
                totalTcPassed += best.getTestCasesPassed();
                totalTc += best.getTotalTestCases();
                if (best.getStatus() == SubmissionStatus.ACCEPTED) questionsAccepted++;
                if (lastSubmission == null || (best.getSubmittedAt() != null && best.getSubmittedAt().isAfter(lastSubmission)))
                    lastSubmission = best.getSubmittedAt();
            }

            int mcqScore = mcqScoreByUser.getOrDefault(userId, 0);
            totalMarksObtained += mcqScore;

            // Normalise to a 0-100 score so the frontend can display "score/100" correctly
            // regardless of how many marks each question is worth.
            int codingMax = questions.stream().mapToInt(q -> weightMap.getOrDefault(q.getId(), 100)).sum();
            int totalMaxMarks = codingMax + mcqMax;
            int normalizedScore = totalMaxMarks > 0
                    ? (int) Math.round((double) totalMarksObtained / totalMaxMarks * 100)
                    : 0;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", u.getId());
            row.put("username", u.getUsername());
            row.put("fullName", u.getFullName());
            row.put("email", u.getEmail());
            row.put("profileImage", u.getProfileImage());
            row.put("score", normalizedScore);
            row.put("rawScore", totalMarksObtained);
            row.put("totalMaxMarks", totalMaxMarks);
            row.put("mcqScore", mcqScore);
            row.put("mcqMaxMarks", mcqMax);
            row.put("questionsAccepted", questionsAccepted);
            row.put("questionsAttempted", questionsAttempted);
            row.put("totalQuestions", questions.size());
            row.put("testCasesPassed", totalTcPassed);
            row.put("totalTestCases", totalTc);
            row.put("lastSubmission", lastSubmission);
            leaderboard.add(row);
        }

        leaderboard.sort((a, b) -> {
            int cmp = Integer.compare((int) b.get("rawScore"), (int) a.get("rawScore"));
            if (cmp != 0) return cmp;
            LocalDateTime ta = (LocalDateTime) a.get("lastSubmission");
            LocalDateTime tb = (LocalDateTime) b.get("lastSubmission");
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;
            return ta.compareTo(tb);
        });

        for (int i = 0; i < leaderboard.size(); i++) {
            leaderboard.get(i).put("rank", i + 1);
        }

        return leaderboard;
    }

    public Map<String, Object> getUserTestSummary(Long testId, User user) {
        CodingTest test = codingTestRepository.findById(testId).orElseThrow(() -> new RuntimeException("Test not found"));
        List<Map<String, Object>> qStatus = getQuestionStatus(testId, user);

        int codingObtained = qStatus.stream().mapToInt(q -> (int) q.getOrDefault("marksObtained", 0)).sum();
        int codingMax = qStatus.stream().mapToInt(q -> (int) q.getOrDefault("maxMarks", 0)).sum();
        int[] mcq = getMcqScore(testId, user.getId());
        int mcqObtained = mcq[0], mcqMax = mcq[1];
        int totalMarksObtained = codingObtained + mcqObtained;
        int totalMaxMarks = codingMax + mcqMax;
        int questionsAccepted = (int) qStatus.stream().filter(q -> "ACCEPTED".equals(q.get("status"))).count();
        int questionsAttempted = (int) qStatus.stream().filter(q -> !"NOT_ATTEMPTED".equals(q.get("status"))).count();

        List<Map<String, Object>> leaderboard = getLeaderboard(testId);
        int rank = 0;
        for (Map<String, Object> row : leaderboard) {
            if (row.get("userId").equals(user.getId())) {
                rank = (int) row.get("rank");
                break;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("testId", testId);
        result.put("testTitle", test.getTitle());
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("fullName", user.getFullName());
        result.put("profileImage", user.getProfileImage());
        result.put("rank", rank);
        result.put("totalParticipants", leaderboard.size());
        result.put("score", totalMarksObtained);
        result.put("totalMarks", totalMaxMarks);
        result.put("percentage", totalMaxMarks > 0 ? Math.round((double) totalMarksObtained / totalMaxMarks * 100) : 0);
        result.put("codingScore", codingObtained);
        result.put("codingMaxMarks", codingMax);
        result.put("mcqScore", mcqObtained);
        result.put("mcqMaxMarks", mcqMax);
        result.put("questionsAccepted", questionsAccepted);
        result.put("questionsAttempted", questionsAttempted);
        result.put("totalQuestions", qStatus.size());
        result.put("durationMinutes", test.getDurationMinutes());
        result.put("questions", qStatus);
        return result;
    }

    private CodingTestDTO toDTO(CodingTest t) {
        CodingTestDTO d = new CodingTestDTO();
        d.setId(t.getId()); d.setTitle(t.getTitle()); d.setDescription(t.getDescription()); d.setStartTime(t.getStartTime()); d.setEndTime(t.getEndTime()); d.setDurationMinutes(t.getDurationMinutes()); d.setActive(t.isActive()); d.setPublished(t.isPublished()); d.setAccessCode(t.getAccessCode()); d.setCreatedByName(t.getCreatedBy() != null ? t.getCreatedBy().getFullName() : null); d.setCreatedById(t.getCreatedBy() != null ? t.getCreatedBy().getId() : null); d.setTotalQuestions(t.getQuestions() != null ? t.getQuestions().size() : 0); d.setCurrentlyActive(t.isCurrentlyActive()); d.setQuestionIds(t.getQuestions() != null ? t.getQuestions().stream().map(Question::getId).collect(Collectors.toList()) : null);
        d.setProctoringEnabled(t.isProctoringEnabled()); d.setCameraRequired(t.isCameraRequired()); d.setFullscreenRequired(t.isFullscreenRequired()); d.setMaxTabSwitches(t.getMaxTabSwitches()); d.setSnapshotIntervalSeconds(t.getSnapshotIntervalSeconds()); d.setPlagiarismCheckEnabled(t.isPlagiarismCheckEnabled()); d.setJoinWindowMinutes(t.getJoinWindowMinutes());
        d.setTestType(t.getTestType() != null ? t.getTestType().name() : "COLLEGE"); d.setJobRole(t.getJobRole()); d.setCompanyName(t.getCompanyName() != null ? t.getCompanyName() : (t.getCreatedBy() != null ? t.getCreatedBy().getCompanyName() : null)); d.setExperienceLevel(t.getExperienceLevel());
        d.setTotalMarks(t.getTotalMarks());
        d.setRestrictToSections(t.isRestrictToSections());
        d.setSectionIds(t.getAllowedSections() != null ? t.getAllowedSections().stream().map(Section::getId).collect(Collectors.toList()) : null);
        d.setSectionNames(t.getAllowedSections() != null ? t.getAllowedSections().stream().map(Section::getFullName).collect(Collectors.toList()) : null);
        // Soft-delete info
        d.setDeleted(t.isDeleted());
        d.setDeletedReason(t.getDeletedReason());
        d.setDeletedByAdminName(t.getDeletedByAdminName());
        d.setDeletedAt(t.getDeletedAt());
        // Include per-question weights so the edit form can restore them
        List<TestQuestionWeight> weights = testQuestionWeightRepository.findByCodingTestId(t.getId());
        if (!weights.isEmpty()) {
            d.setQuestionWeights(weights.stream()
                .map(w -> new CodingTestDTO.QuestionWeightDTO(w.getQuestion().getId(), w.getMaxMarks()))
                .collect(Collectors.toList()));
        }
        return d;
    }
}
