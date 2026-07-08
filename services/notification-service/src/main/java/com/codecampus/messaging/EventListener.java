package com.codecampus.messaging;

import com.codecampus.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Listens to all codecampus domain events and delegates to NotificationService.
 */
@Component
public class EventListener {
    private static final Logger log = LoggerFactory.getLogger(EventListener.class);
    private final NotificationService notificationService;

    public EventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = RabbitConfig.NOTIFICATION_QUEUE)
    public void handleEvent(Map<String, Object> event) {
        String type = (String) event.getOrDefault("eventType", "UNKNOWN");
        log.info("Received event: {}", type);
        switch (type) {
            case "submission.accepted"  -> notificationService.handleSubmissionAccepted(event);
            case "test.published"       -> notificationService.handleTestPublished(event);
            case "plagiarism.detected"  -> notificationService.handlePlagiarismDetected(event);
            default -> log.warn("Unhandled event type: {}", type);
        }
    }
}
