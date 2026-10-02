package com.bloodbank.admin;

import com.bloodbank.common.enums.EventType;
import com.bloodbank.common.event.DomainEvent;
import com.bloodbank.common.event.DomainEventPublisher;
import com.bloodbank.config.AppProperties;
import com.bloodbank.inventory.BloodInventory;
import com.bloodbank.inventory.InventoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
public class NearExpiryAlertJob {

    private static final Logger log = LoggerFactory.getLogger(NearExpiryAlertJob.class);

    private final InventoryRepository inventoryRepo;
    private final DomainEventPublisher eventPublisher;
    private final AppProperties appProperties;

    public NearExpiryAlertJob(InventoryRepository inventoryRepo,
                              DomainEventPublisher eventPublisher,
                              AppProperties appProperties) {
        this.inventoryRepo = inventoryRepo;
        this.eventPublisher = eventPublisher;
        this.appProperties = appProperties;
    }

    @Scheduled(cron = "${bloodbank.jobs.daily-alerts-cron:0 0 8 * * *}")
    @Transactional
    public void checkNearExpiry() {
        log.info("Running daily near-expiry check...");
        LocalDate today = LocalDate.now();
        LocalDate threshold = today.plusDays(appProperties.getNearExpiryAlertDays());

        List<BloodInventory> nearExpiryUnits = inventoryRepo.findNearExpiry(today, threshold);
        for (BloodInventory unit : nearExpiryUnits) {
            eventPublisher.publish(new DomainEvent(
                    EventType.UNIT_NEAR_EXPIRY,
                    Map.of(
                            "unitNumber", unit.getUnitNumber(),
                            "bloodGroup", unit.getBloodGroup().getCode(),
                            "expiryDate", unit.getExpiryDate().toString()
                    ),
                    Instant.now()
            ));
        }
    }
}
