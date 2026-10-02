package com.bloodbank.hospital;

import com.bloodbank.audit.AuditRecorder;
import com.bloodbank.common.dto.PageResponse;
import com.bloodbank.common.enums.ApprovalStatus;
import com.bloodbank.common.enums.EventType;
import com.bloodbank.common.event.DomainEvent;
import com.bloodbank.common.event.DomainEventPublisher;
import com.bloodbank.exception.HospitalNotApprovedException;
import com.bloodbank.exception.InvalidStateException;
import com.bloodbank.exception.ResourceNotFoundException;
import com.bloodbank.hospital.dto.HospitalDecisionRequest;
import com.bloodbank.hospital.dto.HospitalResponse;
import com.bloodbank.hospital.dto.UpdateHospitalRequest;
import com.bloodbank.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@Transactional
public class HospitalService {

    private final HospitalRepository hospitals;
    private final DomainEventPublisher eventPublisher;
    private final AuditRecorder auditRecorder;

    public HospitalService(HospitalRepository hospitals,
                           DomainEventPublisher eventPublisher,
                           AuditRecorder auditRecorder) {
        this.hospitals = hospitals;
        this.eventPublisher = eventPublisher;
        this.auditRecorder = auditRecorder;
    }

    @Transactional(readOnly = true)
    public HospitalResponse getMine() {
        Long userId = SecurityUtils.currentUserId();
        Hospital h = hospitals.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));
        return HospitalResponse.from(h);
    }

    public HospitalResponse updateMine(UpdateHospitalRequest req) {
        Long userId = SecurityUtils.currentUserId();
        Hospital h = hospitals.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found"));

        if (req.contactPerson() != null) h.setContactPerson(req.contactPerson().trim());
        if (req.phone() != null) h.setPhone(req.phone().trim());
        if (req.address() != null) h.setAddress(req.address().trim());
        if (req.city() != null) h.setCity(req.city().trim());

        return HospitalResponse.from(hospitals.save(h));
    }

    @Transactional(readOnly = true)
    public PageResponse<HospitalResponse> list(ApprovalStatus status, String q, Pageable pageable) {
        String query = (q == null || q.isBlank()) ? null : q.trim();
        Page<Hospital> page = hospitals.search(status, query, pageable);
        return PageResponse.from(page, HospitalResponse::from);
    }

    @Transactional(readOnly = true)
    public HospitalResponse getById(Long id) {
        Hospital h = hospitals.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with id " + id));
        return HospitalResponse.from(h);
    }

    @Transactional(readOnly = true)
    public Hospital getEntityById(Long id) {
        return hospitals.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with id " + id));
    }

    @Transactional(readOnly = true)
    public Hospital getByUserId(Long userId) {
        return hospitals.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found for user id " + userId));
    }

    @Transactional(readOnly = true)
    public Hospital requireApproved(Long hospitalId) {
        Hospital h = getEntityById(hospitalId);
        if (h.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new HospitalNotApprovedException("Hospital is not approved (status: " + h.getApprovalStatus() + ")");
        }
        return h;
    }

    public HospitalResponse decide(Long id, HospitalDecisionRequest req) {
        Hospital h = getEntityById(id);
        ApprovalStatus from = h.getApprovalStatus();
        ApprovalStatus to = req.effectiveDecision();

        boolean allowed = switch (from) {
            case PENDING -> to == ApprovalStatus.APPROVED || to == ApprovalStatus.REJECTED;
            case APPROVED -> to == ApprovalStatus.SUSPENDED;
            case SUSPENDED, REJECTED -> to == ApprovalStatus.APPROVED;
        };

        if (!allowed) {
            throw new InvalidStateException("Invalid approval state transition from " + from + " to " + to);
        }

        if ((to == ApprovalStatus.REJECTED || to == ApprovalStatus.SUSPENDED) && (req.reason() == null || req.reason().isBlank())) {
            throw new InvalidStateException("Reason is required when rejecting or suspending a hospital");
        }

        Long adminId = SecurityUtils.currentUserId();
        Instant now = Instant.now();

        h.setApprovalStatus(to);
        h.setDecisionReason(req.reason() != null ? req.reason().trim() : null);
        h.setDecidedBy(adminId);
        h.setDecidedAt(now);
        h = hospitals.save(h);

        eventPublisher.publish(new DomainEvent(
                EventType.HOSPITAL_DECIDED,
                Map.of("hospitalId", h.getId(), "status", to.name(), "userId", h.getUserId()),
                now
        ));

        auditRecorder.record("HOSPITAL_DECISION", "HOSPITAL", h.getId(),
                "Decision: " + to + ", reason: " + h.getDecisionReason());

        return HospitalResponse.from(h);
    }
}