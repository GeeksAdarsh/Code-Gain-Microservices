package com.codecampus.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Fetches question data from question-service via internal REST.
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
}
