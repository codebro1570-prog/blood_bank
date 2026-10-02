package com.bloodbank.request;

import com.bloodbank.bloodgroup.BloodGroup;
import com.bloodbank.common.enums.RequestPriority;
import com.bloodbank.common.enums.RequestStatus;
import com.bloodbank.hospital.Hospital;
import com.bloodbank.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "blood_request")
public class BloodRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_no", length = 25, nullable = false, unique = true)
    private String requestNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blood_group_id", nullable = false)
    private BloodGroup bloodGroup;

    @Column(name = "units_requested", nullable = false)
    private Integer unitsRequested;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 10, nullable = false)
    private RequestPriority priority = RequestPriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 12, nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "required_by", nullable = false)
    private Instant requiredBy;

    @Column(name = "patient_note")
    private String patientNote;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "idempotency_key", length = 64)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by")
    private User decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "fulfilled_at")
    private Instant fulfilledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public BloodRequest() {}

    public BloodRequest(String requestNo, Hospital hospital, BloodGroup bloodGroup,
                        Integer unitsRequested, RequestPriority priority,
                        Instant requiredBy, String patientNote, String idempotencyKey) {
        this.requestNo = requestNo;
        this.hospital = hospital;
        this.bloodGroup = bloodGroup;
        this.unitsRequested = unitsRequested;
        this.priority = priority;
        this.requiredBy = requiredBy;
        this.patientNote = patientNote;
        this.idempotencyKey = idempotencyKey;
        this.status = RequestStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRequestNo() { return requestNo; }
    public void setRequestNo(String requestNo) { this.requestNo = requestNo; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public BloodGroup getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(BloodGroup bloodGroup) { this.bloodGroup = bloodGroup; }

    public Integer getUnitsRequested() { return unitsRequested; }
    public void setUnitsRequested(Integer unitsRequested) { this.unitsRequested = unitsRequested; }

    public RequestPriority getPriority() { return priority; }
    public void setPriority(RequestPriority priority) { this.priority = priority; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public Instant getRequiredBy() { return requiredBy; }
    public void setRequiredBy(Instant requiredBy) { this.requiredBy = requiredBy; }

    public String getPatientNote() { return patientNote; }
    public void setPatientNote(String patientNote) { this.patientNote = patientNote; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public User getDecidedBy() { return decidedBy; }
    public void setDecidedBy(User decidedBy) { this.decidedBy = decidedBy; }

    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }

    public Instant getFulfilledAt() { return fulfilledAt; }
    public void setFulfilledAt(Instant fulfilledAt) { this.fulfilledAt = fulfilledAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
