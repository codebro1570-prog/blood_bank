package com.bloodbank.donation.dto;

import com.bloodbank.common.enums.ScreeningStatus;

import java.time.Instant;
import java.time.LocalDate;

public record DonationResponse(
        Long id,
        DonorRef donor,
        LocalDate donationDate,
        Integer volumeMl,
        ScreeningStatus screeningStatus,
        String failureReason,
        String unitNumber,
        UserRef recordedBy,
        Instant createdAt
) {
    public record DonorRef(Long id, String fullName, String bloodGroup) {}
    public record UserRef(Long id, String email) {}
}
