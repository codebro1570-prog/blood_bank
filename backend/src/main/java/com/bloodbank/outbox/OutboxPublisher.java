package com.bloodbank.outbox;

import com.bloodbank.common.event.DomainEvent;
import com.bloodbank.common.event.DomainEventPublisher;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@Primary
public class OutboxPublisher implements DomainEventPublisher {

    private final OutboxRepository outboxRepo;
    private final ObjectMapper objectMapper;

    public OutboxPublisher(OutboxRepository outboxRepo, ObjectMapper objectMapper) {
        this.outboxRepo = outboxRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void publish(DomainEvent event) {
        try {
            String json = objectMapper.writeValueAsString(event.payload());
            OutboxEvent outboxEvent = new OutboxEvent(event.eventType(), json);
            outboxRepo.save(outboxEvent);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize domain event payload", e);
        }
    }
}
