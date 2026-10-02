package com.bloodbank.admin;

import com.bloodbank.common.enums.EventType;
import com.bloodbank.common.event.DomainEvent;
import com.bloodbank.common.event.DomainEventPublisher;
import com.bloodbank.config.AppProperties;
import com.bloodbank.donor.Donor;
import com.bloodbank.donor.DonorRepository;
import com.bloodbank.donor.EligibilityService;
import com.bloodbank.donor.dto.EligibilityResponse;
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
public class EligibilityReminderJob {

    private static final Logger log = LoggerFactory.getLogger(EligibilityReminderJob.class);

    private final DonorRepository donorRepo;
    private final EligibilityService eligibilityService;
    private final DomainEventPublisher eventPublisher;
    private final AppProperties appProperties;

    public EligibilityReminderJob(DonorRepository donorRepo,
                                  EligibilityService eligibilityService,
                                  DomainEventPublisher eventPublisher,
                                  AppProperties appProperties) {
        this.donorRepo = donorRepo;
        this.eligibilityService = eligibilityService;
        this.eventPublisher = eventPublisher;
        this.appProperties = appProperties;
    }

    @Scheduled(cron = "${bloodbank.jobs.daily-alerts-cron:0 0 8 * * *}")
    @Transactional
    public void checkEligibleDonors() {
        log.info("Running daily donor eligibility reminder check...");
        LocalDate today = LocalDate.now();
        LocalDate targetDonationDate = today.minusDays(appProperties.getDonationGapDays());

        List<Donor> donors = donorRepo.findAll();
        for (Donor donor : donors) {
            boolean justEligible = (donor.getLastDonationDate() != null && donor.getLastDonationDate().equals(targetDonationDate))
                    || (donor.getDeferredUntil() != null && donor.getDeferredUntil().equals(today));

            if (justEligible) {
                EligibilityResponse elig = eligibilityService.evaluate(donor);
                if (elig.eligible()) {
                    eventPublisher.publish(new DomainEvent(
                            EventType.DONOR_ELIGIBLE_AGAIN,
                            Map.of(
                                    "donorId", donor.getId(),
                                    "userId", donor.getUser().getId()
                            ),
                            Instant.now()
                    ));
                }
            }
        }
    }
}
