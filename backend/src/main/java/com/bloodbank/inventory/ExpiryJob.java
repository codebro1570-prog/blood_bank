package com.bloodbank.inventory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(ExpiryJob.class);
    private final InventoryService inventoryService;

    public ExpiryJob(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @Scheduled(cron = "${bloodbank.jobs.expiry-cron:0 0 * * * *}")
    public void run() {
        log.info("Running blood inventory expiry job...");
        int expired = inventoryService.expireOverdueUnits();
        if (expired > 0) {
            log.info("Expired {} blood units", expired);
        }
    }
}
