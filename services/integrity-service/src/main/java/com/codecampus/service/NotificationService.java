package com.codecampus.service;

import com.codecampus.messaging.RabbitConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Integrity-service local NotificationService — publishes plagiarism.detected events
 * to RabbitMQ instead of writing directly to a notification DB.
 */
@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final RabbitTemplate rabbitTemplate;

    public NotificationService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void notifyPlagiarismDetected(Long testId, String detailMessage) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "plagiarism.detected");
            if (testId != null) event.put("testId", testId);
            event.put("message", detailMessage);
            rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, "plagiarism.detected", event);
            log.debug("Published plagiarism.detected event for testId={}", testId);
        } catch (Exception e) {
            log.warn("Could not publish plagiarism.detected event: {}", e.getMessage());
        }
    }
}
