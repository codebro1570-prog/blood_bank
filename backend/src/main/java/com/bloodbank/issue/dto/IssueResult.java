package com.bloodbank.issue.dto;

import com.bloodbank.request.dto.IssuedUnitSummary;

import java.time.Instant;
import java.util.List;

public record IssueResult(
        Long requestId,
        String status,
        Instant issuedAt,
        List<IssuedUnitSummary> issuedUnits
) {
}
