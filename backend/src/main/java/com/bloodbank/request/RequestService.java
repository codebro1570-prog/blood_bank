package com.bloodbank.request;

import com.bloodbank.audit.AuditRecorder;
import com.bloodbank.bloodgroup.BloodGroup;
import com.bloodbank.bloodgroup.BloodGroupRepository;
import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.EventType;
import com.bloodbank.common.enums.RequestPriority;
import com.bloodbank.common.enums.RequestStatus;
import com.bloodbank.common.enums.Role;
import com.bloodbank.common.event.DomainEvent;
import com.bloodbank.common.event.DomainEventPublisher;
import com.bloodbank.common.idempotency.RedisIdempotencyService;
import com.bloodbank.common.sequence.DailySequenceService;
import com.bloodbank.config.AppProperties;
import com.bloodbank.exception.DuplicateRequestException;
import com.bloodbank.exception.InvalidStateException;
import com.bloodbank.exception.ResourceNotFoundException;
import com.bloodbank.hospital.Hospital;
import com.bloodbank.hospital.HospitalRepository;
import com.bloodbank.hospital.HospitalService;
import com.bloodbank.inventory.InventoryService;
import com.bloodbank.inventory.dto.AvailabilityResponse;
import com.bloodbank.issue.IssueService;
import com.bloodbank.issue.dto.IssueResult;
import com.bloodbank.request.dto.CreateRequestRequest;
import com.bloodbank.request.dto.IssuedUnitSummary;
import com.bloodbank.request.dto.RejectRequest;
import com.bloodbank.request.dto.RequestResponse;
import com.bloodbank.security.SecurityUtils;
import com.bloodbank.user.User;
import com.bloodbank.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class RequestService {

    private final RequestRepository requestRepo;
    private final HospitalRepository hospitalRepo;
    private final HospitalService hospitalService;
    private final BloodGroupRepository bloodGroupRepo;
    private final UserRepository userRepo;
    private final InventoryService inventoryService;
    private final IssueService issueService;
    private final RequestStateMachine stateMachine;
    private final DailySequenceService sequenceService;
    private final DomainEventPublisher eventPublisher;
    private final AuditRecorder auditRecorder;
    private final AppProperties appProperties;
    private final RedisIdempotencyService redisIdempotencyService;

    public RequestService(RequestRepository requestRepo,
                          HospitalRepository hospitalRepo,
                          HospitalService hospitalService,
                          BloodGroupRepository bloodGroupRepo,
                          UserRepository userRepo,
                          InventoryService inventoryService,
                          IssueService issueService,
                          RequestStateMachine stateMachine,
                          DailySequenceService sequenceService,
                          DomainEventPublisher eventPublisher,
                          AuditRecorder auditRecorder,
                          AppProperties appProperties,
                          RedisIdempotencyService redisIdempotencyService) {
        this.requestRepo = requestRepo;
        this.hospitalRepo = hospitalRepo;
        this.hospitalService = hospitalService;
        this.bloodGroupRepo = bloodGroupRepo;
        this.userRepo = userRepo;
        this.inventoryService = inventoryService;
        this.issueService = issueService;
        this.stateMachine = stateMachine;
        this.sequenceService = sequenceService;
        this.eventPublisher = eventPublisher;
        this.auditRecorder = auditRecorder;
        this.appProperties = appProperties;
        this.redisIdempotencyService = redisIdempotencyService;
    }

    public RequestResponse create(CreateRequestRequest req, String idempotencyKey) {
        Long currentUserId = SecurityUtils.currentUserId();
        Hospital hospital = hospitalRepo.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));

        hospitalService.requireApproved(hospital.getId());

        String key = (idempotencyKey != null && !idempotencyKey.isBlank()) ? idempotencyKey.trim() : null;
        String cacheKey = null;
        String lockKey = null;

        if (key != null) {
            cacheKey = redisIdempotencyService.buildHospitalKey(hospital.getId(), key);
            lockKey = redisIdempotencyService.buildLockKey(hospital.getId(), key);

            // Fast path: check distributed Redis cache first
            var cached = redisIdempotencyService.getCachedResponse(cacheKey, RequestResponse.class);
            if (cached.isPresent()) {
                return cached.get();
            }

            // Fallback: check database
            var existing = requestRepo.findByHospitalIdAndIdempotencyKey(hospital.getId(), key);
            if (existing.isPresent()) {
                RequestResponse res = toResponse(existing.get());
                redisIdempotencyService.cacheResponse(cacheKey, res);
                return res;
            }

            // Acquire short-lived distributed mutex for multi-replica concurrency protection
            redisIdempotencyService.acquireLock(lockKey, Duration.ofSeconds(30));
        }

        try {
            BloodGroup bg;
            if (req.bloodGroupId() != null) {
                bg = bloodGroupRepo.findById(req.bloodGroupId())
                        .orElseThrow(() -> new ResourceNotFoundException("Blood group not found with id " + req.bloodGroupId()));
            } else if (req.bloodGroup() != null && !req.bloodGroup().isBlank()) {
                bg = bloodGroupRepo.findByCode(req.bloodGroup().trim())
                        .orElseThrow(() -> new ResourceNotFoundException("Blood group not found: " + req.bloodGroup()));
            } else {
                throw new InvalidStateException("bloodGroup or bloodGroupId is required");
            }

            if (req.requiredBy().isBefore(Instant.now())) {
                throw new InvalidStateException("requiredBy date must be in the future");
            }

            Instant duplicateThreshold = Instant.now().minus(appProperties.getDuplicateWindowMinutes(), ChronoUnit.MINUTES);
            List<BloodRequest> openDuplicates = requestRepo.findOpenDuplicates(hospital.getId(), bg.getId(), duplicateThreshold);
            if (!openDuplicates.isEmpty()) {
                throw new DuplicateRequestException("An open request for blood group " + bg.getCode() + " already exists in window");
            }

            RequestPriority priority = req.priority() != null ? req.priority() : RequestPriority.NORMAL;
            String requestNo = sequenceService.nextRequestNumber(LocalDate.now());

            BloodRequest bloodRequest = new BloodRequest(
                    requestNo,
                    hospital,
                    bg,
                    req.unitsRequested(),
                    priority,
                    req.requiredBy(),
                    req.patientNote(),
                    key
            );

            bloodRequest = requestRepo.save(bloodRequest);

            EventType eventType = (priority == RequestPriority.EMERGENCY) ? EventType.EMERGENCY_REQUEST : EventType.REQUEST_CREATED;
            eventPublisher.publish(new DomainEvent(
                    eventType,
                    Map.of(
                            "requestId", bloodRequest.getId(),
                            "hospitalId", hospital.getId(),
                            "priority", priority.name(),
                            "bloodGroup", bg.getCode(),
                            "units", bloodRequest.getUnitsRequested()
                    ),
                    Instant.now()
            ));

            auditRecorder.record("CREATE_REQUEST", "BLOOD_REQUEST", bloodRequest.getId(),
                    "Request " + requestNo + " created for " + req.unitsRequested() + " units of " + bg.getCode());

            RequestResponse response = toResponse(bloodRequest);

            if (cacheKey != null) {
                redisIdempotencyService.cacheResponse(cacheKey, response);
            }

            return response;
        } finally {
            if (lockKey != null) {
                redisIdempotencyService.releaseLock(lockKey);
            }
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<RequestResponse> mine(RequestStatus status, Pageable pageable) {
        Long currentUserId = SecurityUtils.currentUserId();
        Hospital hospital = hospitalRepo.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
        Page<BloodRequest> page = requestRepo.findMine(hospital.getId(), status, pageable);
        return PageResponse.from(page, this::toResponse);
    }

    @Transactional(readOnly = true)
    public PageResponse<RequestResponse> queue(java.util.Collection<RequestStatus> statuses, RequestPriority priority, Pageable pageable) {
        boolean hasStatuses = statuses != null && !statuses.isEmpty();
        java.util.Collection<RequestStatus> statusList = hasStatuses ? statuses : java.util.List.of(RequestStatus.PENDING);
        Page<BloodRequest> page = requestRepo.findQueue(hasStatuses, statusList, priority, pageable);
        return PageResponse.from(page, this::toResponse);
    }

    @Transactional(readOnly = true)
    public PageResponse<RequestResponse> queue(RequestStatus status, RequestPriority priority, Pageable pageable) {
        if (status == null) {
            return queue((java.util.Collection<RequestStatus>) null, priority, pageable);
        }
        return queue(java.util.List.of(status), priority, pageable);
    }

    @Transactional(readOnly = true)
    public RequestResponse getById(Long id) {
        BloodRequest req = requestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with id " + id));

        Role currentRole = SecurityUtils.currentRole();
        if (currentRole == Role.HOSPITAL) {
            Long currentUserId = SecurityUtils.currentUserId();
            if (!req.getHospital().getUser().getId().equals(currentUserId)) {
                throw new ResourceNotFoundException("Blood request not found with id " + id);
            }
        }

        return toResponse(req);
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse getAvailability(Long id) {
        BloodRequest req = requestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with id " + id));
        boolean isEmergency = req.getPriority() == RequestPriority.EMERGENCY;
        return inventoryService.checkAvailability(req.getBloodGroup().getId(), req.getUnitsRequested(), isEmergency);
    }

    public RequestResponse approve(Long id) {
        BloodRequest req = requestRepo.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with id " + id));

        stateMachine.assertTransition(req.getStatus(), RequestStatus.APPROVED);

        Long currentUserId = SecurityUtils.currentUserId();
        User decider = userRepo.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Instant now = Instant.now();
        req.setStatus(RequestStatus.APPROVED);
        req.setDecidedBy(decider);
        req.setDecidedAt(now);
        req = requestRepo.save(req);

        eventPublisher.publish(new DomainEvent(
                EventType.REQUEST_DECIDED,
                Map.of("requestId", req.getId(), "status", "APPROVED", "hospitalId", req.getHospital().getId()),
                now
        ));

        auditRecorder.record("APPROVE_REQUEST", "BLOOD_REQUEST", req.getId(), "Request " + req.getRequestNo() + " approved");

        return toResponse(req);
    }

    public RequestResponse reject(Long id, RejectRequest reasonReq) {
        BloodRequest req = requestRepo.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with id " + id));

        stateMachine.assertTransition(req.getStatus(), RequestStatus.REJECTED);

        Long currentUserId = SecurityUtils.currentUserId();
        User decider = userRepo.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Instant now = Instant.now();
        req.setStatus(RequestStatus.REJECTED);
        req.setRejectionReason(reasonReq.reason().trim());
        req.setDecidedBy(decider);
        req.setDecidedAt(now);
        req = requestRepo.save(req);

        eventPublisher.publish(new DomainEvent(
                EventType.REQUEST_DECIDED,
                Map.of("requestId", req.getId(), "status", "REJECTED", "hospitalId", req.getHospital().getId()),
                now
        ));

        auditRecorder.record("REJECT_REQUEST", "BLOOD_REQUEST", req.getId(),
                "Request " + req.getRequestNo() + " rejected. Reason: " + reasonReq.reason().trim());

        return toResponse(req);
    }

    public RequestResponse cancel(Long id) {
        BloodRequest req = requestRepo.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with id " + id));

        Long currentUserId = SecurityUtils.currentUserId();
        if (!req.getHospital().getUser().getId().equals(currentUserId)) {
            throw new ResourceNotFoundException("Blood request not found with id " + id);
        }

        stateMachine.assertTransition(req.getStatus(), RequestStatus.CANCELLED);
        req.setStatus(RequestStatus.CANCELLED);
        req = requestRepo.save(req);

        auditRecorder.record("CANCEL_REQUEST", "BLOOD_REQUEST", req.getId(), "Request " + req.getRequestNo() + " cancelled by hospital");

        return toResponse(req);
    }

    public IssueResult issue(Long id) {
        return issueService.issueBlood(id);
    }

    public IssueResult approveAndIssue(Long id) {
        return issueService.approveAndIssue(id);
    }

    public RequestResponse toResponse(BloodRequest r) {
        List<IssuedUnitSummary> issuedUnits = Collections.emptyList();
        if (r.getStatus() == RequestStatus.FULFILLED) {
            issuedUnits = issueService.findIssuedUnitsForRequest(r.getId());
        }

        return new RequestResponse(
                r.getId(),
                r.getRequestNo(),
                new RequestResponse.HospitalRef(r.getHospital().getId(), r.getHospital().getName()),
                r.getBloodGroup().getCode(),
                r.getUnitsRequested(),
                r.getPriority(),
                r.getStatus(),
                r.getRequiredBy(),
                r.getPatientNote(),
                r.getRejectionReason(),
                r.getCreatedAt(),
                r.getDecidedAt(),
                issuedUnits
        );
    }
}
