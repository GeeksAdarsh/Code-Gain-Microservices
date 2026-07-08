package com.codecampus.service;

import com.codecampus.config.RabbitConfig;
import com.codecampus.model.Question;
import com.codecampus.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Execution-service local NotificationService — publishes events to RabbitMQ
 * instead of writing directly to a notification DB.
 * notification-service consumes these events and creates the actual DB records.
 */
@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final RabbitTemplate rabbitTemplate;

    public NotificationService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void notifySubmissionAccepted(User user, Question question, Long testId) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "submission.accepted");
            event.put("userId", user.getId());
            event.put("questionTitle", question.getTitle());
            event.put("questionId", question.getId());
            if (testId != null) event.put("testId", testId);
            rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, RabbitConfig.SUBMISSION_ACCEPTED_KEY, event);
            log.debug("Published submission.accepted event for user={} question={}", user.getId(), question.getId());
        } catch (Exception e) {
            log.warn("Could not publish submission.accepted event: {}", e.getMessage());
        }
    }
}
