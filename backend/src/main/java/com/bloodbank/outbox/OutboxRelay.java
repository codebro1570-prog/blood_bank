package com.bloodbank.outbox;

import com.bloodbank.notification.NotificationEventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class OutboxRelay {

    private static final Logger log = LoggerFactory.getLogger(OutboxRelay.class);

    private final OutboxRepository outboxRepo;
    private final NotificationEventHandler eventHandler;
    private final com.bloodbank.kafka.KafkaProducerService kafkaProducerService;

    public OutboxRelay(OutboxRepository outboxRepo,
                       NotificationEventHandler eventHandler,
                       com.bloodbank.kafka.KafkaProducerService kafkaProducerService) {
        this.outboxRepo = outboxRepo;
        this.eventHandler = eventHandler;
        this.kafkaProducerService = kafkaProducerService;
    }

    @Scheduled(fixedDelayString = "${bloodbank.jobs.outbox-delay-ms:5000}")
    @Transactional
    public void relay() {
        List<OutboxEvent> events = outboxRepo.lockUnprocessedEvents(50);
        if (events.isEmpty()) return;

        for (OutboxEvent event : events) {
            try {
                eventHandler.handle(event);
                if (kafkaProducerService != null && kafkaProducerService.isEnabled()) {
                    kafkaProducerService.sendDomainEvent(
                            event.getEventType(),
                            String.valueOf(event.getId()),
                            event.getPayload()
                    );
                }
                event.setProcessedAt(Instant.now());
            } catch (Exception e) {
                event.setAttempts(event.getAttempts() + 1);
                String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                event.setLastError(msg.length() > 250 ? msg.substring(0, 247) + "..." : msg);
                log.warn("Failed processing outbox event {} (attempt {}): {}", event.getId(), event.getAttempts(), msg);
            }
            outboxRepo.save(event);
        }
    }
}
