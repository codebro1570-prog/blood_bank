package com.bloodbank.common.event;

public interface DomainEventPublisher {
    void publish(DomainEvent event);
}