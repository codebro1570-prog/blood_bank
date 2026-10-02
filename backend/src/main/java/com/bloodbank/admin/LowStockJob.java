package com.bloodbank.admin;

import com.bloodbank.common.enums.EventType;
import com.bloodbank.common.event.DomainEvent;
import com.bloodbank.common.event.DomainEventPublisher;
import com.bloodbank.inventory.InventoryService;
import com.bloodbank.inventory.dto.StockSummaryRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
public class LowStockJob {

    private static final Logger log = LoggerFactory.getLogger(LowStockJob.class);

    private final InventoryService inventoryService;
    private final DomainEventPublisher eventPublisher;

    public LowStockJob(InventoryService inventoryService, DomainEventPublisher eventPublisher) {
        this.inventoryService = inventoryService;
        this.eventPublisher = eventPublisher;
    }

    @Scheduled(cron = "${bloodbank.jobs.daily-alerts-cron:0 0 8 * * *}")
    @Transactional
    public void checkLowStock() {
        log.info("Running daily low stock check...");
        List<StockSummaryRow> summary = inventoryService.summary();
        for (StockSummaryRow row : summary) {
            if (row.lowStock()) {
                eventPublisher.publish(new DomainEvent(
                        EventType.LOW_STOCK,
                        Map.of(
                                "bloodGroup", row.bloodGroup(),
                                "available", row.available(),
                                "threshold", row.threshold()
                        ),
                        Instant.now()
                ));
            }
        }
    }
}
