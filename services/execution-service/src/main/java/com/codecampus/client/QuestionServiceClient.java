package com.codecampus.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Fetches question and test-case data from question-service via internal REST.
 * Complements the local QuestionRepository — use this when local data is absent
 * or when you need data that question-service is the source of truth for.
 */
@Component
public class QuestionServiceClient {
    private static final Logger log = LoggerFactory.getLogger(QuestionServiceClient.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.question.url:http://question-service:8083}")
    private String questionServiceUrl;

    @SuppressWarnings("unchecked")
    public Map<String, Object> getQuestion(Long questionId) {
        try {
            return restTemplate.getForObject(
                    questionServiceUrl + "/internal/questions/" + questionId, Map.class);
        } catch (Exception e) {
            log.warn("Could not fetch question {} from question-service: {}", questionId, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getQuestions(List<Long> ids) {
        try {
            String idsParam = ids.stream().map(Object::toString)
                    .reduce((a, b) -> a + "," + b).orElse("");
            return restTemplate.getForObject(
                    questionServiceUrl + "/internal/questions/batch?ids=" + idsParam, List.class);
        } catch (Exception e) {
            log.warn("Could not fetch questions from question-service: {}", e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getTestCases(Long questionId) {
        try {
            Map<String, Object> q = restTemplate.getForObject(
                    questionServiceUrl + "/internal/questions/" + questionId, Map.class);
            if (q != null && q.get("testCases") instanceof List) {
                return (List<Map<String, Object>>) q.get("testCases");
            }
        } catch (Exception e) {
            log.warn("Could not fetch test cases for question {} from question-service: {}", questionId, e.getMessage());
        }
        return List.of();
    }
}
