package com.codecampus.controller;

import com.codecampus.model.*;
import com.codecampus.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mcq")
public class McqController {

    private final McqQuestionRepository mcqRepo;
    private final McqAnswerRepository answerRepo;
    private final CodingTestRepository testRepo;

    public McqController(McqQuestionRepository mcqRepo, McqAnswerRepository answerRepo, CodingTestRepository testRepo) {
        this.mcqRepo = mcqRepo;
        this.answerRepo = answerRepo;
        this.testRepo = testRepo;
    }

    @PostMapping("/tests/{testId}/questions")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @Transactional
    public ResponseEntity<?> saveQuestions(@PathVariable Long testId, @RequestBody List<Map<String, Object>> questions) {
        CodingTest test = testRepo.findById(testId).orElseThrow();
        // Delete answers before questions to avoid FK constraint violation during ongoing tests
        answerRepo.deleteByCodingTestId(testId);
        mcqRepo.deleteByCodingTestId(testId);

        List<McqQuestion> saved = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            Map<String, Object> q = questions.get(i);
            McqQuestion mcq = new McqQuestion();
            mcq.setCodingTest(test);
            mcq.setQuestion((String) q.get("question"));
            mcq.setOptionA((String) q.get("optionA"));
            mcq.setOptionB((String) q.get("optionB"));
            mcq.setOptionC((String) q.get("optionC"));
            mcq.setOptionD((String) q.get("optionD"));
            mcq.setCorrectOption((String) q.get("correctOption"));
            mcq.setExplanation((String) q.get("explanation"));
            mcq.setMarks(q.get("marks") != null ? ((Number) q.get("marks")).intValue() : 1);
            mcq.setOrderIndex(i);
            saved.add(mcqRepo.save(mcq));
        }
        return ResponseEntity.ok(Map.of("message", "Saved " + saved.size() + " MCQ questions", "count", saved.size()));
    }

    @GetMapping("/tests/{testId}/questions")
    public ResponseEntity<List<Map<String, Object>>> getQuestions(
            @PathVariable Long testId,
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "false") boolean showAnswers) {
        List<McqQuestion> questions = mcqRepo.findByCodingTestIdOrderByOrderIndexAsc(testId);
        List<McqAnswer> userAnswers = user != null ? answerRepo.findByUserIdAndCodingTestId(user.getId(), testId) : List.of();
        Map<Long, McqAnswer> answerMap = userAnswers.stream().collect(Collectors.toMap(a -> a.getMcqQuestion().getId(), a -> a, (a, b) -> b));

        boolean isTeacher = user != null && (user.getRole() == Role.TEACHER || user.getRole() == Role.ADMIN);

        List<Map<String, Object>> result = new ArrayList<>();
        for (McqQuestion q : questions) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", q.getId());
            m.put("question", q.getQuestion());
            m.put("optionA", q.getOptionA());
            m.put("optionB", q.getOptionB());
            m.put("optionC", q.getOptionC());
            m.put("optionD", q.getOptionD());
            m.put("marks", q.getMarks());

            if (showAnswers || isTeacher) {
                m.put("correctOption", q.getCorrectOption());
                m.put("explanation", q.getExplanation());
            }

            McqAnswer ans = answerMap.get(q.getId());
            if (ans != null) {
                m.put("selectedOption", ans.getSelectedOption());
                m.put("isCorrect", ans.isCorrect());
            }

            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/answer")
    @Transactional
    public ResponseEntity<?> submitAnswer(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        Long questionId = ((Number) body.get("questionId")).longValue();
        String selected = (String) body.get("selectedOption");

        // null selectedOption means "Clear Answer" — delete the existing record if any
        if (selected == null || selected.isBlank()) {
            answerRepo.findByUserIdAndMcqQuestionId(user.getId(), questionId)
                    .ifPresent(answerRepo::delete);
            return ResponseEntity.ok(Map.of("cleared", true, "message", "Answer cleared"));
        }

        McqQuestion mcq = mcqRepo.findById(questionId).orElseThrow();
        boolean correct = mcq.getCorrectOption() != null && mcq.getCorrectOption().equalsIgnoreCase(selected);

        McqAnswer answer = answerRepo.findByUserIdAndMcqQuestionId(user.getId(), questionId).orElse(new McqAnswer());
        answer.setUser(user);
        answer.setMcqQuestion(mcq);
        answer.setCodingTest(mcq.getCodingTest());
        answer.setSelectedOption(selected);
        answer.setCorrect(correct);
        answerRepo.save(answer);

        return ResponseEntity.ok(Map.of("correct", correct, "message", correct ? "Correct!" : "Wrong answer"));
    }

    @DeleteMapping("/tests/{testId}/reset")
    @Transactional
    public ResponseEntity<?> resetAnswers(@PathVariable Long testId, @AuthenticationPrincipal User user) {
        answerRepo.deleteByUserIdAndCodingTestId(user.getId(), testId);
        return ResponseEntity.ok(Map.of("message", "All MCQ answers reset"));
    }

    @GetMapping("/tests/{testId}/score")
    public ResponseEntity<Map<String, Object>> getScore(@PathVariable Long testId, @AuthenticationPrincipal User user) {
        List<McqQuestion> questions = mcqRepo.findByCodingTestIdOrderByOrderIndexAsc(testId);
        List<McqAnswer> answers = answerRepo.findByUserIdAndCodingTestId(user.getId(), testId);
        int total = questions.size();
        int answered = answers.size();
        int correct = (int) answers.stream().filter(McqAnswer::isCorrect).count();
        int totalMarks = questions.stream().mapToInt(McqQuestion::getMarks).sum();
        int scored = answers.stream().filter(McqAnswer::isCorrect).mapToInt(a -> a.getMcqQuestion().getMarks()).sum();

        return ResponseEntity.ok(Map.of("total", total, "answered", answered, "correct", correct, "totalMarks", totalMarks, "scored", scored));
    }
}
