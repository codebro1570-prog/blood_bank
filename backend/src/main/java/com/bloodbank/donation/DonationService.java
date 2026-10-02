package com.bloodbank.donation;

import com.bloodbank.audit.AuditRecorder;
import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.EventType;
import com.bloodbank.common.enums.ScreeningStatus;
import com.bloodbank.common.event.DomainEvent;
import com.bloodbank.common.event.DomainEventPublisher;
import com.bloodbank.common.sequence.DailySequenceService;
import com.bloodbank.config.AppProperties;
import com.bloodbank.donation.dto.DonationResponse;
import com.bloodbank.donation.dto.RecordDonationRequest;
import com.bloodbank.donation.dto.ScreeningRequest;
import com.bloodbank.donor.Donor;
import com.bloodbank.donor.DonorRepository;
import com.bloodbank.donor.EligibilityService;
import com.bloodbank.donor.dto.EligibilityResponse;
import com.bloodbank.exception.DonorNotEligibleException;
import com.bloodbank.exception.InvalidStateException;
import com.bloodbank.exception.ResourceNotFoundException;
import com.bloodbank.inventory.BloodInventory;
import com.bloodbank.inventory.InventoryRepository;
import com.bloodbank.security.SecurityUtils;
import com.bloodbank.user.User;
import com.bloodbank.user.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

@Service
@Transactional
public class DonationService {

    private final DonationRepository donationRepo;
    private final DonorRepository donorRepo;
    private final InventoryRepository inventoryRepo;
    private final UserRepository userRepo;
    private final EligibilityService eligibilityService;
    private final DailySequenceService sequenceService;
    private final DomainEventPublisher eventPublisher;
    private final AuditRecorder auditRecorder;
    private final AppProperties appProperties;

    public DonationService(DonationRepository donationRepo,
                           DonorRepository donorRepo,
                           InventoryRepository inventoryRepo,
                           UserRepository userRepo,
                           EligibilityService eligibilityService,
                           DailySequenceService sequenceService,
                           DomainEventPublisher eventPublisher,
                           AuditRecorder auditRecorder,
                           AppProperties appProperties) {
        this.donationRepo = donationRepo;
        this.donorRepo = donorRepo;
        this.inventoryRepo = inventoryRepo;
        this.userRepo = userRepo;
        this.eligibilityService = eligibilityService;
        this.sequenceService = sequenceService;
        this.eventPublisher = eventPublisher;
        this.auditRecorder = auditRecorder;
        this.appProperties = appProperties;
    }

    public DonationResponse record(RecordDonationRequest req) {
        Donor donor = donorRepo.findById(req.donorId())
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found with id " + req.donorId()));

        EligibilityResponse elig = eligibilityService.evaluate(donor);
        if (!elig.eligible()) {
            throw new DonorNotEligibleException("Donor is not currently eligible: " + String.join(", ", elig.reasons()));
        }

        if (req.donationDate().isAfter(LocalDate.now())) {
            throw new InvalidStateException("Donation date cannot be in the future");
        }

        Long currentUserId = SecurityUtils.currentUserId();
        User recorder = userRepo.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Donation donation = new Donation(donor, req.donationDate(), req.volumeMl(), req.notes(), recorder);
        donation = donationRepo.save(donation);

        eventPublisher.publish(new DomainEvent(
                EventType.DONATION_RECORDED,
                Map.of(
                        "donationId", donation.getId(),
                        "donorId", donor.getId(),
                        "userId", donor.getUser().getId()
                ),
                Instant.now()
        ));

        auditRecorder.record("RECORD_DONATION", "DONATION", donation.getId(),
                "Donation recorded: " + donation.getVolumeMl() + "ml for donor " + donor.getId());

        return toResponse(donation, null);
    }

    @CacheEvict(value = "stock_summary", allEntries = true)
    public DonationResponse updateScreening(Long donationId, ScreeningRequest req) {
        Donation donation = donationRepo.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found with id " + donationId));

        if (donation.getScreeningStatus() != ScreeningStatus.PENDING) {
            throw new InvalidStateException("Screening already completed for donation " + donationId);
        }

        Donor donor = donation.getDonor();
        String unitNumber = null;

        if (req.status() == ScreeningStatus.FAILED) {
            if (req.failureReason() == null || req.failureReason().isBlank()) {
                throw new InvalidStateException("Failure reason is required when screening fails");
            }
            donation.setScreeningStatus(ScreeningStatus.FAILED);
            donation.setFailureReason(req.failureReason().trim());
            donation.setUpdatedAt(Instant.now());

            donor.setDeferredUntil(donation.getDonationDate().plusDays(180));
            donor.setDeferredReason("Screening failed: " + req.failureReason().trim());
            donorRepo.save(donor);

            eventPublisher.publish(new DomainEvent(
                    EventType.SCREENING_FAILED,
                    Map.of(
                            "donationId", donation.getId(),
                            "donorId", donor.getId(),
                            "reason", req.failureReason().trim(),
                            "userId", donor.getUser().getId()
                    ),
                    Instant.now()
            ));

            auditRecorder.record("SCREENING_FAILED", "DONATION", donation.getId(),
                    "Screening failed: " + req.failureReason().trim());
        } else if (req.status() == ScreeningStatus.PASSED) {
            donation.setScreeningStatus(ScreeningStatus.PASSED);
            donation.setFailureReason(null);
            donation.setUpdatedAt(Instant.now());

            donor.setLastDonationDate(donation.getDonationDate());
            donor.setDeferredUntil(null);
            donor.setDeferredReason(null);
            donorRepo.save(donor);

            unitNumber = sequenceService.nextUnitNumber(donation.getDonationDate());
            LocalDate expiryDate = donation.getDonationDate().plusDays(appProperties.getShelfLifeDays());

            BloodInventory unit = new BloodInventory(
                    unitNumber,
                    donor.getBloodGroup(),
                    donation.getId(),
                    donation.getDonationDate(),
                    expiryDate
            );
            inventoryRepo.save(unit);

            auditRecorder.record("SCREENING_PASSED", "DONATION", donation.getId(),
                    "Screening passed. Unit created: " + unitNumber);
        }

        donation = donationRepo.save(donation);
        return toResponse(donation, unitNumber);
    }

    @Transactional(readOnly = true)
    public DonationResponse getById(Long id) {
        Donation d = donationRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found with id " + id));
        String unitNumber = inventoryRepo.findByDonationId(d.getId())
                .map(BloodInventory::getUnitNumber)
                .orElse(null);
        return toResponse(d, unitNumber);
    }

    @Transactional(readOnly = true)
    public PageResponse<DonationResponse> list(ScreeningStatus status, LocalDate fromDate, LocalDate toDate, Long donorId, Pageable pageable) {
        Page<Donation> page = donationRepo.search(status, fromDate, toDate, donorId, pageable);
        return PageResponse.from(page, d -> {
            String unitNo = inventoryRepo.findByDonationId(d.getId())
                    .map(BloodInventory::getUnitNumber)
                    .orElse(null);
            return toResponse(d, unitNo);
        });
    }

    @Transactional(readOnly = true)
    public PageResponse<DonationResponse> listMine(Pageable pageable) {
        Long userId = SecurityUtils.currentUserId();
        Donor donor = donorRepo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor profile not found"));
        Page<Donation> page = donationRepo.findByDonorIdOrderByDonationDateDesc(donor.getId(), pageable);
        return PageResponse.from(page, d -> {
            String unitNo = inventoryRepo.findByDonationId(d.getId())
                    .map(BloodInventory::getUnitNumber)
                    .orElse(null);
            return toResponse(d, unitNo);
        });
    }

    private DonationResponse toResponse(Donation d, String unitNumber) {
        Donor donor = d.getDonor();
        User recorder = d.getRecordedBy();
        return new DonationResponse(
                d.getId(),
                new DonationResponse.DonorRef(donor.getId(), donor.getUser().getFullName(), donor.getBloodGroup().getCode()),
                d.getDonationDate(),
                d.getVolumeMl(),
                d.getScreeningStatus(),
                d.getFailureReason(),
                unitNumber,
                new DonationResponse.UserRef(recorder.getId(), recorder.getEmail()),
                d.getCreatedAt()
        );
    }
}
