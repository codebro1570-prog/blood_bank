package com.bloodbank.donation.dto;

import com.bloodbank.common.enums.ScreeningStatus;
import jakarta.validation.constraints.NotNull;

public record ScreeningRequest(
        @NotNull(message = "status is required")
        ScreeningStatus status,

        String failureReason
) {
}
