package com.codecampus.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Fetches submission data from execution-service via internal REST.
 * Used by integrity-service for plagiarism checks.
 */
@Component
public class SubmissionServiceClient {
    private static final Logger log = LoggerFactory.getLogger(SubmissionServiceClient.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.execution.url:http://execution-service:8085}")
    private String executionServiceUrl;

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getSubmissionsForTest(Long testId) {
        try {
            List<Map<String, Object>> result = restTemplate.getForObject(
                    executionServiceUrl + "/internal/submissions/test/" + testId, List.class);
            return result != null ? result : List.of();
        } catch (Exception e) {
            log.warn("Could not fetch submissions for testId={} from execution-service: {}", testId, e.getMessage());
            return List.of();
        }
    }
}
