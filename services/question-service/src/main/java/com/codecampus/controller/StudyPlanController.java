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
    private volatile List<Map<String, Object>> plansCache = null;

    public StudyPlanController(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
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

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> plan : plans) {
            Map<String, Object> p = new HashMap<>(plan);
            @SuppressWarnings("unchecked")
            List<String> questionTitles = (List<String>) plan.getOrDefault("questions", List.of());
            int total = (int) questionTitles.stream().filter(t -> questionIdByTitle.containsKey(t)).count();
            p.put("totalQuestions", total);
            p.put("solvedQuestions", 0);
            p.put("progress", 0);
            p.remove("questions");
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

        @SuppressWarnings("unchecked")
        List<String> questionTitles = (List<String>) plan.getOrDefault("questions", List.of());
        List<Map<String, Object>> questionsList = new ArrayList<>();
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
                qMap.put("solved", false);
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
        result.put("solvedQuestions", 0);
        result.put("progress", 0);
        return ResponseEntity.ok(result);
    }
}
