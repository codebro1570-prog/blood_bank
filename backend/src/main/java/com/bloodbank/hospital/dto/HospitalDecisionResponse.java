package com.bloodbank.hospital.dto;

import com.bloodbank.common.enums.ApprovalStatus;
import com.bloodbank.hospital.Hospital;

public record HospitalDecisionResponse(
        Long id,
        String name,
        ApprovalStatus approvalStatus,
        String decisionReason
) {
    public static HospitalDecisionResponse from(Hospital h) {
        return new HospitalDecisionResponse(
                h.getId(),
                h.getName(),
                h.getApprovalStatus(),
                h.getDecisionReason()
        );
    }
}