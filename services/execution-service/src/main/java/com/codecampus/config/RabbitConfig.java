package com.codecampus.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ topology used by execution-service (publisher).
 * Exchange: codecampus.events (topic)
 * Routing keys: submission.accepted, test.published, violation.threshold
 */
@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "codecampus.events";
    public static final String SUBMISSION_ACCEPTED_KEY = "submission.accepted";

    @Bean
    public TopicExchange codecampusExchange() {
        return new TopicExchange(EXCHANGE, true, false);
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
