package com.codecampus.controller;

import com.codecampus.model.*;
import com.codecampus.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/studyplans")
public class StudyPlanController {
    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;
    private volatile List<Map<String, Object>> plansCache = null;

    public StudyPlanController(QuestionRepository questionRepository, SubmissionRepository submissionRepository) {
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
    }

    private List<Map<String, Object>> loadPlans() {
        if (plansCache != null) return plansCache;
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = new ClassPathResource("studyplans.json").getInputStream();
            plansCache = mapper.readValue(is, new TypeReference<>() {});
            return plansCache;
        } catch (Exception e) {
            return List.of();
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllPlans(@AuthenticationPrincipal User user) {
        List<Map<String, Object>> plans = loadPlans();
        List<Question> allQuestions = questionRepository.findAll();
        Map<String, Long> questionIdByTitle = allQuestions.stream()
                .collect(Collectors.toMap(Question::getTitle, Question::getId, (a, b) -> a));

        // Get user's solved question IDs
        Set<Long> solvedIds = new HashSet<>();
        if (user != null) {
            submissionRepository.findByUserId(user.getId()).stream()
                    .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED && s.getQuestion() != null)
                    .forEach(s -> solvedIds.add(s.getQuestion().getId()));
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> plan : plans) {
            Map<String, Object> p = new HashMap<>(plan);
            @SuppressWarnings("unchecked")
            List<String> questionTitles = (List<String>) plan.getOrDefault("questions", List.of());

            int total = 0, solved = 0;
            for (String title : questionTitles) {
                Long qid = questionIdByTitle.get(title);
                if (qid != null) {
                    total++;
                    if (solvedIds.contains(qid)) solved++;
                }
            }
            p.put("totalQuestions", total);
            p.put("solvedQuestions", solved);
            p.put("progress", total > 0 ? Math.round((solved * 100.0) / total) : 0);
            p.remove("questions"); // Don't send full list in overview
            result.add(p);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{planId}")
    public ResponseEntity<Map<String, Object>> getPlanDetail(
            @PathVariable String planId,
            @AuthenticationPrincipal User user) {
        List<Map<String, Object>> plans = loadPlans();
        Map<String, Object> plan = plans.stream()
                .filter(p -> planId.equals(p.get("id")))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        List<Question> allQuestions = questionRepository.findAll();
        Map<String, Question> questionByTitle = allQuestions.stream()
                .collect(Collectors.toMap(Question::getTitle, q -> q, (a, b) -> a));

        Set<Long> solvedIds = new HashSet<>();
        if (user != null) {
            submissionRepository.findByUserId(user.getId()).stream()
                    .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED && s.getQuestion() != null)
                    .forEach(s -> solvedIds.add(s.getQuestion().getId()));
        }

        @SuppressWarnings("unchecked")
        List<String> questionTitles = (List<String>) plan.getOrDefault("questions", List.of());

        List<Map<String, Object>> questionsList = new ArrayList<>();
        int solved = 0;
        for (int i = 0; i < questionTitles.size(); i++) {
            String title = questionTitles.get(i);
            Question q = questionByTitle.get(title);
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("index", i + 1);
            qMap.put("title", title);
            if (q != null) {
                qMap.put("id", q.getId());
                qMap.put("difficulty", q.getDifficulty().name());
                qMap.put("tags", q.getTags());
                boolean isSolved = solvedIds.contains(q.getId());
                qMap.put("solved", isSolved);
                if (isSolved) solved++;
                qMap.put("exists", true);
            } else {
                qMap.put("difficulty", "MEDIUM");
                qMap.put("tags", List.of());
                qMap.put("solved", false);
                qMap.put("exists", false);
            }
            questionsList.add(qMap);
        }

        Map<String, Object> result = new HashMap<>(plan);
        result.put("questions", questionsList);
        result.put("totalQuestions", questionsList.size());
        result.put("solvedQuestions", solved);
        result.put("progress", questionsList.size() > 0 ? Math.round((solved * 100.0) / questionsList.size()) : 0);
        return ResponseEntity.ok(result);
    }
}
