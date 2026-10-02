package com.bloodbank.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class KafkaProducerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaProducerService.class);

    private final Optional<KafkaTemplate<String, String>> kafkaTemplate;

    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;

    @Value("${app.kafka.topic:bloodbank-domain-events}")
    private String topic;

    public KafkaProducerService(@Autowired(required = false) KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = Optional.ofNullable(kafkaTemplate);
    }

    public boolean isEnabled() {
        return kafkaEnabled && kafkaTemplate.isPresent();
    }

    public void sendDomainEvent(String eventType, String key, String payload) {
        if (!isEnabled()) {
            log.debug("Kafka is disabled; skipping publishing event: {}", eventType);
            return;
        }

        try {
            kafkaTemplate.get().send(topic, key, payload).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish domain event [{}] with key [{}] to Kafka topic [{}]: {}",
                            eventType, key, topic, ex.getMessage());
                } else {
                    log.info("Successfully published domain event [{}] to Kafka partition [{}] offset [{}]",
                            eventType,
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                }
            });
        } catch (Exception e) {
            log.error("Error initiating Kafka dispatch for event [{}]: {}", eventType, e.getMessage());
        }
    }
}
