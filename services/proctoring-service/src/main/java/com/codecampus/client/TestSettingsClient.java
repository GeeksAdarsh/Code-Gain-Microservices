package com.codecampus.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Fetches test settings (e.g. maxTabSwitches) from test-service via internal REST.
 * Falls back to safe defaults when test-service is unreachable.
 */
@Component
public class TestSettingsClient {
    private static final Logger log = LoggerFactory.getLogger(TestSettingsClient.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.test.url:http://test-service:8084}")
    private String testServiceUrl;

    public int getMaxTabSwitches(Long testId) {
        try {
            String url = testServiceUrl + "/internal/tests/" + testId + "/settings";
            @SuppressWarnings("unchecked")
            Map<String, Object> settings = restTemplate.getForObject(url, Map.class);
            if (settings != null && settings.get("maxTabSwitches") != null) {
                return ((Number) settings.get("maxTabSwitches")).intValue();
            }
        } catch (Exception e) {
            log.warn("Could not fetch test settings for testId={}: {}", testId, e.getMessage());
        }
        return 7;
    }

    public boolean isProctoringEnabled(Long testId) {
        try {
            String url = testServiceUrl + "/internal/tests/" + testId + "/settings";
            @SuppressWarnings("unchecked")
            Map<String, Object> settings = restTemplate.getForObject(url, Map.class);
            if (settings != null && settings.get("proctoringEnabled") != null) {
                return Boolean.TRUE.equals(settings.get("proctoringEnabled"));
            }
        } catch (Exception e) {
            log.warn("Could not fetch proctoring status for testId={}: {}", testId, e.getMessage());
        }
        return true;
    }
}
