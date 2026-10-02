package com.bloodbank.issue;

import com.bloodbank.audit.AuditRecorder;
import com.bloodbank.bloodgroup.BloodGroupService;
import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.EventType;
import com.bloodbank.common.enums.RequestPriority;
import com.bloodbank.common.enums.RequestStatus;
import com.bloodbank.common.enums.UnitStatus;
import com.bloodbank.common.event.DomainEvent;
import com.bloodbank.common.event.DomainEventPublisher;
import com.bloodbank.exception.InsufficientStockException;
import com.bloodbank.exception.InvalidStateException;
import com.bloodbank.exception.ResourceNotFoundException;
import com.bloodbank.hospital.Hospital;
import com.bloodbank.hospital.HospitalRepository;
import com.bloodbank.inventory.BloodInventory;
import com.bloodbank.inventory.InventoryRepository;
import com.bloodbank.issue.dto.IssueRecordResponse;
import com.bloodbank.issue.dto.IssueResult;
import com.bloodbank.request.BloodRequest;
import com.bloodbank.request.RequestRepository;
import com.bloodbank.request.RequestStateMachine;
import com.bloodbank.request.dto.IssuedUnitSummary;
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
import java.util.*;

@Service
@Transactional
public class IssueService {

    private final RequestRepository requestRepo;
    private final InventoryRepository inventoryRepo;
    private final IssueRepository issueRepo;
    private final BloodGroupService bloodGroupService;
    private final HospitalRepository hospitalRepo;
    private final UserRepository userRepo;
    private final RequestStateMachine stateMachine;
    private final DomainEventPublisher eventPublisher;
    private final AuditRecorder auditRecorder;

    public IssueService(RequestRepository requestRepo,
                        InventoryRepository inventoryRepo,
                        IssueRepository issueRepo,
                        BloodGroupService bloodGroupService,
                        HospitalRepository hospitalRepo,
                        UserRepository userRepo,
                        RequestStateMachine stateMachine,
                        DomainEventPublisher eventPublisher,
                        AuditRecorder auditRecorder) {
        this.requestRepo = requestRepo;
        this.inventoryRepo = inventoryRepo;
        this.issueRepo = issueRepo;
        this.bloodGroupService = bloodGroupService;
        this.hospitalRepo = hospitalRepo;
        this.userRepo = userRepo;
        this.stateMachine = stateMachine;
        this.eventPublisher = eventPublisher;
        this.auditRecorder = auditRecorder;
    }

    @CacheEvict(value = "stock_summary", allEntries = true)
    public IssueResult issueBlood(Long requestId) {
        return executeAtomicIssue(requestId, false);
    }

    @CacheEvict(value = "stock_summary", allEntries = true)
    public IssueResult approveAndIssue(Long requestId) {
        return executeAtomicIssue(requestId, true);
    }

    private IssueResult executeAtomicIssue(Long requestId, boolean allowPendingToFulfilled) {
        // Step 1: Pessimistic write lock on request
        BloodRequest req = requestRepo.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found with id " + requestId));

        Long currentUserId = SecurityUtils.currentUserId();
        User currentUser = userRepo.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (allowPendingToFulfilled && req.getStatus() == RequestStatus.PENDING) {
            req.setDecidedBy(currentUser);
            req.setDecidedAt(Instant.now());
            stateMachine.assertTransition(RequestStatus.PENDING, RequestStatus.FULFILLED);
        } else {
            if (req.getStatus() != RequestStatus.APPROVED) {
                throw new InvalidStateException("Request must be in APPROVED status to issue blood (current: " + req.getStatus() + ")");
            }
            stateMachine.assertTransition(RequestStatus.APPROVED, RequestStatus.FULFILLED);
        }

        // Step 2: Determine candidate blood group IDs
        Long exactGroupId = req.getBloodGroup().getId();
        Collection<Long> candidateGroupIds;
        if (req.getPriority() == RequestPriority.EMERGENCY) {
            candidateGroupIds = bloodGroupService.compatibleDonorGroupIds(exactGroupId, true);
        } else {
            candidateGroupIds = Set.of(exactGroupId);
        }

        // Step 3: Lock N units with FOR UPDATE SKIP LOCKED
        int needed = req.getUnitsRequested();
        List<BloodInventory> lockedUnits = inventoryRepo.lockAvailableUnits(
                exactGroupId,
                candidateGroupIds,
                LocalDate.now(),
                needed
        );

        if (lockedUnits.size() < needed) {
            throw new InsufficientStockException(
                    "Insufficient stock to fulfill request. Needed: " + needed + ", available: " + lockedUnits.size()
            );
        }

        Instant now = Instant.now();
        List<IssuedUnitSummary> issuedSummaries = new ArrayList<>();

        // Step 4: Mark units ISSUED and record BloodIssue
        for (BloodInventory unit : lockedUnits) {
            unit.setStatus(UnitStatus.ISSUED);
            inventoryRepo.save(unit);

            BloodIssue issue = new BloodIssue(req, unit, currentUser);
            issueRepo.save(issue);

            issuedSummaries.add(new IssuedUnitSummary(
                    unit.getUnitNumber(),
                    unit.getBloodGroup().getCode(),
                    unit.getExpiryDate()
            ));
        }

        // Step 5: Mark request FULFILLED
        req.setStatus(RequestStatus.FULFILLED);
        req.setFulfilledAt(now);
        requestRepo.save(req);

        // Step 6: Publish event and audit
        eventPublisher.publish(new DomainEvent(
                EventType.BLOOD_ISSUED,
                Map.of(
                        "requestId", req.getId(),
                        "hospitalId", req.getHospital().getId(),
                        "unitsIssued", lockedUnits.size()
                ),
                now
        ));

        auditRecorder.record("ISSUE_BLOOD", "BLOOD_REQUEST", req.getId(),
                "Issued " + lockedUnits.size() + " units for request " + req.getRequestNo());

        return new IssueResult(req.getId(), "FULFILLED", now, issuedSummaries);
    }

    @Transactional(readOnly = true)
    public List<IssuedUnitSummary> findIssuedUnitsForRequest(Long requestId) {
        return issueRepo.findByRequestId(requestId).stream()
                .map(bi -> new IssuedUnitSummary(
                        bi.getInventory().getUnitNumber(),
                        bi.getInventory().getBloodGroup().getCode(),
                        bi.getInventory().getExpiryDate()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<IssueRecordResponse> list(Pageable pageable) {
        Page<BloodIssue> page = issueRepo.search(null, pageable);
        return PageResponse.from(page, this::toRecordResponse);
    }

    @Transactional(readOnly = true)
    public PageResponse<IssueRecordResponse> listMine(Pageable pageable) {
        Long userId = SecurityUtils.currentUserId();
        Hospital hospital = hospitalRepo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
        Page<BloodIssue> page = issueRepo.search(hospital.getId(), pageable);
        return PageResponse.from(page, this::toRecordResponse);
    }

    private IssueRecordResponse toRecordResponse(BloodIssue bi) {
        BloodRequest r = bi.getRequest();
        Hospital h = r.getHospital();
        BloodInventory inv = bi.getInventory();
        User issuer = bi.getIssuedBy();
        return new IssueRecordResponse(
                bi.getId(),
                r.getId(),
                r.getRequestNo(),
                new IssueRecordResponse.HospitalRef(h.getId(), h.getName()),
                inv.getUnitNumber(),
                inv.getBloodGroup().getCode(),
                inv.getExpiryDate(),
                new IssueRecordResponse.UserRef(issuer.getId(), issuer.getEmail()),
                bi.getIssuedAt()
        );
    }
}
