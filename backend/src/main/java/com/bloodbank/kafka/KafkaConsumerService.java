package com.bloodbank.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class KafkaConsumerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerService.class);

    @KafkaListener(
            topics = "${app.kafka.topic:bloodbank-domain-events}",
            groupId = "${app.kafka.group-id:bloodbank-consumer-group}"
    )
    public void consumeDomainEvent(
            @Payload String payload,
            @Header(value = KafkaHeaders.RECEIVED_KEY, required = false) String key,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset
    ) {
        log.info("Kafka consumer received event on partition [{}] offset [{}] key [{}]: payload length={}",
                partition, offset, key, payload.length());
        // Real-time asynchronous streaming processing hook (notifications, analytics, external integrations)
    }
}
