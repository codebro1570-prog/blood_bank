package com.bloodbank.request.dto;

import com.bloodbank.common.enums.RequestPriority;
import com.bloodbank.common.enums.RequestStatus;

import java.time.Instant;
import java.util.List;

public record RequestResponse(
        Long id,
        String requestNo,
        HospitalRef hospital,
        String bloodGroup,
        Integer unitsRequested,
        RequestPriority priority,
        RequestStatus status,
        Instant requiredBy,
        String patientNote,
        String rejectionReason,
        Instant createdAt,
        Instant decidedAt,
        List<IssuedUnitSummary> issuedUnits
) {
    public record HospitalRef(Long id, String name) {}
}
