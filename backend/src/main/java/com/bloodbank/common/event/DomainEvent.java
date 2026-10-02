package com.bloodbank.common.event;

import com.bloodbank.common.enums.EventType;
import java.time.Instant;
import java.util.Map;

public record DomainEvent(String eventType, Map<String, Object> payload, Instant occurredAt) {
    public DomainEvent(String eventType, Map<String, Object> payload) {
        this(eventType, payload, Instant.now());
    }

    public DomainEvent(EventType type, Map<String, Object> payload, Instant occurredAt) {
        this(type.name(), payload, occurredAt);
    }

    public DomainEvent(EventType type, Map<String, Object> payload) {
        this(type.name(), payload, Instant.now());
    }
}