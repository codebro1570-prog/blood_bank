package com.bloodbank.issue.dto;

import java.time.Instant;
import java.time.LocalDate;

public record IssueRecordResponse(
        Long id,
        Long requestId,
        String requestNo,
        HospitalRef hospital,
        String unitNumber,
        String bloodGroup,
        LocalDate expiryDate,
        UserRef issuedBy,
        Instant issuedAt
) {
    public record HospitalRef(Long id, String name) {}
    public record UserRef(Long id, String email) {}
}
