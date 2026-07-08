package com.codecampus.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    public static final String EXCHANGE = "codecampus.events";
    public static final String INTEGRITY_QUEUE = "integrity.queue";
    public static final String TEST_COMPLETED_KEY = "test.completed";

    @Bean TopicExchange codecampusExchange() { return new TopicExchange(EXCHANGE, true, false); }
    @Bean Queue integrityQueue() { return new Queue(INTEGRITY_QUEUE, true); }
    @Bean Binding binding(Queue integrityQueue, TopicExchange codecampusExchange) {
        return BindingBuilder.bind(integrityQueue).to(codecampusExchange).with(TEST_COMPLETED_KEY);
    }
    @Bean Jackson2JsonMessageConverter messageConverter() { return new Jackson2JsonMessageConverter(); }
    @Bean RabbitTemplate rabbitTemplate(ConnectionFactory cf) {
        RabbitTemplate t = new RabbitTemplate(cf); t.setMessageConverter(messageConverter()); return t;
    }
}
