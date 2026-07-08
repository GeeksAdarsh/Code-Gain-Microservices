package com.codecampus.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Fetches user data from user-service via internal REST.
 * Used by test-service for user lookups.
 */
@Component
public class UserServiceClient {
    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.user.url:http://user-service:8082}")
    private String userServiceUrl;

    @SuppressWarnings("unchecked")
    public Map<String, Object> getUser(Long userId) {
        try {
            return restTemplate.getForObject(
                    userServiceUrl + "/internal/users/" + userId, Map.class);
        } catch (Exception e) {
            log.warn("Could not fetch user {} from user-service: {}", userId, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getUserByUsername(String username) {
        try {
            return restTemplate.getForObject(
                    userServiceUrl + "/internal/users/username/" + username, Map.class);
        } catch (Exception e) {
            log.warn("Could not fetch user {} from user-service: {}", username, e.getMessage());
            return null;
        }
    }
}
