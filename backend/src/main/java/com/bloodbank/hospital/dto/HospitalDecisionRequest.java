package com.bloodbank.hospital.dto;

import com.bloodbank.common.enums.ApprovalStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record HospitalDecisionRequest(
        ApprovalStatus decision,
        ApprovalStatus status,
        @Size(max = 255) String reason
) {
    public ApprovalStatus effectiveDecision() {
        return decision != null ? decision : status;
    }
}