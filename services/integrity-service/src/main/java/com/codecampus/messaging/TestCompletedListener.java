package com.codecampus.messaging;

import com.codecampus.service.PlagiarismService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Triggers plagiarism check when a test completes.
 */
@Component
public class TestCompletedListener {
    private static final Logger log = LoggerFactory.getLogger(TestCompletedListener.class);
    private final PlagiarismService plagiarismService;

    public TestCompletedListener(PlagiarismService plagiarismService) {
        this.plagiarismService = plagiarismService;
    }

    @RabbitListener(queues = RabbitConfig.INTEGRITY_QUEUE)
    public void onTestCompleted(Map<String, Object> event) {
        Object raw = event.get("testId");
        if (raw == null) { log.warn("test.completed event missing testId"); return; }
        Long testId = raw instanceof Number n ? n.longValue() : Long.parseLong(raw.toString());
        log.info("Triggering plagiarism check for testId={}", testId);
        try {
            plagiarismService.runPlagiarismCheck(testId);
        } catch (Exception e) {
            log.error("Plagiarism check failed for testId={}: {}", testId, e.getMessage());
        }
    }
}
