package com.bloodbank.donation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RecordDonationRequest(
        @NotNull(message = "donorId is required")
        Long donorId,

        @NotNull(message = "donationDate is required")
        LocalDate donationDate,

        @NotNull(message = "volumeMl is required")
        @Min(value = 300, message = "volumeMl must be at least 300")
        @Max(value = 500, message = "volumeMl must be at most 500")
        Integer volumeMl,

        String notes
) {
}
