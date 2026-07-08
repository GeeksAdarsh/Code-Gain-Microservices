package com.codecampus.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ topology for notification-service (consumer).
 */
@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "codecampus.events";
    public static final String NOTIFICATION_QUEUE = "notification.queue";
    public static final String SUBMISSION_KEY = "submission.accepted";
    public static final String TEST_PUBLISHED_KEY = "test.published";
    public static final String PLAGIARISM_KEY = "plagiarism.detected";

    @Bean
    public TopicExchange codecampusExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE, true);
    }

    @Bean
    public Binding submissionBinding(Queue notificationQueue, TopicExchange codecampusExchange) {
        return BindingBuilder.bind(notificationQueue).to(codecampusExchange).with(SUBMISSION_KEY);
    }

    @Bean
    public Binding testPublishedBinding(Queue notificationQueue, TopicExchange codecampusExchange) {
        return BindingBuilder.bind(notificationQueue).to(codecampusExchange).with(TEST_PUBLISHED_KEY);
    }

    @Bean
    public Binding plagiarismBinding(Queue notificationQueue, TopicExchange codecampusExchange) {
        return BindingBuilder.bind(notificationQueue).to(codecampusExchange).with(PLAGIARISM_KEY);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
